import {
  OpenTicketAlreadyExistsError,
  TicketService,
  TICKET_CATEGORY_ID,
  ticketComponentIds,
} from "@/services/ticket.service";
import { DatabaseService } from "@/services/database.service";
import {
  createTicketRatingThanks,
  parseTicketRatingComponentId,
  sendTicketRatingPrompt,
} from "@/services/ticket-feedback.service";
import { createButton, createButtonRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { Event } from "@/utils/handler/event/event.type";
import { ButtonStyle, ChannelType, Events, TextChannel } from "discord.js";

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith("ticket:rating:")) {
      await interaction.deferUpdate();
      const ratingRequest = parseTicketRatingComponentId(interaction.customId);

      if (!ratingRequest) {
        await interaction.editReply({
          content: "This rating request is invalid.",
          embeds: [],
          components: [],
        });
        return;
      }

      const channel = await interaction.client.channels.fetch(ratingRequest.ticketId).catch(() => null);

      if (!channel || channel.type !== ChannelType.GuildText || channel.parentId !== TICKET_CATEGORY_ID) {
        await interaction.editReply({
          content: "This ticket could not be found.",
          embeds: [],
          components: [],
        });
        return;
      }

      const ownerId = TicketService.getTicketOwnerId(channel.topic);

      if (ownerId !== interaction.user.id || TicketService.isOpenTicket(channel)) {
        await interaction.editReply({
          content: "This rating request is no longer available.",
          embeds: [],
          components: [],
        });
        return;
      }

      if (!DatabaseService.isConnected()) {
        await interaction.editReply({
          content: "Your rating could not be saved. Please contact the support team.",
          embeds: [],
          components: [],
        });
        return;
      }

      let inserted: boolean;

      try {
        inserted = DatabaseService.insertTicketRating(
          ratingRequest.ticketId,
          interaction.user.id,
          ratingRequest.rating,
        );
      } catch (error) {
        console.error("Failed to save ticket rating:", error);
        await interaction.editReply({
          content: "Your rating could not be saved. Please contact the support team.",
          embeds: [],
          components: [],
        });
        return;
      }

      if (!inserted) {
        await interaction.editReply({
          content: "Your rating for this ticket has already been recorded. Thank you!",
          embeds: [],
          components: [],
        });
        return;
      }

      await interaction.editReply(createTicketRatingThanks(ratingRequest.rating));
      return;
    }

    if (interaction.isButton() && interaction.customId === ticketComponentIds.create) {
      if (!interaction.guild) {
        await interaction.reply({
          content: "Tickets can only be used inside a server.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const existingTicket = await TicketService.findOpenTicket(
        interaction.guild,
        interaction.user.id,
      );

      if (existingTicket) {
        await interaction.reply({
          content: `You already have an open ticket: <#${existingTicket.id}>`,
          flags: ["Ephemeral"],
        });
        return;
      }

      await interaction.showModal(TicketService.createModal());
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === ticketComponentIds.modal) {
      const content = interaction.fields.getTextInputValue("content");

      if (!interaction.guild) {
        await interaction.reply({
          content: "Tickets can only be used inside a server.",
          flags: ["Ephemeral"],
        });
        return;
      }

      await interaction.deferReply({ flags: ["Ephemeral"] });

      try {
        const channel = await TicketService.createTicket(interaction.guild, interaction.user, content);

        await interaction.editReply({
          content: `Your ticket has been created: <#${channel.id}>`,
        });
      } catch (error) {
        if (error instanceof OpenTicketAlreadyExistsError) {
          await interaction.editReply({
            content: `You already have an open ticket: <#${error.channelId}>`,
          });
          return;
        }

        console.error(error);
        await interaction.editReply({
          content: "The ticket could not be created. Please contact an administrator.",
        });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("ticket:close:")) {
      const ownerId = interaction.customId.slice("ticket:close:".length);
      await interaction.deferReply({ flags: ["Ephemeral"] });

      if (!interaction.guild) {
        await interaction.editReply({
          content: "Tickets can only be used inside a server.",
        });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!TicketService.canCloseTicket(member, ownerId)) {
        await interaction.editReply({
          content: "You are not allowed to close this ticket.",
        });
        return;
      }

      await interaction.message.edit({
        components: [TicketService.createTicketActionsRow(ownerId, { closeDisabled: true })],
      });

      await interaction.editReply({
        content: "Are you sure you want to close this ticket? The channel will be kept, but the opener will lose access.",
        components: [
          createButtonRow(
            createButton(
              ticketComponentIds.closeConfirm(ownerId),
              "Confirm close",
              ButtonStyle.Danger
            ),
          ),
        ],
      });
      return;
    }

    if (interaction.isButton() && interaction.customId === ticketComponentIds.ai) {
      if (!interaction.guild || !interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "This action must be used inside a ticket channel.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const ownerId = TicketService.getTicketOwnerId(interaction.channel.topic);

      if (!ownerId) {
        await interaction.reply({
          content: "This action must be used inside a ticket channel.",
          flags: ["Ephemeral"],
        });
        return;
      }

      await interaction.message.edit({
        components: [TicketService.createTicketActionsRow(ownerId, { aiDisabled: true })],
      });

      await interaction.reply({
        embeds: [createNowlyEmbed(undefined, "Mention me or reply to one of my messages and I'll help using Nowly's docs.")],
      });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("ticket:close-confirm:")) {
      const ownerId = interaction.customId.slice("ticket:close-confirm:".length);
      await interaction.deferUpdate();

      if (!interaction.guild) {
        await interaction.editReply({
          content: "Tickets can only be used inside a server.",
        });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!TicketService.canCloseTicket(member, ownerId)) {
        await interaction.editReply({
          content: "You are not allowed to close this ticket.",
        });
        return;
      }

      if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
        await interaction.editReply({
          content: "This action must be used inside a ticket channel.",
        });
        return;
      }

      try {
        const channel = interaction.channel as TextChannel;
        await TicketService.closeTicket(channel, ownerId);

        if (DatabaseService.isConnected()) {
          try {
            DatabaseService.recordTicketClosure(
              channel.id,
              channel.createdTimestamp,
              Date.now(),
            );
          } catch (error) {
            console.error("Failed to record ticket closure time:", error);
          }
        }

        await sendTicketRatingPrompt(interaction.client, ownerId, interaction.channel.id);

        await interaction.editReply({
          content: "Ticket closed. A support feedback survey was sent by DM if available.",
          components: [],
        });
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: "The ticket could not be closed. Please contact an administrator.",
          components: [],
        });
      }
    }
  },
};

export default event;
