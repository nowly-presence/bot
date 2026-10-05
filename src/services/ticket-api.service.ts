import { env } from "@/config/env";
import { TICKET_CATEGORY_ID, TicketService } from "@/services/ticket.service";
import { ChannelType, type Client, type Message, type TextChannel } from "discord.js";
import { createHmac, timingSafeEqual } from "crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";

export const createTicketApiAccessKey = (ticketId: string): string => {
  if (!env.DISCORD_TICKET_API_KEY) {
    return "";
  }

  return createHmac("sha256", env.DISCORD_TICKET_API_KEY)
    .update(`nowly-ticket:${ticketId}`)
    .digest("hex");
};

class TicketApiServiceClass {
  private server: Server | null = null;

  start = (client: Client): void => {
    if (!env.DISCORD_TICKET_API_KEY) {
      console.warn("Ticket transcript API is disabled because DISCORD_TICKET_API_KEY is not configured");
      return;
    }

    if (this.server) {
      return;
    }

    this.server = createServer((request, response) => {
      void this.handleRequest(client, request, response).catch((error) => {
        console.error("Ticket transcript API request failed:", error);

        if (!response.headersSent) {
          this.respond(response, 500, "Internal server error");
          return;
        }

        response.end();
      });
    });

    this.server.on("error", (error) => {
      console.error("Ticket transcript API server error:", error);
    });

    this.server.listen(env.DISCORD_TICKET_API_PORT, "0.0.0.0", () => {
      console.log(`Ticket transcript API listening on port ${env.DISCORD_TICKET_API_PORT}`);
    });
  };

  private handleRequest = async (
    client: Client,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (request.method !== "GET") {
      response.setHeader("Allow", "GET");
      this.respond(response, 405, "Method not allowed");
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      this.respondJson(response, 200, {
        service: "Nowly Ticket Transcript API",
        status: "ok",
        transcript: "GET /api/tickets/<channel-id>.md",
        authentication: "Authorization: Bearer <ticket-scoped-key>",
      });
      return;
    }

    if (url.pathname === "/healthz") {
      this.respondJson(response, 200, {
        service: "Nowly Ticket Transcript API",
        status: "ok",
      });
      return;
    }

    const match = url.pathname.match(/^\/api\/tickets\/(\d{17,20})\.md$/);

    if (!match) {
      this.respond(response, 404, "Not found");
      return;
    }

    if (!this.hasValidApiKey(request, match[1])) {
      this.respond(response, 401, "Unauthorized");
      return;
    }

    const channel = await client.channels.fetch(match[1]).catch(() => null);

    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      channel.parentId !== TICKET_CATEGORY_ID ||
      !TicketService.getTicketOwnerId(channel.topic) ||
      !TicketService.isOpenTicket(channel)
    ) {
      this.respond(response, 404, "Open ticket not found");
      return;
    }

    const transcript = await this.createTranscript(client, channel);

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="ticket-${channel.id}.md"`,
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(transcript);
  };

  private hasValidApiKey = (request: IncomingMessage, ticketId: string): boolean => {
    const authorization = request.headers.authorization;
    const match = typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(.+)$/i)
      : null;

    if (!match || !env.DISCORD_TICKET_API_KEY) {
      return false;
    }

    const expected = Buffer.from(createTicketApiAccessKey(ticketId));
    const actual = Buffer.from(match[1]);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  };

  private createTranscript = async (client: Client, channel: TextChannel): Promise<string> => {
    const ownerId = TicketService.getTicketOwnerId(channel.topic) ?? "unknown";
    const owner = await client.users.fetch(ownerId).catch(() => null);
    const messages: Message[] = [];
    let before: string | undefined;

    while (true) {
      const page = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {}),
      });

      if (page.size === 0) {
        break;
      }

      messages.push(...page.values());
      before = [...page.values()].reduce((oldest, message) =>
        message.createdTimestamp < oldest.createdTimestamp ? message : oldest,
      ).id;

      if (page.size < 100 || !before) {
        break;
      }
    }

    messages.sort((left, right) => left.createdTimestamp - right.createdTimestamp);

    const header = [
      "# Support ticket transcript",
      "",
      `- Ticket: ${channel.name} (${channel.id})`,
      `- Guild: ${channel.guild.name} (${channel.guild.id})`,
      `- Owner: ${owner?.username ?? "Unknown user"} (${ownerId})`,
      `- Exported at: ${new Date().toISOString()}`,
      `- Messages: ${messages.length}`,
      "",
      "---",
      "",
    ];

    return [...header, ...messages.map((message) => this.formatMessage(message))].join("\n");
  };

  private formatMessage = (message: Message): string => {
    const author = `${message.author.username} (${message.author.id})${message.author.bot ? " [bot]" : ""}`;
    const body = message.content.trim() || "_(No text content)_";
    const attachments = [...message.attachments.values()].map((attachment) => {
      const contentType = attachment.contentType ? `, ${attachment.contentType}` : "";
      const proxy = attachment.proxyURL !== attachment.url
        ? `\n  - Proxy URL: ${attachment.proxyURL}`
        : "";

      return `- Attachment: ${attachment.name} (${attachment.size} bytes${contentType})\n  - URL: ${attachment.url}${proxy}`;
    });
    const stickers = [...message.stickers.values()].map((sticker) =>
      `- Sticker: ${sticker.name}\n  - URL: ${sticker.url}`,
    );
    const embeds = message.embeds.map((embed, index) => {
      const lines = [
        `### Embedded content ${index + 1}`,
        ...(embed.title ? [`Title: ${embed.title}`] : []),
        ...(embed.description ? [`Description: ${embed.description}`] : []),
        ...(embed.url ? [`URL: ${embed.url}`] : []),
        ...embed.fields.map((field) => `${field.name}: ${field.value}`),
        ...(embed.image?.url ? [`Image: ${embed.image.url}`] : []),
        ...(embed.thumbnail?.url ? [`Thumbnail: ${embed.thumbnail.url}`] : []),
        ...(embed.video?.url ? [`Video: ${embed.video.url}`] : []),
      ];

      return lines.join("\n");
    });
    const sections = [
      `## ${new Date(message.createdTimestamp).toISOString()} — ${author}`,
      "",
      body,
      ...attachments,
      ...stickers,
      ...embeds,
    ];

    return `${sections.join("\n\n")}\n\n---\n`;
  };

  private respond = (response: ServerResponse, status: number, message: string): void => {
    response.writeHead(status, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(message);
  };

  private respondJson = (response: ServerResponse, status: number, body: unknown): void => {
    response.writeHead(status, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(body));
  };
}

export const TicketApiService = new TicketApiServiceClass();
