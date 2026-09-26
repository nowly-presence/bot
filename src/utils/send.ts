import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const sendComponentIds = {
  modal: "send:message",
  modalPrefix: "send:message:",
};

export const parseSendModalChannelId = (customId: string): string | null => {
  if (!customId.startsWith(sendComponentIds.modalPrefix)) {
    return null;
  }

  const channelId = customId.slice(sendComponentIds.modalPrefix.length);

  return /^\d{17,20}$/.test(channelId) ? channelId : null;
};

export const createSendModal = (channelId: string): ModalBuilder => {
  const contentInput = new TextInputBuilder()
    .setCustomId("content")
    .setPlaceholder("Write the message the bot should send.")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(2000)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`${sendComponentIds.modalPrefix}${channelId}`)
    .setTitle("Send a message")
    .addLabelComponents(
      new LabelBuilder().setLabel("Message").setTextInputComponent(contentInput),
    );
};
