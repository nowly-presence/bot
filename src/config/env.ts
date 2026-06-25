type Env = {
  DISCORD_BOT_TOKEN: string;
  DISCORD_APPLICATION_ID: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_DONATOR_ROLE_ID: string;
  DISCORD_AUTO_REGISTER_COMMANDS: boolean;
  NOWLY_API_BASE_URL: string;
  NOWLY_APP_BASE_URL: string;
};

const required = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env: Env = {
  DISCORD_BOT_TOKEN: required("DISCORD_BOT_TOKEN"),
  DISCORD_APPLICATION_ID: required("DISCORD_APPLICATION_ID"),
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  DISCORD_DONATOR_ROLE_ID: process.env.DISCORD_DONATOR_ROLE_ID ?? "1517677191234715829",
  DISCORD_AUTO_REGISTER_COMMANDS: process.env.DISCORD_AUTO_REGISTER_COMMANDS !== "false",
  NOWLY_API_BASE_URL: process.env.NOWLY_API_BASE_URL ?? "https://api.nowly.me",
  NOWLY_APP_BASE_URL: process.env.NOWLY_APP_BASE_URL ?? "https://nowly.me",
};
