import { createButton, createButtonRow, createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { ButtonStyle, type Client, type MessageCreateOptions } from "discord.js";

export const ticketRatingComponentId = (ticketId: string, rating: number): string =>
  `ticket:rating:${ticketId}:${rating}`;

export const parseTicketRatingComponentId = (
  customId: string,
): { ticketId: string; rating: 1 | 2 | 3 | 4 | 5 } | null => {
  const match = customId.match(/^ticket:rating:(\d{17,20}):([1-5])$/);

  if (!match) {
    return null;
  }

  return {
    ticketId: match[1],
    rating: Number(match[2]) as 1 | 2 | 3 | 4 | 5,
  };
};

export const createTicketRatingPrompt = (ticketId: string): MessageCreateOptions => {
  const styles = [ButtonStyle.Danger, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Primary, ButtonStyle.Success];
  const buttons = ([1, 2, 3, 4, 5] as const).map((rating) =>
    createButton(
      ticketRatingComponentId(ticketId, rating),
      String(rating),
      styles[rating - 1],
    ),
  );

  return {
    embeds: [
      createNowlyEmbed(
        "How was your support experience?",
        "Please rate the support you received on a scale from 1 to 5.",
      ).setColor(0x62d0ff),
    ],
    components: [createButtonRow(...buttons)],
  };
};

export const createTicketRatingThanks = (rating: number) => {
  const embed = createNowlyEmbed(
    "Thank you for your feedback!",
    "Your rating helps us improve Nowly support.",
  ).setColor(0x62d0ff);

  if (rating < 3) {
    return { embeds: [embed], components: [] };
  }

  embed.setDescription(
    "Your rating helps us improve Nowly support. If you enjoy the extension, would you also leave a review?",
  );

  return {
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton(
          "Chrome Web Store",
          "https://chromewebstore.google.com/detail/nowly/kmnlnfldimgneaopdihplkebobckcjpf",
        ),
        createLinkButton(
          "Firefox Add-ons",
          "https://addons.mozilla.org/en-US/firefox/addon/nowly-presence/",
        ),
      ),
    ],
  };
};

export const sendTicketRatingPrompt = async (
  client: Client,
  ownerId: string,
  ticketId: string,
): Promise<boolean> => {
  try {
    const user = await client.users.fetch(ownerId);
    await user.send(createTicketRatingPrompt(ticketId));
    return true;
  } catch (error) {
    console.warn(`Could not send the ticket rating prompt to ${ownerId}:`, error);
    return false;
  }
};
