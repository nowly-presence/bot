import { WelcomeCard, WelcomeRarity, welcomeCards } from "@/data/welcome-cards";

export const welcomeRarities: WelcomeRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

const welcomeRarityEmojis: Record<WelcomeRarity, string> = {
  common: "<:card_common:1553393881490391290>",
  rare: "<:card_rare:1553393887660347443>",
  epic: "<:card_epic:1553393882966921246>",
  legendary: "<:card_legendary:1553393884581728329>",
  mythic: "<:card_mythic:1553393886070579200>",
};

const welcomeRarityLabels: Record<WelcomeRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

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

  if (bag.length === 0) {
    bag = shuffle(welcomeCards);
  }

  return pickOne(bag.splice(bag.length - 1, 1));
};

export const renderWelcomeMessage = (message: string, userId: string): string => {
  return message.replaceAll("{user}", `<@${userId}>`);
};

export const renderWelcomeCard = (card: WelcomeCard, userId: string): string => {
  return `${getRarityEmoji(card.rarity)} ${renderWelcomeMessage(card.message, userId)}`;
};
