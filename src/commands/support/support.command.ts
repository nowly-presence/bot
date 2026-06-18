import { env } from "@/config/env";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";

export const execute: CommandExecute = async (command) => {
  const supportUrl = `${env.NOWLY_APP_BASE_URL}/support`;
  const statusUrl = `${env.NOWLY_APP_BASE_URL}/status`;

  const embed = createNowlyEmbed(
    "Nowly support",
    "Need help with Nowly, the extension, or a presence? Open the support page and include as much context as possible.",
    supportUrl,
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton("Open support", supportUrl),
        createLinkButton("Open status", statusUrl),
      ),
    ],
    flags: ["Ephemeral"],
  });
};