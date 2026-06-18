import { env } from "@/config/env";
import { NowlyApiService } from "@/services/nowly-api.service";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { normalizeSlug } from "@/utils/format";
import { AutocompleteExecute, CommandExecute } from "@/utils/handler/command";
import { findPresence, getPresenceMetadata, searchPresences } from "@/utils/presence";
import { createPresenceEmbed } from "@/utils/presence-embed";

export const autocomplete: AutocompleteExecute = async (interaction) => {
  const focused = interaction.options.getFocused().toLowerCase();

  try {
    const presences = await NowlyApiService.listPresences();
    const choices = searchPresences(presences, focused).slice(0, 25).map((presence) => ({
      name: `${presence.name ?? presence.slug} (${presence.slug})`.slice(0, 100),
      value: presence.slug,
    }));

    await interaction.respond(choices);
  } catch (error) {
    console.error(error);
    await interaction.respond([]);
  }
};

export const execute: CommandExecute = async (command) => {
  const query = normalizeSlug(command.options.getString("query", true));
  const presences = await NowlyApiService.listPresences();
  const match = findPresence(presences, query);

  if (!match) {
    await command.reply({
      content: `No Nowly presence found for \`${query}\`.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  const release = await NowlyApiService.getPresence(match.slug);
  const presence = getPresenceMetadata(release ?? match);
  const appUrl = `${env.NOWLY_APP_BASE_URL}/presences/${presence.slug}`;

  await command.reply({
    embeds: [createPresenceEmbed(presence)],
    components: [
      createLinkRow(
        createLinkButton("Open presence", appUrl),
        createLinkButton("Open library", `${env.NOWLY_APP_BASE_URL}/presences`),
      ),
    ],
  });
};