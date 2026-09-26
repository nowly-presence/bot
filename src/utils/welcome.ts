import { WelcomeCard, WelcomeRarity, welcomeCards } from "@/data/welcome-cards";

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
// hundred is a whole percent. Celestial cards are drawn from their own pool on
// a per-draw roll instead of sitting in the packet.
const celestialDrawRate = 0.001;

const celestialRarity: WelcomeRarity = "celestial";

const packetCards = welcomeCards.filter((card) => card.rarity !== celestialRarity);
const celestialCards = welcomeCards.filter((card) => card.rarity === celestialRarity);

let bag: WelcomeCard[] = [];

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

export const drawWelcomeCard = (rarity?: WelcomeRarity): WelcomeCard => {
  if (rarity) {
    return pickOne(welcomeCards.filter((card) => card.rarity === rarity));
  }

  if (celestialCards.length > 0 && Math.random() < celestialDrawRate) {
    return pickOne(celestialCards);
  }

  if (bag.length === 0) {
    bag = shuffle(packetCards);
  }

  return pickOne(bag.splice(bag.length - 1, 1));
};

export const renderWelcomeMessage = (message: string, userId: string): string => {
  return message.replaceAll("{user}", `<@${userId}>`);
};

export const renderWelcomeCard = (card: WelcomeCard, userId: string): string => {
  return `${getRarityEmoji(card.rarity)} ${renderWelcomeMessage(card.message, userId)}`;
};
