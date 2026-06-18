import { env } from "@/config/env";
import { NowlyApiService } from "@/services/nowly-api.service";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";
import { formatServiceStatus, getStatusOverallMessage, getStatusServiceLabel } from "@/utils/status";

export const execute: CommandExecute = async (command) => {
  const report = await NowlyApiService.getStatus();
  const statusUrl = `${env.NOWLY_APP_BASE_URL}/status`;
  const embed = createNowlyEmbed(
    "Nowly status",
    getStatusOverallMessage(report.overallStatus),
    statusUrl,
  ).addFields(
    report.services.map((service) => ({
      name: getStatusServiceLabel(service.id),
      value: formatServiceStatus(service.current),
      inline: true,
    })),
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(createLinkButton("Open status", statusUrl)),
    ],
  });
};