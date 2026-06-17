import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import { Locale } from "@/types/locale";
import { LocalizationMap } from "discord.js";

type MessageValue = string | MessageTree;

type MessageTree = {
  [key: string]: MessageValue;
};

type Replacements = Record<string, string | number>;

const messages: Record<Locale, MessageTree> = { en, fr, es };

export const t = (locale: Locale, key: string, replacements: Replacements = {}): string => {
  const value = getMessage(messages[locale], key) ?? getMessage(messages.en, key);
  if (typeof value !== "string") return key;

  return Object.entries(replacements).reduce((message, [name, replacement]) => {
    return message.replaceAll(`{${name}}`, String(replacement));
  }, value);
};

export const discordLocalizations = (key: string): LocalizationMap => {
  return {
    fr: t("fr", key),
    "es-ES": t("es", key),
  };
};

const getMessage = (tree: MessageTree, key: string): MessageValue | undefined => {
  return key.split(".").reduce<MessageValue | undefined>((current, part) => {
    if (!current || typeof current === "string") {
      return undefined;
    }

    return current[part];
  }, tree);
};