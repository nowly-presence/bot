import { env } from "@/config/env";
import { DatabaseService } from "@/services/database.service";
import { Client } from "discord.js";

type FeedItem = {
  id: string;
  link: string;
};

const POLL_INTERVAL_MS = 15 * 1000;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const PARIS_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};

const decodeXml = (value: string): string =>
  value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => XML_ENTITIES[name] ?? entity);

const getTagValue = (xml: string, tag: string): string | undefined => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  const value = match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();

  return value ? decodeXml(value) : undefined;
};

const parseFeedItems = (xml: string): FeedItem[] => {
  const entries = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];

  return entries.flatMap((entry) => {
    const rawId = getTagValue(entry, "guid") ?? getTagValue(entry, "id");
    const link = getTagValue(entry, "link");
    const id = link?.match(/\/status\/(\d+)/i)?.[1] ?? rawId;

    return id && link ? [{ id, link }] : [];
  });
};

const getAccountUsername = (): string => {
  if (!env.X_RSS_FEED_URL) {
    throw new Error("X_RSS_FEED_URL is not configured");
  }

  const feedUrl = new URL(env.X_RSS_FEED_URL);
  const queryUsername = feedUrl.searchParams.get("usernames");
  const pathUsername = feedUrl.pathname.match(/\/([^/]+)\/rss\/?$/i)?.[1];
  const username = queryUsername ?? pathUsername;

  if (!username || !/^[\w]{1,15}$/.test(username)) {
    throw new Error("Could not determine a valid account username from X_RSS_FEED_URL");
  }

  return username;
};

const getTweetLink = (item: FeedItem, username: string): string => {
  const statusId = item.link.match(/\/status\/(\d+)/i)?.[1] ?? item.id.match(/\d{15,}/)?.[0];

  if (!statusId) {
    throw new Error(`Could not find a tweet ID in RSS item ${item.id}`);
  }

  return `https://x.com/${username}/status/${statusId}`;
};

const getNextDailyCheckParisTime = (now: Date, scheduledTime: string): Date => {
  const [scheduledHour, scheduledMinute] = scheduledTime.split(":");
  const candidate = new Date(now.getTime() + 60_000);
  candidate.setUTCSeconds(0, 0);

  for (let minute = 0; minute < 26 * 60; minute += 1) {
    const parts = PARIS_TIME_FORMATTER.formatToParts(candidate);
    const hour = parts.find((part) => part.type === "hour")?.value;
    const minuteValue = parts.find((part) => part.type === "minute")?.value;

    if (hour === scheduledHour && minuteValue === scheduledMinute) {
      return candidate;
    }

    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error(`Could not calculate the next ${scheduledTime} Europe/Paris check`);
};

type PollApiResponse = {
  polled?: { username: string; items: number }[];
  posts?: { url: string; username: string; items: number }[];
  failed?: { username?: string; url?: string; error?: string }[];
};

class XFeedServiceClass {
  private pollTimer: NodeJS.Timeout | undefined;
  private dailyTimer: NodeJS.Timeout | undefined;
  private polling = false;
  private client: Client<true> | undefined;

  start = (client: Client<true>): void => {
    if (!env.X_RSS_FEED_URL) {
      console.log("X RSS polling disabled (X_RSS_FEED_URL is unset)");
      return;
    }

    this.client = client;
    void this.poll(client);
    this.pollTimer = setInterval(() => void this.poll(client), POLL_INTERVAL_MS);
    this.pollTimer.unref();
    const scheduledTime = DatabaseService.getXFeedSchedule();

    if (scheduledTime) {
      this.scheduleDailyCheck(client, scheduledTime);
    }

    console.log(`X RSS polling enabled (every 15 seconds${scheduledTime ? `, plus ${scheduledTime} Europe/Paris` : ""})`);
  };

  setSchedule = (scheduledTime: string): void => {
    DatabaseService.saveXFeedSchedule(scheduledTime);

    if (this.client) {
      this.scheduleDailyCheck(this.client, scheduledTime);
    }
  };

  clearCacheAndPoll = async (client: Client<true>): Promise<{ username: string; items: number; posted: number }> => {
    const username = getAccountUsername();
    const result = await this.callPollApi({ usernames: [username] });
    const failed = result.failed?.find((entry) => entry.username?.toLowerCase() === username.toLowerCase());

    if (failed) {
      throw new Error(failed.error ?? `The feed endpoint could not refresh @${username}`);
    }

    const polled = result.polled?.find((entry) => entry.username.toLowerCase() === username.toLowerCase());

    if (!polled) {
      throw new Error(`The feed endpoint did not report a refresh for @${username}`);
    }

    const posted = await this.poll(client, true);

    return { username, items: polled.items, posted };
  };

  postManually = async (client: Client<true>, tweetUrl: string): Promise<boolean> => {
    const username = getAccountUsername();
    let url: URL;

    try {
      url = new URL(tweetUrl);
    } catch {
      throw new Error("Provide a valid X post URL");
    }

    const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/|$)/i);

    if (url.protocol !== "https:" || !["x.com", "twitter.com"].includes(hostname) || !match) {
      throw new Error("Use a post URL such as https://x.com/nowlyme/status/123456789");
    }

    const [, postUsername, tweetId] = match;

    if (postUsername.toLowerCase() !== username.toLowerCase()) {
      throw new Error(`This feed tracks @${username}; the URL belongs to @${postUsername}`);
    }

    if (DatabaseService.hasSeenXFeedItem(tweetId)) {
      return false;
    }

    const canonicalUrl = `https://x.com/${username}/status/${tweetId}`;
    const result = await this.callPollApi({ post: canonicalUrl });
    const failed = result.failed?.find((entry) =>
      entry.url === canonicalUrl || entry.username?.toLowerCase() === username.toLowerCase(),
    );

    if (failed) {
      throw new Error(failed.error ?? `The feed endpoint could not cache ${canonicalUrl}`);
    }

    if (!result.posts?.some((entry) => entry.url.endsWith(`/status/${tweetId}`))) {
      throw new Error(`The feed endpoint did not report that it cached ${canonicalUrl}`);
    }

    const channel = await client.channels.fetch(env.DISCORD_X_FEED_CHANNEL_ID);

    if (!channel?.isSendable()) {
      throw new Error(`Discord channel ${env.DISCORD_X_FEED_CHANNEL_ID} is not sendable`);
    }

    await channel.send({
      content: canonicalUrl,
      allowedMentions: { parse: [] },
    });
    DatabaseService.markXFeedItemSeen(tweetId);

    return true;
  };

  private callPollApi = async (body: { usernames: string[] } | { post: string }): Promise<PollApiResponse> => {
    if (!env.X_RSS_POLL_URL || !env.X_RSS_POLL_TOKEN) {
      throw new Error("X_RSS_POLL_URL and X_RSS_POLL_TOKEN must be configured");
    }

    const response = await fetch(env.X_RSS_POLL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RSS-Poll-Token": env.X_RSS_POLL_TOKEN,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Feed refresh request failed with HTTP ${response.status}: ${message.slice(0, 300)}`);
    }

    return (await response.json()) as PollApiResponse;
  };

  private scheduleDailyCheck = (client: Client<true>, scheduledTime: string): void => {
    if (this.dailyTimer) {
      clearTimeout(this.dailyTimer);
    }

    const nextCheck = getNextDailyCheckParisTime(new Date(), scheduledTime);
    const delay = nextCheck.getTime() - Date.now();

    this.dailyTimer = setTimeout(() => {
      void this.clearCacheAndPoll(client).catch((error) => {
        console.error(`Scheduled feed refresh failed for ${scheduledTime}:`, error);
      });
      this.scheduleDailyCheck(client, scheduledTime);
    }, delay);
    this.dailyTimer.unref();
  };

  private poll = async (client: Client<true>, throwOnError = false): Promise<number> => {
    if (this.polling) {
      return 0;
    }

    this.polling = true;

    try {
      const feedUrl = new URL(env.X_RSS_FEED_URL!);
      feedUrl.searchParams.set("include_replies", "false");
      const response = await fetch(feedUrl, {
        headers: { accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`RSS request failed with HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0);

      if (contentLength > MAX_FEED_BYTES) {
        throw new Error("RSS feed exceeds the 2 MB limit");
      }

      const xml = await response.text();

      if (Buffer.byteLength(xml) > MAX_FEED_BYTES) {
        throw new Error("RSS feed exceeds the 2 MB limit");
      }

      const items = parseFeedItems(xml);

      if (items.length === 0) {
        throw new Error("RSS response contains no items; the feed may be unavailable or blocked");
      }

      const channel = await client.channels.fetch(env.DISCORD_X_FEED_CHANNEL_ID);
      const username = getAccountUsername();

      if (!channel?.isSendable()) {
        throw new Error(`Discord channel ${env.DISCORD_X_FEED_CHANNEL_ID} is not sendable`);
      }

      if (!DatabaseService.hasInitializedXFeed()) {
        for (const item of items) {
          DatabaseService.markXFeedItemSeen(item.id);
        }

        DatabaseService.markXFeedInitialized();
        console.log(`X RSS initialized with ${items.length} existing post(s)`);
        return 0;
      }

      const newItems = items.filter((item) => !DatabaseService.hasSeenXFeedItem(item.id)).reverse();

      for (const item of newItems) {
        await channel.send({ content: getTweetLink(item, username), allowedMentions: { parse: [] } });
        DatabaseService.markXFeedItemSeen(item.id);
      }

      if (newItems.length > 0) {
        console.log(`Posted ${newItems.length} new X post(s) to channel ${env.DISCORD_X_FEED_CHANNEL_ID}`);
      }
      return newItems.length;
    } catch (error) {
      console.error("Failed to poll the X RSS feed:", error);

      if (throwOnError) {
        throw error;
      }

      return 0;
    } finally {
      this.polling = false;
    }
  };
}

export const XFeedService = new XFeedServiceClass();
