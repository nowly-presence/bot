import {
  getWelcomePack,
  WelcomeCard,
  WelcomePackName,
  WelcomeRarity,
  welcomePackNames,
  welcomePacks,
} from "@/data/welcome-cards";
import { EmbedBuilder } from "discord.js";

export const welcomeRarities: WelcomeRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "celestial",
];

// Nova has no celestial tier, so its record is partial. The genesis emoji is the
// fallback, which a nova card can never ask for since the pack holds none.
const welcomeRarityEmojis: Record<WelcomePackName, Partial<Record<WelcomeRarity, string>>> = {
  genesis: {
    common: "<:genesis_card_common:1553438193934926007>",
    rare: "<:genesis_card_rare:1553438200599675062>",
    epic: "<:genesis_card_epic:1553438195377508552>",
    legendary: "<:genesis_card_legendary:1553438196992446504>",
    mythic: "<:genesis_card_mythic:1553438198552727602>",
    celestial: "<:genesis_card_celestial:1553438192454340738>",
  },
  nova: {
    common: "<:nova_card_common:1553438166294208652>",
    rare: "<:nova_card_rare:1553438171218321449>",
    epic: "<:nova_card_epic:1553438167431123014>",
    legendary: "<:nova_card_legendary:1553438168756260884>",
    mythic: "<:nova_card_mythic:1553438169934864505>",
  },
};

const welcomeRarityLabels: Record<WelcomeRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  celestial: "Celestial",
};

const welcomeRarityColors: Record<WelcomeRarity, number> = {
  common: 0xb0b0b0,
  rare: 0x22d3ee,
  epic: 0xa87ef5,
  legendary: 0xfedb44,
  mythic: 0xf22633,
  celestial: 0xe4f2ff,
};

const cardArtUrl = (card: WelcomeCard): string =>
  `https://cdn.nowly.me/cards/${card.pack}/embed_${card.rarity}.png`;

const bags = new Map<WelcomePackName, WelcomeCard[]>(
  welcomePackNames.map((name) => [name, [] as WelcomeCard[]]),
);

export type WelcomePacketState = Partial<Record<WelcomePackName, number[]>>;

const toCards = (pack: WelcomePackName, messageIds: number[] | undefined): WelcomeCard[] => {
  if (!messageIds?.length) {
    return [];
  }

  const cards = getWelcomePack(pack)?.cards ?? [];

  return messageIds.flatMap((messageId) => {
    const card = cards.find((entry) => entry.messageId === messageId);

    return card ? [card] : [];
  });
};

const pickOne = (cards: WelcomeCard[]): WelcomeCard => {
  const card = cards[Math.floor(Math.random() * cards.length)];

  if (!card) {
    throw new Error("Cannot draw a welcome card from an empty pool");
  }

  return card;
};

export const getRarityEmoji = (pack: WelcomePackName, rarity: WelcomeRarity): string =>
  welcomeRarityEmojis[pack][rarity] ?? welcomeRarityEmojis.genesis[rarity] ?? "";

export const getRarityLabel = (rarity: WelcomeRarity): string => welcomeRarityLabels[rarity];

export const getRarityColor = (rarity: WelcomeRarity): number => welcomeRarityColors[rarity];

export const getPackLabel = (pack: WelcomePackName): string =>
  getWelcomePack(pack)?.label ?? pack;

export const isWelcomeRarity = (value: string): value is WelcomeRarity =>
  welcomeRarities.includes(value as WelcomeRarity);

export const getWelcomePacketState = (): Record<WelcomePackName, number[]> =>
  Object.fromEntries(
    welcomePackNames.map((name) => [name, (bags.get(name) ?? []).map((card) => card.messageId)]),
  ) as Record<WelcomePackName, number[]>;

// The active pack is the first one still holding a card, so a pack takes over as
// soon as the one before it has been dealt out entirely.
export const getCurrentPack = (): WelcomePackName | undefined =>
  welcomePackNames.find((name) => (bags.get(name)?.length ?? 0) > 0);

// A member who leaves hands their card back to the pack it came from, so it can
// be drawn again. Returns false when the pack no longer lists the card, in which
// case the card is simply gone.
export const returnCardToPack = (card: WelcomeCard): boolean => {
  const bag = bags.get(card.pack);

  if (!bag || bag.some((entry) => entry.messageId === card.messageId)) {
    return false;
  }

  bag.push(card);

  return true;
};

// A member who comes back takes their card out of the pack again. Returns false
// when the card is no longer there, meaning somebody else drew it in the meantime.
export const claimCardFromPack = (
  pack: WelcomePackName,
  messageId: number,
): boolean => {
  const bag = bags.get(pack);
  const index = bag?.findIndex((card) => card.messageId === messageId) ?? -1;

  if (!bag || index === -1) {
    return false;
  }

  bag.splice(index, 1);

  return true;
};

export const restoreWelcomePackets = (state: WelcomePacketState): void => {
  for (const name of welcomePackNames) {
    const messageIds = state[name];

    bags.set(
      name,
      messageIds?.length
        ? toCards(name, messageIds)
        : (getWelcomePack(name)?.cards ?? []).filter((card) => Boolean(card)),
    );
  }
};

// Cards are always taken out of the bag, including when /welcome forces a rarity,
// so a card is never handed to two members.
export const drawWelcomeCard = (rarity?: WelcomeRarity): WelcomeCard | null => {
  const pack = getCurrentPack();

  if (pack === undefined) {
    return null;
  }

  const bag = bags.get(pack) ?? [];
  const pool = rarity ? bag.filter((card) => card.rarity === rarity) : bag;

  if (pool.length === 0) {
    return null;
  }

  const card = pickOne(pool);

  bag.splice(bag.indexOf(card), 1);

  return card;
};

export const renderWelcomeMessage = (message: string, userId: string): string => {
  return message.replaceAll("{user}", `<@${userId}>`);
};

const durationUnits: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
  w: 604800,
  week: 604800,
  weeks: 604800,
};

// Discord's compact duration format (3d, 12h, 2h30m), long unit names accepted
// too. Returns a delay in seconds, or null if the value is not a delay.
const parseDelay = (value: string): number | null => {
  const pattern = /(\d+)([a-z]+)/g;
  let totalSeconds = 0;
  let consumed = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const unit = durationUnits[match[2]];

    if (unit === undefined) {
      return null;
    }

    totalSeconds += Number(match[1]) * unit;
    consumed += match[0].length;
  }

  return consumed === value.length && totalSeconds > 0 ? totalSeconds : null;
};

// 2025-06-15 or 15/06/2025, pinned to midday UTC so the date never shifts with
// the reader's timezone. Returns a timestamp in seconds, or null if the value is
// not a date.
const parseDate = (value: string): number | null => {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const dayFirst = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(value);

  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : dayFirst
      ? { year: Number(dayFirst[3]), month: Number(dayFirst[2]), day: Number(dayFirst[1]) }
      : null;

  if (!parts) {
    return null;
  }

  const timestamp = Date.UTC(parts.year, parts.month - 1, parts.day, 12) / 1000;
  const date = new Date(timestamp * 1000);

  if (
    date.getUTCFullYear() !== parts.year
    || date.getUTCMonth() !== parts.month - 1
    || date.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return timestamp;
};

// Reads the `joined` option of /welcome: either a delay from now (3d, 12h,
// 2h30m) or an exact date (2025-06-15, 15/06/2025). Returns a timestamp in
// seconds, or null if the value is unreadable or in the future.
export const parseJoinedOption = (value: string): number | null => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");

  if (!normalized) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const delay = parseDelay(normalized);
  const timestamp = delay === null ? parseDate(normalized) : now - delay;

  if (timestamp === null || timestamp > now) {
    return null;
  }

  return timestamp;
};

export const renderJoinedAgo = (joinedAt: number): string => `(joined <t:${joinedAt}:R>)`;

export const renderWelcomeCard = (
  card: WelcomeCard,
  userId: string,
  joinedAt?: number,
): string => {
  const message = renderWelcomeMessage(card.message, userId);
  const joined = joinedAt ? ` ${renderJoinedAgo(joinedAt)}` : "";

  return `${message}${joined}`;
};

// /card: the member's own card, the art and the colour of its pack and rarity.
export const buildCardEmbed = (options: {
  userId: string;
  card: WelcomeCard;
  drawnAt: number;
  joinedAt?: number;
}): EmbedBuilder => {
  const { userId, card, drawnAt, joinedAt } = options;
  const joined = joinedAt ? ` ${renderJoinedAgo(joinedAt)}` : "";
  const emoji = getRarityEmoji(card.pack, card.rarity);

  return new EmbedBuilder()
    .setColor(getRarityColor(card.rarity))
    .setTitle(`${getRarityLabel(card.rarity)} card (${getPackLabel(card.pack)})`)
    .setImage(cardArtUrl(card))
    .setDescription(`${renderWelcomeMessage(card.message, userId)}${joined}`)
    .setTimestamp(drawnAt);
};
