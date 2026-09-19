import { env } from "@/config/env";
import { createButton, createButtonRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { LabelBuilder } from "@discordjs/builders";
import {
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  Client,
  EmbedBuilder,
  Guild,
  GuildMember,
  ModalBuilder,
  PermissionFlagsBits,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  User,
} from "discord.js";

const SUPPORT_CHANNEL_ID = env.DISCORD_SUPPORT_CHANNEL_ID;
export const TICKET_CATEGORY_ID = env.DISCORD_TICKET_CATEGORY_ID;
const TICKET_NUMBER_LENGTH = 4;
const TICKET_CHANNEL_NUMBER_REGEX = /-(?:closed-)?ticket-(\d{4})$/;

export const ticketComponentIds = {
  create: "ticket:create",
  modal: "ticket:modal",
  ai: "ticket:ai",
  close: (userId: string): string => `ticket:close:${userId}`,
  closeConfirm: (userId: string): string => `ticket:close-confirm:${userId}`,
};

export class OpenTicketAlreadyExistsError extends Error {
  constructor(readonly channelId: string) {
    super(`User already has an open ticket: ${channelId}`);
    this.name = "OpenTicketAlreadyExistsError";
  }
}

class TicketServiceClass {
  ensureSupportPanel = async (client: Client<true>): Promise<void> => {
    const channel = await client.channels.fetch(SUPPORT_CHANNEL_ID);

    if (!channel || !channel.isTextBased() || channel.type !== ChannelType.GuildText) {
      throw new Error(`Support channel ${SUPPORT_CHANNEL_ID} is not a text channel`);
    }

    const messages = await channel.messages.fetch({ limit: 20 });
    const existingPanel = messages.find((message) => message.author.id === client.user.id);

    if (existingPanel) {
      return;
    }

    await channel.send({
      embeds: [
        createNowlyEmbed(
          "Nowly support",
          "Need help? Open a ticket and describe your issue. The support team will answer you in a private channel.",
        ),
      ],
      components: [
        createButtonRow(
          createButton(ticketComponentIds.create, "Open a ticket", ButtonStyle.Primary),
        ),
      ],
    });
  };

  createModal = (): ModalBuilder => {
    const contentInput = new TextInputBuilder()
      .setCustomId("content")
      .setPlaceholder("Describe your issue or request with as much context as possible.")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1500)
      .setRequired(true);

    return new ModalBuilder()
      .setCustomId(ticketComponentIds.modal)
      .setTitle("Open a support ticket")
      .addLabelComponents(
        new LabelBuilder().setLabel("Description").setTextInputComponent(contentInput),
      );
  };

  createTicketActionsRow = (
    ownerId: string,
    options: { closeDisabled?: boolean; aiDisabled?: boolean } = {},
  ): ReturnType<typeof createButtonRow> => {
    return createButtonRow(
      createButton(
        ticketComponentIds.close(ownerId),
        "Close ticket",
        ButtonStyle.Danger,
        options.closeDisabled ?? false,
      ),
      createButton(
        ticketComponentIds.ai,
        "Fix with AI",
        ButtonStyle.Secondary,
        options.aiDisabled ?? false,
      ),
    );
  };

  createTicket = async (
    guild: Guild,
    user: User,
    content: string,
  ): Promise<TextChannel> => {
    const existingTicket = await this.findOpenTicket(guild, user.id);

    if (existingTicket) {
      throw new OpenTicketAlreadyExistsError(existingTicket.id);
    }

    const category = await this.getTicketCategory(guild);
    const ticketNumber = await this.getNextTicketNumber(guild);
    const channelName = `${this.sanitizeUsername(user.username)}-ticket-${this.formatTicketNumber(ticketNumber)}`;

    const permissionOverwrites = [
      ...category.permissionOverwrites.cache
        .filter((overwrite) => overwrite.id !== guild.roles.everyone.id)
        .map((overwrite) => ({
          id: overwrite.id,
          allow: overwrite.allow,
          deny: overwrite.deny,
          type: overwrite.type,
        })),
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `ticket-owner:${user.id}`,
      permissionOverwrites,
    });

    await channel.send({
      embeds: [this.createTicketEmbed(user, content)],
      components: [this.createTicketActionsRow(user.id)],
    });

    return channel;
  };

  getTicketOwnerId = (topic: string | null | undefined): string | null => {
    if (!topic?.startsWith("ticket-owner:")) {
      return null;
    }

    return topic.slice("ticket-owner:".length);
  };

  findOpenTicket = async (guild: Guild, userId: string): Promise<TextChannel | null> => {
    const channels = await guild.channels.fetch();

    for (const channel of channels.values()) {
      if (
        !channel ||
        channel.type !== ChannelType.GuildText ||
        channel.parentId !== TICKET_CATEGORY_ID ||
        channel.topic !== `ticket-owner:${userId}`
      ) {
        continue;
      }

      const userOverwrite = channel.permissionOverwrites.cache.get(userId);

      if (
        userOverwrite?.allow.has(PermissionFlagsBits.ViewChannel) &&
        !userOverwrite.deny.has(PermissionFlagsBits.ViewChannel)
      ) {
        return channel;
      }
    }

    return null;
  };

  canCloseTicket = (member: GuildMember, ownerId: string): boolean => {
    return member.id === ownerId || member.permissions.has(PermissionFlagsBits.ManageChannels);
  };

  closeTicket = async (channel: TextChannel, ownerId: string): Promise<void> => {
    await channel.permissionOverwrites.edit(ownerId, {
      ViewChannel: false,
      SendMessages: false,
    });

    const closedChannelName = this.getClosedTicketChannelName(channel.name);

    if (closedChannelName !== channel.name) {
      await channel.setName(closedChannelName, "Ticket closed");
    }
  };

  private createTicketEmbed = (
    user: User,
    content: string,
  ): EmbedBuilder => {
    return createNowlyEmbed()
      .setAuthor({
        name: `${user.username} opened a ticket`,
        iconURL: user.displayAvatarURL(),
      })
      .setDescription(this.formatBlockValue(content));
  };

  private formatBlockValue = (value: string): string => {
    const formatted = value.trim() || "No details provided.";
    return formatted.length > 3500 ? `${formatted.slice(0, 3497)}...` : formatted;
  };

  private getTicketCategory = async (guild: Guild): Promise<CategoryChannel> => {
    const channel = await guild.channels.fetch(TICKET_CATEGORY_ID);

    if (!channel || channel.type !== ChannelType.GuildCategory) {
      throw new Error(`Ticket category ${TICKET_CATEGORY_ID} is not a category`);
    }

    return channel;
  };

  private getNextTicketNumber = async (guild: Guild): Promise<number> => {
    const channels = await guild.channels.fetch();
    let highest = 0;

    channels.forEach((channel) => {
      if (!channel || channel.parentId !== TICKET_CATEGORY_ID) {
        return;
      }

      const match = channel.name.match(TICKET_CHANNEL_NUMBER_REGEX);

      if (!match) {
        return;
      }

      const number = Number(match[1]);

      if (Number.isFinite(number) && number > highest) {
        highest = number;
      }
    });

    return highest + 1;
  };

  private sanitizeUsername = (username: string): string => {
    const sanitized = username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70);

    return sanitized || "user";
  };

  private formatTicketNumber = (ticketNumber: number): string => {
    return ticketNumber.toString().padStart(TICKET_NUMBER_LENGTH, "0");
  };

  private getClosedTicketChannelName = (channelName: string): string => {
    if (/-closed-ticket-\d{4}$/.test(channelName)) {
      return channelName;
    }

    const closedName = channelName.replace(/-ticket-(\d{4})$/, "-closed-ticket-$1");

    return closedName.slice(0, 100);
  };
}

export const TicketService = new TicketServiceClass();
