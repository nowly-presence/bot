import { env } from "@/config/env";
import { LocaleService } from "@/services/locale.service";
import { NowlyApiService, ServiceStatus } from "@/services/nowly-api.service";
import { Locale } from "@/types/locale";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";
import { t } from "@/utils/i18n";

type ServiceCurrent = {
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
  httpStatus: number | null;
} | null;

export const execute: CommandExecute = async (command) => {
  await LocaleService.load();

  const locale = LocaleService.getInteractionLocale(command);
  const report = await NowlyApiService.getStatus();
  const statusUrl = `${env.NOWLY_APP_BASE_URL}/status`;
  const embed = createNowlyEmbed(
    t(locale, "statusTitle"),
    t(locale, `statusOverall.${report.overallStatus}`),
    statusUrl,
  ).addFields(
    report.services.map((service) => ({
      name: t(locale, `services.${service.id}`),
      value: formatServiceStatus(locale, service.current),
      inline: true,
    })),
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(createLinkButton(t(locale, "openStatus"), statusUrl)),
    ],
  });
};

const formatServiceStatus = (locale: Locale, current: ServiceCurrent): string => {
  if (!current) {
    return t(locale, "statusStates.unknown");
  }

  const responseMs = current.responseMs === null ? "-" : `${current.responseMs}ms`;
  const httpStatus = current.httpStatus === null ? "-" : current.httpStatus;

  return t(locale, "statusServiceLine", {
    status: t(locale, `statusStates.${current.status}`),
    responseMs,
    httpStatus,
  });
};