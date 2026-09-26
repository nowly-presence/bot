import {
  WelcomeCard,
  WelcomePacketName,
  WelcomeRarity,
  welcomeCards,
} from "@/data/welcome-cards";

export const welcomeRarities: WelcomeRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "celestial",
];

const welcomeRarityEmojis: Record<WelcomeRarity, string> = {
  common: "<:card_common:1553405629698150420>",
  rare: "<:card_rare:1553405634718859357>",
  epic: "<:card_epic:1553405630981734491>",
  legendary: "<:card_legendary:1553405632315523174>",
  mythic: "<:card_mythic:1553405633540259971>",
  celestial: "<:card_celestial:1553405628091863242>",
};

const welcomeRarityLabels: Record<WelcomeRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  celestial: "Celestial",
};

// 0.1%: far below what a packet can express, since one celestial card in a
// hundred is a whole percent. Celestial cards are drawn from their own packet
// on a per-draw roll instead of sitting in the main one, and that packet is
// consumed like any other, so a celestial message cannot come up again before
// the three of them have all been pulled.
const celestialDrawRate = 0.001;

const celestialRarity: WelcomeRarity = "celestial";

const packetCards = welcomeCards.filter((card) => card.rarity !== celestialRarity);
const celestialCards = welcomeCards.filter((card) => card.rarity === celestialRarity);

let bag: WelcomeCard[] = [];
let celestialBag: WelcomeCard[] = [];

export type WelcomePacketState = Record<WelcomePacketName, number[]>;

const toCards = (cardIds: number[] | undefined, pool: WelcomeCard[]): WelcomeCard[] => {
  if (!cardIds?.length) {
    return [];
  }

  const cardsById = new Map(pool.map((card) => [card.id, card]));

  return cardIds
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is WelcomeCard => card !== undefined);
};

const pickOne = (cards: WelcomeCard[]): WelcomeCard => {
  const card = cards[Math.floor(Math.random() * cards.length)];

  if (!card) {
    throw new Error("Cannot draw a welcome card from an empty pool");
  }

  return card;
};

const shuffle = (cards: WelcomeCard[]): WelcomeCard[] => {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

export const getRarityEmoji = (rarity: WelcomeRarity): string => welcomeRarityEmojis[rarity];

export const getRarityLabel = (rarity: WelcomeRarity): string => welcomeRarityLabels[rarity];

export const isWelcomeRarity = (value: string): value is WelcomeRarity =>
  welcomeRarities.includes(value as WelcomeRarity);

export const getWelcomePacketState = (): WelcomePacketState => ({
  main: bag.map((card) => card.id),
  celestial: celestialBag.map((card) => card.id),
});

// Takes a card back out of whichever packet holds it, used when a member leaves
// and their card goes back into the draw. Returns the packet it came from, or
// null when the card is not in any packet, meaning someone else already drew it.
export const removeCardFromPackets = (cardId: number): WelcomePacketName | null => {
  const mainIndex = bag.findIndex((card) => card.id === cardId);

  if (mainIndex !== -1) {
    bag.splice(mainIndex, 1);
    return "main";
  }

  const celestialIndex = celestialBag.findIndex((card) => card.id === cardId);

  if (celestialIndex !== -1) {
    celestialBag.splice(celestialIndex, 1);
    return "celestial";
  }

  return null;
};

export const getWelcomeCard = (cardId: number): WelcomeCard | undefined =>
  welcomeCards.find((card) => card.id === cardId);

export const restoreWelcomePackets = (state: Partial<WelcomePacketState>): void => {
  bag = toCards(state.main, packetCards);
  celestialBag = toCards(state.celestial, celestialCards);
};

export const drawWelcomeCard = (rarity?: WelcomeRarity): WelcomeCard => {
  if (rarity) {
    return pickOne(welcomeCards.filter((card) => card.rarity === rarity));
  }

  if (celestialCards.length > 0 && Math.random() < celestialDrawRate) {
    if (celestialBag.length === 0) {
      celestialBag = shuffle(celestialCards);
    }

    return pickOne(celestialBag.splice(celestialBag.length - 1, 1));
  }

  if (bag.length === 0) {
    bag = shuffle(packetCards);
  }

  return pickOne(bag.splice(bag.length - 1, 1));
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

  return `${getRarityEmoji(card.rarity)} ${message}${joined}`;
};
