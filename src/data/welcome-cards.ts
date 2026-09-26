export type WelcomeRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "celestial";

export type WelcomePackName = "genesis" | "nova";

export type WelcomeMessage = {
  id: number;
  message: string;
};

// A card is a message plus the pack and rarity it was given in, so the same text
// can be reused by every pack without ever handing the same card out twice.
export type WelcomeCard = {
  pack: WelcomePackName;
  messageId: number;
  rarity: WelcomeRarity;
  message: string;
};

export type WelcomePack = {
  name: WelcomePackName;
  label: string;
  cards: WelcomeCard[];
};

const welcomeMessages: WelcomeMessage[] = [
  {
    id: 1,
    message: "Welcome aboard, {user}. The lobby is open, help yourself to a seat.",
  },
  {
    id: 2,
    message: "Hey {user}, you just walked in. Make yourself at home.",
  },
  {
    id: 3,
    message: "{user} joined. First order of business: introduce yourself.",
  },
  {
    id: 4,
    message: "Good to have you here, {user}. The coffee is terrible but the company is fine.",
  },
  {
    id: 5,
    message: "{user} is in. Someone show them where we keep the good stuff.",
  },
  {
    id: 6,
    message: "Welcome, {user}. Don't mind the chaos, it's a permanent feature.",
  },
  {
    id: 7,
    message: "A new face in the lobby. Welcome, {user}.",
  },
  {
    id: 8,
    message: "{user} just pulled up a chair. Say hi before the conversation moves on.",
  },
  {
    id: 9,
    message: "Welcome in, {user}. We're mid-argument, but there's always room for one more.",
  },
  {
    id: 10,
    message: "{user} has arrived. Make the server a little noisier.",
  },
  {
    id: 11,
    message: "Fresh member detected: {user}. Welcome!",
  },
  {
    id: 12,
    message: "Welcome, {user}. The lounge is nicer on the second floor. Metaphorically.",
  },
  {
    id: 13,
    message: "Good evening, {user}. Or good morning. Time is fake here.",
  },
  {
    id: 14,
    message: "{user} said hello. The floor is yours.",
  },
  {
    id: 15,
    message: "Welcome to the server, {user}. Try not to break anything expensive.",
  },
  {
    id: 16,
    message: "{user} joined. Someone hand them the onboarding materials.",
  },
  {
    id: 17,
    message: "Another one for the collection. Welcome, {user}.",
  },
  {
    id: 18,
    message: "Welcome, {user}. We're glad you made it.",
  },
  {
    id: 19,
    message: "{user} just showed up. Hi {user}, nice to meet you.",
  },
  {
    id: 20,
    message: "Hello {user}. You picked a good day to walk in.",
  },
  {
    id: 21,
    message: "Welcome aboard, {user}. Mind the loose confetti.",
  },
  {
    id: 22,
    message: "{user} is here. The room just got slightly more interesting.",
  },
  {
    id: 23,
    message: "Welcome, {user}. Settle in, there's no rush.",
  },
  {
    id: 24,
    message: "{user} joined from the cold. Hand them a blanket and a preset.",
  },
  {
    id: 25,
    message: "New arrival: {user}. Let's not overwhelm them all at once.",
  },
  {
    id: 26,
    message: "Welcome to Nowly, {user}. It's nicer in here than out there.",
  },
  {
    id: 27,
    message: "{user} walked in. Pop the music up a notch.",
  },
  {
    id: 28,
    message: "Welcome, {user}. First rule: it's fine to ask questions.",
  },
  {
    id: 29,
    message: "{user} has joined the party. Refreshments are in the other room.",
  },
  {
    id: 30,
    message: "Hey {user}, welcome in. We were just talking about you. Not really.",
  },
  {
    id: 31,
    message: "Welcome, {user}. Your seat is the one with the squeaky leg.",
  },
  {
    id: 32,
    message: "{user} joined. Let's make it a party. Modest party.",
  },
  {
    id: 33,
    message: "Welcome, {user}. Glad you found the door.",
  },
  {
    id: 34,
    message: "{user} is in the building. Grab a preset and say hi.",
  },
  {
    id: 35,
    message: "New member, {user}. Give them a warm welcome, team.",
  },
  {
    id: 36,
    message: "Welcome, {user}. The thermostat is broken and we like it that way.",
  },
  {
    id: 37,
    message: "{user} just arrived. Read the rules if you have the energy.",
  },
  {
    id: 38,
    message: "Welcome, {user}. It's loud here, but it's friendly loud.",
  },
  {
    id: 39,
    message: "{user} joined. Say hello, they can't bite.",
  },
  {
    id: 40,
    message: "Welcome, {user}. Hope your day has gone better than the coffee.",
  },
  {
    id: 41,
    message: "{user} is here. Let's add them to the group chat, I mean channel.",
  },
  {
    id: 42,
    message: "Welcome in, {user}. There's no wrong way to start here.",
  },
  {
    id: 43,
    message: "{user} just pulled up. Look alive, everyone.",
  },
  {
    id: 44,
    message: "Welcome, {user}. The cat on the avatar is not real, but the friendship is.",
  },
  {
    id: 45,
    message: "{user} joined. Nice. Very nice. Welcome.",
  },
  {
    id: 46,
    message: "Welcome, {user}. Go ahead, introduce yourself.",
  },
  {
    id: 47,
    message: "{user} is in the lobby. Someone offer them a preset to install.",
  },
  {
    id: 48,
    message: "Welcome aboard, {user}. Second best decision you made today.",
  },
  {
    id: 49,
    message: "{user} has joined. Make some noise, we love that here.",
  },
  {
    id: 50,
    message: "Welcome, {user}. Take a load off. You've arrived.",
  },
  {
    id: 51,
    message: "{user} just walked in. That's a solid pull. Welcome in.",
  },
  {
    id: 52,
    message: "Nice roll, {user}. A rare one joining us. Make it count.",
  },
  {
    id: 53,
    message: "Oh nice, {user} is here. The lobby just got an upgrade.",
  },
  {
    id: 54,
    message: "{user} rolled in. Rare drop, rare company. Welcome!",
  },
  {
    id: 55,
    message: "A rare card for a rare occasion: {user} has joined.",
  },
  {
    id: 56,
    message: "Hey {user}, welcome. Glad the dice landed you here.",
  },
  {
    id: 57,
    message: "{user} joined. That's one off the deck. Enjoy the draw.",
  },
  {
    id: 58,
    message: "Well, would you look at that. {user} walked in. Welcome!",
  },
  {
    id: 59,
    message: "{user} is in. Not every roll lands well. This one did.",
  },
  {
    id: 60,
    message: "Pulled a good one: {user} just joined the server.",
  },
  {
    id: 61,
    message: "Welcome, {user}. You came in hot and we noticed.",
  },
  {
    id: 62,
    message: "{user} appears. Rare to see someone walk in with this much energy.",
  },
  {
    id: 63,
    message: "A rare visitor. Welcome, {user}. Don't stay a stranger.",
  },
  {
    id: 64,
    message: "{user} joined. That's the kind of pull you build a collection around.",
  },
  {
    id: 65,
    message: "Nice, {user} is here. The server feels a bit luckier now.",
  },
  {
    id: 66,
    message: "Hey {user}, welcome. You landed on a good server, handily.",
  },
  {
    id: 67,
    message: "{user} just dropped by. Rare air in here today.",
  },
  {
    id: 68,
    message: "Got another good roll. Welcome, {user}.",
  },
  {
    id: 69,
    message: "{user} joined. This one's worth keeping.",
  },
  {
    id: 70,
    message: "Look who showed up, {user}. Welcome, glad you made the cut.",
  },
  {
    id: 71,
    message: "A rare welcome for {user}. Enjoy the room.",
  },
  {
    id: 72,
    message: "{user} is here. Nicely done, dice.",
  },
  {
    id: 73,
    message: "Welcome, {user}. That entrance had some weight to it.",
  },
  {
    id: 74,
    message: "{user} rolled in and the room got brighter. Welcome!",
  },
  {
    id: 75,
    message: "Rare pull confirmed: {user} has joined.",
  },
  {
    id: 76,
    message: "Hey {user}. Good to have you. That one's going in the collection.",
  },
  {
    id: 77,
    message: "{user} just joined, and it's a good one. Welcome in.",
  },
  {
    id: 78,
    message: "{user} has arrived. Nowly doesn't hand out epic pulls lightly.",
  },
  {
    id: 79,
    message: "Epic drop. {user} just joined the server.",
  },
  {
    id: 80,
    message: "{user} is in. Don't waste this energy.",
  },
  {
    id: 81,
    message: "Well. {user} showed up, and everything got a little more serious.",
  },
  {
    id: 82,
    message: "Epic pull confirmed. {user} is in the building.",
  },
  {
    id: 83,
    message: "{user} just entered. Take a moment, this one matters.",
  },
  {
    id: 84,
    message: "An epic joined us. Stand up, {user}.",
  },
  {
    id: 85,
    message: "{user} walked in and the room noticed. Welcome.",
  },
  {
    id: 86,
    message: "Epic card drawn: {user}. Try to keep it that way.",
  },
  {
    id: 87,
    message: "{user} is here. The high roll landed right.",
  },
  {
    id: 88,
    message: "This one's different. {user} has joined.",
  },
  {
    id: 89,
    message: "Epic arrival, {user}. Don't let it go to your head.",
  },
  {
    id: 90,
    message: "{user} just pulled a great one. Welcome to the club.",
  },
  {
    id: 91,
    message: "Look at that, {user}. Epic rarity. Say something clever.",
  },
  {
    id: 92,
    message: "{user} joined and immediately leveled up the room.",
  },
  {
    id: 93,
    message: "{user}... legendary drop. The whole server saw that one.",
  },
  {
    id: 94,
    message: "Hold on. {user} is a legendary pull. Screenshot this.",
  },
  {
    id: 95,
    message: "Legendary arrival. {user} just walked through the door.",
  },
  {
    id: 96,
    message: "{user} joined. Legendary rarity. Absolute scenes.",
  },
  {
    id: 97,
    message: "We do not get one of these often. {user} is legendary.",
  },
  {
    id: 98,
    message: "Legendary pull. {user} just joined and rewrote the room.",
  },
  {
    id: 99,
    message: "Hold on. {user} is a MYTHIC pull. Nobody move.",
  },
  {
    id: 100,
    message: "MYTHIC. {user} just walked in. This is not a drill.",
  },
  {
    id: 101,
    message: "{user} didn't just join. The stars lined up, and they lined up loudly.",
  },
  {
    id: 102,
    message: "Celestial pull. {user} has arrived, and the universe took notes.",
  },
  {
    id: 103,
    message: "Stop the server. {user} is CELESTIAL. This happens about once every thousand draws.",
  },
];


// The celestial texts are the only ones held out of the base pool, which is what
// every pack but the first one reuses.
const celestialMessageIds = [101, 102, 103];

const buildRarities = (distribution: [WelcomeRarity, number][]): WelcomeRarity[] =>
  distribution.flatMap(([rarity, count]) => Array.from({ length: count }, () => rarity));

const baseRarities = buildRarities([
  ["common", 50],
  ["rare", 27],
  ["epic", 15],
  ["legendary", 6],
  ["mythic", 2],
]);

// Shifting the distribution by half a pack is what makes a new pack feel different
// from the one before it while keeping the exact same odds: the texts that were
// common become rare, the rare ones become epic, and so on.
const rotateRarities = (offset: number): WelcomeRarity[] => [
  ...baseRarities.slice(offset),
  ...baseRarities.slice(0, offset),
];

const baseMessageIds = welcomeMessages
  .map((entry) => entry.id)
  .filter((id) => !celestialMessageIds.includes(id));

const getWelcomeMessage = (messageId: number): string | undefined =>
  welcomeMessages.find((entry) => entry.id === messageId)?.message;

const toCards = (
  pack: WelcomePackName,
  messageIds: number[],
  rarities: WelcomeRarity[],
): WelcomeCard[] =>
  messageIds.flatMap((messageId, index) => {
    const message = getWelcomeMessage(messageId);

    if (message === undefined) {
      return [];
    }

    return [{ pack, messageId, rarity: rarities[index] ?? "common", message }];
  });

const celestialRarities = buildRarities([["celestial", celestialMessageIds.length]]);

// Packs are drawn in the order they are listed here: the first one still holding
// a card is the active pack, and the next one takes over once it runs out.
export const welcomePacks: WelcomePack[] = [
  {
    name: "genesis",
    label: "Genesis",
    cards: [
      ...toCards("genesis", baseMessageIds, baseRarities),
      ...toCards("genesis", celestialMessageIds, celestialRarities),
    ],
  },
  {
    name: "nova",
    label: "Nova",
    cards: toCards("nova", baseMessageIds, rotateRarities(Math.floor(baseMessageIds.length / 2))),
  },
];

export const welcomePackNames: WelcomePackName[] = welcomePacks.map((pack) => pack.name);

export const isWelcomePackName = (value: string): value is WelcomePackName =>
  welcomePackNames.includes(value as WelcomePackName);

export const getWelcomePack = (name: WelcomePackName): WelcomePack | undefined =>
  welcomePacks.find((pack) => pack.name === name);

export const getWelcomeCard = (
  pack: WelcomePackName,
  messageId: number,
): WelcomeCard | undefined =>
  getWelcomePack(pack)?.cards.find((card) => card.messageId === messageId);
