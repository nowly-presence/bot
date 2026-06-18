import {
  OpenTicketAlreadyExistsError,
  TicketService,
  ticketComponentIds,
} from "@/services/ticket.service";
import { createButton, createButtonRow } from "@/utils/components";
import { Event } from "@/utils/handler/event/event.type";
import { ButtonStyle, ChannelType, Events, TextChannel } from "discord.js";

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {
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

      if (!interaction.guild) {
        await interaction.reply({
          content: "Tickets can only be used inside a server.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!TicketService.canCloseTicket(member, ownerId)) {
        await interaction.reply({
          content: "You are not allowed to close this ticket.",
          flags: ["Ephemeral"],
        });
        return;
      }

      await interaction.message.edit({
        components: [TicketService.createCloseTicketRow(ownerId, true)],
      });

      await interaction.reply({
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
        flags: ["Ephemeral"],
      });
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("ticket:close-confirm:")) {
      const ownerId = interaction.customId.slice("ticket:close-confirm:".length);

      if (!interaction.guild) {
        await interaction.reply({
          content: "Tickets can only be used inside a server.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!TicketService.canCloseTicket(member, ownerId)) {
        await interaction.reply({
          content: "You are not allowed to close this ticket.",
          flags: ["Ephemeral"],
        });
        return;
      }

      if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: "This action must be used inside a ticket channel.",
          flags: ["Ephemeral"],
        });
        return;
      }

      try {
        await TicketService.closeTicket(interaction.channel as TextChannel, ownerId);

        await interaction.update({
          content: "Ticket closed. The opener can no longer read this channel.",
          components: [],
        });
      } catch (error) {
        console.error(error);
        await interaction.update({
          content: "The ticket could not be closed. Please contact an administrator.",
          components: [],
        });
      }
    }
  },
};

export default event;
