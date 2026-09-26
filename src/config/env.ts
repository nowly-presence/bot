type Env = {
  DISCORD_BOT_TOKEN: string;
  DISCORD_APPLICATION_ID: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_DONATOR_ROLE_ID: string;
  DISCORD_MEMBER_ROLE_ID: string;
  DISCORD_SUPPORT_CHANNEL_ID: string;
  DISCORD_TICKET_CATEGORY_ID: string;
  DISCORD_WELCOME_CHANNEL_ID?: string;
  DISCORD_DB_PATH: string;
  DISCORD_AUTO_REGISTER_COMMANDS: boolean;
  NOWLY_API_BASE_URL: string;
  NOWLY_APP_BASE_URL: string;
  OPENAI_API_KEY?: string;
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
  DISCORD_MEMBER_ROLE_ID: process.env.DISCORD_MEMBER_ROLE_ID ?? "1516939000605315212",
  DISCORD_SUPPORT_CHANNEL_ID: process.env.DISCORD_SUPPORT_CHANNEL_ID ?? "1516932454848401599",
  DISCORD_TICKET_CATEGORY_ID: process.env.DISCORD_TICKET_CATEGORY_ID ?? "1516932920361750781",
  DISCORD_WELCOME_CHANNEL_ID: process.env.DISCORD_WELCOME_CHANNEL_ID,
  DISCORD_DB_PATH: process.env.DISCORD_DB_PATH ?? "./.data/discord.sqlite",
  DISCORD_AUTO_REGISTER_COMMANDS: process.env.DISCORD_AUTO_REGISTER_COMMANDS !== "false",
  NOWLY_API_BASE_URL: process.env.NOWLY_API_BASE_URL ?? "https://api.nowly.me",
  NOWLY_APP_BASE_URL: process.env.NOWLY_APP_BASE_URL ?? "https://nowly.me",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
