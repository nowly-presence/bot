import { ServiceStatus } from "@/services/nowly-api.service";

type ServiceCurrent = {
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
  httpStatus: number | null;
} | null;

const statusOverallMessages: Record<ServiceStatus, string> = {
  operational: "All monitored services are operational.",
  slow: "Some services are slower than usual.",
  degraded: "Some services are degraded.",
  down: "At least one monitored service is down.",
  unknown: "No recent status sample is available.",
};

const statusLabels: Record<ServiceStatus, string> = {
  operational: "Operational",
  slow: "Slow",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
};

const serviceLabels: Record<string, string> = {
  website: "Website",
  api: "API",
  library: "Library",
  cdn: "CDN",
};

export const getStatusOverallMessage = (status: ServiceStatus): string => {
  return statusOverallMessages[status];
};

export const getStatusServiceLabel = (serviceId: string): string => {
  return serviceLabels[serviceId] ?? serviceId;
};

export const formatServiceStatus = (current: ServiceCurrent): string => {
  if (!current) {
    return statusLabels.unknown;
  }

  const responseMs = current.responseMs === null ? "-" : `${current.responseMs}ms`;
  const httpStatus = current.httpStatus === null ? "-" : current.httpStatus;

  return `${statusLabels[current.status]}\nHTTP ${httpStatus} - ${responseMs}`;
};