import { env } from "@/config/env";
import { NowlyApiService } from "@/services/nowly-api.service";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";

export const execute: CommandExecute = async (command) => {
  const key = command.options.getString("key", true).trim();

  if (!command.guild || !command.member) {
    await command.reply({
      content: "This command can only be used inside the Nowly Discord server.",
      flags: ["Ephemeral"],
    });
    return;
  }

  await command.deferReply({ flags: ["Ephemeral"] });

  const status = await NowlyApiService.verifyCode(key).catch(() => null);
  if (!status?.valid) {
    await command.editReply({
      content: "This supporter key is invalid or no longer active.",
    });
    return;
  }

  const member = await command.guild.members.fetch(command.user.id);
  await member.roles.add(env.DISCORD_DONATOR_ROLE_ID, "Nowly supporter key verified");

  const embed = createNowlyEmbed(
    "Donor role claimed",
    "Your supporter key is active. The donor role has been added to your Discord account.",
    env.NOWLY_APP_BASE_URL,
  );

  await command.editReply({ embeds: [embed] });
};
