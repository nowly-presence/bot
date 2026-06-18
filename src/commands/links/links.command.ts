import { env } from "@/config/env";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";

export const execute: CommandExecute = async (command) => {
  const embed = createNowlyEmbed(
    "Nowly links",
    "Useful Nowly pages.",
    env.NOWLY_APP_BASE_URL,
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton("Website", env.NOWLY_APP_BASE_URL),
        createLinkButton("Open library", `${env.NOWLY_APP_BASE_URL}/presences`),
        createLinkButton("Open status", `${env.NOWLY_APP_BASE_URL}/status`),
      ),
    ],
  });
};