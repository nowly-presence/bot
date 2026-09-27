import { env } from "@/config/env";
import { DatabaseService } from "@/services/database.service";
import { Client } from "discord.js";

export type Social = "x" | "bluesky";

type FeedItem = {
  id: string;
  link: string;
  social: Social;
};

type PollApiResponse = {
  polled?: { username: string; items: number }[];
  posts?: { url: string; username: string; items: number }[];
  failed?: { username?: string; url?: string; error?: string }[];
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

    if (!rawId || !link) {
      return [];
    }

    const parsedUrl = new URL(link);
    const social: Social = parsedUrl.hostname.toLowerCase() === "bsky.app" ? "bluesky" : "x";
    const xPostId = link.match(/\/status\/(\d+)/i)?.[1];
    const bskyPostPath = parsedUrl.pathname.match(/^\/profile\/([^/]+)\/post\/([^/]+)/i);
    const id = social === "x"
      ? xPostId ?? rawId
      : `bluesky:${bskyPostPath?.[1] ?? ""}/${bskyPostPath?.[2] ?? rawId}`;

    return [{ id, link, social }];
  });
};

const getSocialHandles = (social: Social): string[] => {
  if (!env.SOCIAL_FEED_URL) {
    throw new Error("SOCIAL_FEED_URL is not configured");
  }

  const feedUrl = new URL(env.SOCIAL_FEED_URL);
  const parameter = social === "x" ? "usernames" : "bluesky";
  const handles = feedUrl.searchParams.get(parameter)?.split(",").map((handle) => handle.trim()).filter(Boolean) ?? [];

  if (handles.length === 0) {
    throw new Error(`No ${social === "x" ? "X usernames" : "Bluesky handles"} are configured in SOCIAL_FEED_URL`);
  }

  return handles;
};

const getConfiguredSocials = (): Social[] => {
  if (!env.SOCIAL_FEED_URL) {
    return [];
  }

  const feedUrl = new URL(env.SOCIAL_FEED_URL);
  const configured: Social[] = [];

  if (feedUrl.searchParams.get("usernames")) configured.push("x");
  if (feedUrl.searchParams.get("bluesky")) configured.push("bluesky");

  return configured;
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

const getManualPostDetails = (social: Social, postUrl: string): { canonicalUrl: string; id: string } => {
  let url: URL;

  try {
    url = new URL(postUrl);
  } catch {
    throw new Error("Provide a valid post URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Post URL must use HTTPS");
  }

  if (social === "x") {
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)(?:\/|$)/i);

    if (!["x.com", "twitter.com"].includes(host) || !match) {
      throw new Error("Use an X post URL such as https://x.com/handle/status/123456789");
    }

    const handles = getSocialHandles("x");
    const [, author, postId] = match;

    if (!handles.some((handle) => author.toLowerCase() === handle.toLowerCase())) {
      throw new Error(`This feed does not track @${author}`);
    }

    return { canonicalUrl: `https://x.com/${author}/status/${postId}`, id: postId };
  }

  if (url.hostname.toLowerCase() !== "bsky.app") {
    throw new Error("Use a Bluesky post URL such as https://bsky.app/profile/handle.bsky.social/post/id");
  }

  const match = url.pathname.match(/^\/profile\/([^/]+)\/post\/([^/]+)/i);

  if (!match) {
    throw new Error("The Bluesky URL must point to a post");
  }

  const [, author, postId] = match;
  const trackedHandles = getSocialHandles("bluesky").map((handle) => {
    try {
      return new URL(handle).pathname.split("/").filter(Boolean).at(-1) ?? handle;
    } catch {
      return handle;
    }
  });

  if (!trackedHandles.some((handle) => handle.toLowerCase() === author.toLowerCase())) {
    throw new Error(`This feed does not track Bluesky account ${author}`);
  }

  return {
    canonicalUrl: `https://bsky.app/profile/${author}/post/${postId}`,
    id: `bluesky:${author}/${postId}`,
  };
};

class SocialFeedServiceClass {
  private pollTimer: NodeJS.Timeout | undefined;
  private scheduleTimers: Partial<Record<Social, NodeJS.Timeout>> = {};
  private polling = false;
  private client: Client<true> | undefined;
  private missingChannelWarnings = new Set<Social>();

  start = (client: Client<true>): void => {
    if (!env.SOCIAL_FEED_URL) {
      console.log("Social feed polling disabled (SOCIAL_FEED_URL is unset)");
      return;
    }

    this.client = client;
    void this.poll(client);
    this.pollTimer = setInterval(() => void this.poll(client), POLL_INTERVAL_MS);
    this.pollTimer.unref();

    for (const social of ["x", "bluesky"] as const) {
      const scheduledTime = DatabaseService.getSocialFeedSchedule(social);

      if (scheduledTime) {
        this.scheduleDailyCheck(client, social, scheduledTime);
      }
    }

    console.log("Social feed polling enabled (every 15 seconds)");
  };

  setSchedule = (social: Social, scheduledTime: string): void => {
    DatabaseService.saveSocialFeedSchedule(social, scheduledTime);

    if (this.client) {
      this.scheduleDailyCheck(this.client, social, scheduledTime);
    }
  };

  assertSocialConfigured = (social: Social): void => {
    getSocialHandles(social);

    if (!this.getChannelId(social)) {
      throw new Error(`The Discord channel for ${social} is not configured`);
    }
  };

  clearCacheAndPoll = async (
    client: Client<true>,
    social: Social,
  ): Promise<{ items: number; posted: number }> => {
    this.assertSocialConfigured(social);
    const handles = getSocialHandles(social);
    const request = social === "x" ? { usernames: handles } : { bluesky: handles };
    const result = await this.callPollApi(request);
    const failed = result.failed?.find((entry) =>
      handles.some((handle) => handle.toLowerCase() === entry.username?.toLowerCase()),
    );

    if (failed) {
      throw new Error(failed.error ?? `The ${social} feed could not be refreshed`);
    }

    const polled = result.polled?.filter((entry) =>
      handles.some((handle) => handle.toLowerCase() === entry.username.toLowerCase()),
    ) ?? [];

    if (polled.length === 0) {
      throw new Error(`The feed endpoint did not report a refresh for ${social}`);
    }

    const posted = await this.poll(client, true);

    return { items: polled.reduce((total, entry) => total + entry.items, 0), posted };
  };

  postManually = async (client: Client<true>, social: Social, postUrl: string): Promise<void> => {
    this.assertSocialConfigured(social);
    const { canonicalUrl, id } = getManualPostDetails(social, postUrl);
    const result = await this.callPollApi({ post: canonicalUrl });
    const trackedHandles = getSocialHandles(social).map((handle) => handle.toLowerCase());
    const failed = result.failed?.find((entry) =>
      entry.url === canonicalUrl || trackedHandles.includes(entry.username?.toLowerCase() ?? ""),
    );

    if (failed) {
      throw new Error(failed.error ?? `The feed endpoint could not cache ${canonicalUrl}`);
    }

    if (!result.posts?.some((entry) => entry.url.endsWith(new URL(canonicalUrl).pathname))) {
      throw new Error(`The feed endpoint did not report that it cached ${canonicalUrl}`);
    }

    const channel = await this.getChannel(client, social);
    const message = social === "x"
      ? `<:x_twitter:1553757705842335744> New post on [X](${canonicalUrl})`
      : `<:bluesky:1553757684585726072> New post on [Bluesky](${canonicalUrl})`;

    const sentMessage = await channel.send({ content: message, allowedMentions: { parse: [] } });
    await sentMessage.react("1553762914954125453").catch((error) => {
      console.warn("Could not add the like reaction to the social post:", error);
    });
    await sentMessage.react("1553763368622366873").catch((error) => {
      console.warn("Could not add the repost reaction to the social post:", error);
    });
    DatabaseService.markXFeedItemSeen(id);
  };

  private callPollApi = async (
    body: { usernames: string[] } | { bluesky: string[] } | { post: string },
  ): Promise<PollApiResponse> => {
    if (!env.X_RSS_POLL_URL || !env.X_RSS_POLL_TOKEN) {
      throw new Error("The private poll endpoint URL and token must be configured");
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

  private scheduleDailyCheck = (client: Client<true>, social: Social, scheduledTime: string): void => {
    const timer = this.scheduleTimers[social];

    if (timer) {
      clearTimeout(timer);
    }

    const nextCheck = getNextDailyCheckParisTime(new Date(), scheduledTime);
    const delay = nextCheck.getTime() - Date.now();

    this.scheduleTimers[social] = setTimeout(() => {
      void this.clearCacheAndPoll(client, social).catch((error) => {
        console.error(`Scheduled ${social} feed refresh failed for ${scheduledTime}:`, error);
      });
      this.scheduleDailyCheck(client, social, scheduledTime);
    }, delay);
    this.scheduleTimers[social]?.unref();
  };

  private getChannelId = (social: Social): string | undefined =>
    social === "x"
      ? env.DISCORD_X_FEED_CHANNEL_ID
      : env.DISCORD_BLUESKY_FEED_CHANNEL_ID;

  private getChannel = async (client: Client<true>, social: Social) => {
    const channelId = this.getChannelId(social);

    if (!channelId) {
      throw new Error(`DISCORD_${social.toUpperCase()}_FEED_CHANNEL_ID is not configured`);
    }

    const channel = await client.channels.fetch(channelId);

    if (!channel?.isSendable()) {
      throw new Error(`Discord channel ${channelId} is not sendable`);
    }

    return channel;
  };

  private poll = async (client: Client<true>, throwOnError = false): Promise<number> => {
    if (this.polling) {
      return 0;
    }

    this.polling = true;

    try {
      const feedUrl = new URL(env.SOCIAL_FEED_URL!);
      feedUrl.searchParams.set("include_replies", "false");
      feedUrl.searchParams.delete("return_type");
      const response = await fetch(feedUrl, {
        headers: { accept: "application/rss+xml, application/xml, text/xml" },
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        throw new Error(`Social feed request failed with HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get("content-length") ?? 0);

      if (contentLength > MAX_FEED_BYTES) {
        throw new Error("Social feed exceeds the 2 MB limit");
      }

      const xml = await response.text();

      if (Buffer.byteLength(xml) > MAX_FEED_BYTES) {
        throw new Error("Social feed exceeds the 2 MB limit");
      }

      const items = parseFeedItems(xml);

      if (items.length === 0) {
        throw new Error("Social feed response contains no posts; the feed may be unavailable or blocked");
      }

      const newItems: FeedItem[] = [];

      for (const social of getConfiguredSocials()) {
        const socialItems = items.filter((item) => item.social === social);

        if (!DatabaseService.hasInitializedSocialFeed(social)) {
          for (const item of socialItems) {
            DatabaseService.markXFeedItemSeen(item.id);
          }

          DatabaseService.markSocialFeedInitialized(social);
          console.log(`${social} feed initialized with ${socialItems.length} existing post(s)`);
          continue;
        }

        newItems.push(...socialItems.filter((item) => !DatabaseService.hasSeenXFeedItem(item.id)));
      }

      for (const item of newItems.reverse()) {
        if (!this.getChannelId(item.social)) {
          if (!this.missingChannelWarnings.has(item.social)) {
            console.warn(`Skipped ${item.social} posts because its Discord channel is not configured`);
            this.missingChannelWarnings.add(item.social);
          }
          continue;
        }

        const channel = await this.getChannel(client, item.social);
        const link = item.social === "x"
          ? this.getXPostLink(item)
          : item.link;
        const message = item.social === "x"
          ? `<:x_twitter:1553757705842335744> New post on [X](${link})`
          : `<:bluesky:1553757684585726072> New post on [Bluesky](${link})`;

        const sentMessage = await channel.send({ content: message, allowedMentions: { parse: [] } });
        await sentMessage.react("1553762914954125453").catch((error) => {
          console.warn("Could not add the like reaction to the social post:", error);
        });
        await sentMessage.react("1553763368622366873").catch((error) => {
          console.warn("Could not add the repost reaction to the social post:", error);
        });
        DatabaseService.markXFeedItemSeen(item.id);
      }

      if (newItems.length > 0) {
        console.log(`Posted ${newItems.length} new social post(s)`);
      }

      return newItems.length;
    } catch (error) {
      console.error("Failed to poll the social feed:", error);

      if (throwOnError) {
        throw error;
      }

      return 0;
    } finally {
      this.polling = false;
    }
  };

  private getXPostLink = (item: FeedItem): string => {
    const match = item.link.match(/\/([^/]+)\/status\/(\d+)/i);

    if (!match) {
      return item.link;
    }

    return `https://x.com/${match[1]}/status/${match[2]}`;
  };
}

export const SocialFeedService = new SocialFeedServiceClass();
