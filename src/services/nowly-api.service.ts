import { env } from "@/config/env";

export type PresencePerson = {
  name?: string;
  github?: string;
};

export type PresenceSummary = {
  slug: string;
  name?: string;
  author?: string | PresencePerson;
  contributors?: PresencePerson[];
  category?: string;
  description?: Record<string, string> | string;
  assets?: {
    logo?: string;
    icon?: string;
    thumbnail?: string;
  };
  url?: string[];
  version?: string;
  totalInstalls?: number;
  activeUsers?: number;
  rating?: number;
  ratingCount?: number;
  metadata?: PresenceMetadata;
  bundle?: string;
};

export type PresenceMetadata = Omit<PresenceSummary, "metadata">;

export type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown";

export type StatusReport = {
  generatedAt: string;
  overallStatus: ServiceStatus;
  services: {
    id: string;
    current: {
      status: Exclude<ServiceStatus, "unknown">;
      responseMs: number | null;
      httpStatus: number | null;
    } | null;
  }[];
};

export type AdStatus = {
  hasAds: boolean;
  adFree: boolean;
};

class NowlyApiServiceClass {
  private readonly baseUrl = env.NOWLY_API_BASE_URL;

  request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(new URL(path, this.baseUrl), {
      ...init,
      headers: {
        accept: "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Nowly API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  listPresences = async (): Promise<PresenceSummary[]> => {
    return this.request<PresenceSummary[]>("/presences");
  };

  getPresence = async (slug: string): Promise<PresenceSummary | null> => {
    try {
      return await this.request<PresenceSummary>(`/presences/${encodeURIComponent(slug)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }

      throw error;
    }
  };

  getStatus = async (): Promise<StatusReport> => {
    return this.request<StatusReport>("/status");
  };

  getAdStatus = async (deviceId: string): Promise<AdStatus> => {
    return this.request<AdStatus>(`/ads/status?deviceId=${encodeURIComponent(deviceId)}`);
  };

  verifyCode = async (code: string): Promise<{ valid: boolean; maxDevices?: number }> => {
    return this.request<{ valid: boolean; maxDevices?: number }>(
      `/support/verify-code?code=${encodeURIComponent(code)}`,
    );
  };
}

export const NowlyApiService = new NowlyApiServiceClass();
