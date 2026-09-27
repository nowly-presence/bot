import { randomUUID } from "crypto";
import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export type SendRequest = {
  channelId: string;
  attachment?: {
    url: string;
    name: string;
  };
  color?: number;
  embed: boolean;
};

const sendRequests = new Map<string, SendRequest>();

export const sendComponentIds = {
  modal: "send:message",
  modalPrefix: "send:message:",
};

export const parseSendModalToken = (customId: string): string | null => {
  if (!customId.startsWith(sendComponentIds.modalPrefix)) {
    return null;
  }

  const token = customId.slice(sendComponentIds.modalPrefix.length);

  return /^[\da-f-]{36}$/i.test(token) ? token : null;
};

export const takeSendRequest = (token: string): SendRequest | undefined => {
  const request = sendRequests.get(token);
  sendRequests.delete(token);

  return request;
};

export const createSendModal = (request: SendRequest): ModalBuilder => {
  const token = randomUUID();
  sendRequests.set(token, request);

  const expiryTimer = setTimeout(() => sendRequests.delete(token), 15 * 60 * 1000);
  expiryTimer.unref();

  const contentInput = new TextInputBuilder()
    .setCustomId("content")
    .setPlaceholder("Write the message the bot should send.")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(1)
    .setMaxLength(2000)
    .setRequired(true);
  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setPlaceholder("Optional embed title")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(256)
    .setRequired(false);

  return new ModalBuilder()
    .setCustomId(`${sendComponentIds.modalPrefix}${token}`)
    .setTitle("Send a message")
    .addLabelComponents(
      new LabelBuilder().setLabel("Message").setTextInputComponent(contentInput),
      new LabelBuilder().setLabel("Title (optional)").setTextInputComponent(titleInput),
    );
};
