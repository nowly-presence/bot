export type WelcomeRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type WelcomeCard = {
  id: number;
  rarity: WelcomeRarity;
  message: string;
};

export const welcomeCards: WelcomeCard[] = [
  {
    id: 1,
    rarity: "common",
    message: "Welcome aboard, {user}. The lobby is open, help yourself to a seat.",
  },
  {
    id: 2,
    rarity: "common",
    message: "Hey {user}, you just walked in. Make yourself at home.",
  },
  {
    id: 3,
    rarity: "common",
    message: "{user} joined. First order of business: introduce yourself.",
  },
  {
    id: 4,
    rarity: "common",
    message: "Good to have you here, {user}. The coffee is terrible but the company is fine.",
  },
  {
    id: 5,
    rarity: "common",
    message: "{user} is in. Someone show them where we keep the good stuff.",
  },
  {
    id: 6,
    rarity: "common",
    message: "Welcome, {user}. Don't mind the chaos, it's a permanent feature.",
  },
  {
    id: 7,
    rarity: "common",
    message: "A new face in the lobby. Welcome, {user}.",
  },
  {
    id: 8,
    rarity: "common",
    message: "{user} just pulled up a chair. Say hi before the conversation moves on.",
  },
  {
    id: 9,
    rarity: "common",
    message: "Welcome in, {user}. We're mid-argument, but there's always room for one more.",
  },
  {
    id: 10,
    rarity: "common",
    message: "{user} has arrived. Make the server a little noisier.",
  },
  {
    id: 11,
    rarity: "common",
    message: "Fresh member detected: {user}. Welcome!",
  },
  {
    id: 12,
    rarity: "common",
    message: "Welcome, {user}. The lounge is nicer on the second floor. Metaphorically.",
  },
  {
    id: 13,
    rarity: "common",
    message: "Good evening, {user}. Or good morning. Time is fake here.",
  },
  {
    id: 14,
    rarity: "common",
    message: "{user} said hello. The floor is yours.",
  },
  {
    id: 15,
    rarity: "common",
    message: "Welcome to the server, {user}. Try not to break anything expensive.",
  },
  {
    id: 16,
    rarity: "common",
    message: "{user} joined. Someone hand them the onboarding materials.",
  },
  {
    id: 17,
    rarity: "common",
    message: "Another one for the collection. Welcome, {user}.",
  },
  {
    id: 18,
    rarity: "common",
    message: "Welcome, {user}. We're glad you made it.",
  },
  {
    id: 19,
    rarity: "common",
    message: "{user} just showed up. Hi {user}, nice to meet you.",
  },
  {
    id: 20,
    rarity: "common",
    message: "Hello {user}. You picked a good day to walk in.",
  },
  {
    id: 21,
    rarity: "common",
    message: "Welcome aboard, {user}. Mind the loose confetti.",
  },
  {
    id: 22,
    rarity: "common",
    message: "{user} is here. The room just got slightly more interesting.",
  },
  {
    id: 23,
    rarity: "common",
    message: "Welcome, {user}. Settle in, there's no rush.",
  },
  {
    id: 24,
    rarity: "common",
    message: "{user} joined from the cold. Hand them a blanket and a preset.",
  },
  {
    id: 25,
    rarity: "common",
    message: "New arrival: {user}. Let's not overwhelm them all at once.",
  },
  {
    id: 26,
    rarity: "common",
    message: "Welcome to Nowly, {user}. It's nicer in here than out there.",
  },
  {
    id: 27,
    rarity: "common",
    message: "{user} walked in. Pop the music up a notch.",
  },
  {
    id: 28,
    rarity: "common",
    message: "Welcome, {user}. First rule: it's fine to ask questions.",
  },
  {
    id: 29,
    rarity: "common",
    message: "{user} has joined the party. Refreshments are in the other room.",
  },
  {
    id: 30,
    rarity: "common",
    message: "Hey {user}, welcome in. We were just talking about you. Not really.",
  },
  {
    id: 31,
    rarity: "common",
    message: "Welcome, {user}. Your seat is the one with the squeaky leg.",
  },
  {
    id: 32,
    rarity: "common",
    message: "{user} joined. Let's make it a party. Modest party.",
  },
  {
    id: 33,
    rarity: "common",
    message: "Welcome, {user}. Glad you found the door.",
  },
  {
    id: 34,
    rarity: "common",
    message: "{user} is in the building. Grab a preset and say hi.",
  },
  {
    id: 35,
    rarity: "common",
    message: "New member, {user}. Give them a warm welcome, team.",
  },
  {
    id: 36,
    rarity: "common",
    message: "Welcome, {user}. The thermostat is broken and we like it that way.",
  },
  {
    id: 37,
    rarity: "common",
    message: "{user} just arrived. Read the rules if you have the energy.",
  },
  {
    id: 38,
    rarity: "common",
    message: "Welcome, {user}. It's loud here, but it's friendly loud.",
  },
  {
    id: 39,
    rarity: "common",
    message: "{user} joined. Say hello, they can't bite.",
  },
  {
    id: 40,
    rarity: "common",
    message: "Welcome, {user}. Hope your day has gone better than the coffee.",
  },
  {
    id: 41,
    rarity: "common",
    message: "{user} is here. Let's add them to the group chat, I mean channel.",
  },
  {
    id: 42,
    rarity: "common",
    message: "Welcome in, {user}. There's no wrong way to start here.",
  },
  {
    id: 43,
    rarity: "common",
    message: "{user} just pulled up. Look alive, everyone.",
  },
  {
    id: 44,
    rarity: "common",
    message: "Welcome, {user}. The cat on the avatar is not real, but the friendship is.",
  },
  {
    id: 45,
    rarity: "common",
    message: "{user} joined. Nice. Very nice. Welcome.",
  },
  {
    id: 46,
    rarity: "common",
    message: "Welcome, {user}. Go ahead, introduce yourself.",
  },
  {
    id: 47,
    rarity: "common",
    message: "{user} is in the lobby. Someone offer them a preset to install.",
  },
  {
    id: 48,
    rarity: "common",
    message: "Welcome aboard, {user}. Second best decision you made today.",
  },
  {
    id: 49,
    rarity: "common",
    message: "{user} has joined. Make some noise, we love that here.",
  },
  {
    id: 50,
    rarity: "common",
    message: "Welcome, {user}. Take a load off. You've arrived.",
  },
  {
    id: 51,
    rarity: "rare",
    message: "{user} just walked in. That's a solid pull. Welcome in.",
  },
  {
    id: 52,
    rarity: "rare",
    message: "Nice roll, {user}. A rare one joining us. Make it count.",
  },
  {
    id: 53,
    rarity: "rare",
    message: "Oh nice, {user} is here. The lobby just got an upgrade.",
  },
  {
    id: 54,
    rarity: "rare",
    message: "{user} rolled in. Rare drop, rare company. Welcome!",
  },
  {
    id: 55,
    rarity: "rare",
    message: "A rare card for a rare occasion: {user} has joined.",
  },
  {
    id: 56,
    rarity: "rare",
    message: "Hey {user}, welcome. Glad the dice landed you here.",
  },
  {
    id: 57,
    rarity: "rare",
    message: "{user} joined. That's one off the deck. Enjoy the draw.",
  },
  {
    id: 58,
    rarity: "rare",
    message: "Well, would you look at that. {user} walked in. Welcome!",
  },
  {
    id: 59,
    rarity: "rare",
    message: "{user} is in. Not every roll lands well. This one did.",
  },
  {
    id: 60,
    rarity: "rare",
    message: "Pulled a good one: {user} just joined the server.",
  },
  {
    id: 61,
    rarity: "rare",
    message: "Welcome, {user}. You came in hot and we noticed.",
  },
  {
    id: 62,
    rarity: "rare",
    message: "{user} appears. Rare to see someone walk in with this much energy.",
  },
  {
    id: 63,
    rarity: "rare",
    message: "A rare visitor. Welcome, {user}. Don't stay a stranger.",
  },
  {
    id: 64,
    rarity: "rare",
    message: "{user} joined. That's the kind of pull you build a collection around.",
  },
  {
    id: 65,
    rarity: "rare",
    message: "Nice, {user} is here. The server feels a bit luckier now.",
  },
  {
    id: 66,
    rarity: "rare",
    message: "Hey {user}, welcome. You landed on a good server, handily.",
  },
  {
    id: 67,
    rarity: "rare",
    message: "{user} just dropped by. Rare air in here today.",
  },
  {
    id: 68,
    rarity: "rare",
    message: "Got another good roll. Welcome, {user}.",
  },
  {
    id: 69,
    rarity: "rare",
    message: "{user} joined. This one's worth keeping.",
  },
  {
    id: 70,
    rarity: "rare",
    message: "Look who showed up, {user}. Welcome, glad you made the cut.",
  },
  {
    id: 71,
    rarity: "rare",
    message: "A rare welcome for {user}. Enjoy the room.",
  },
  {
    id: 72,
    rarity: "rare",
    message: "{user} is here. Nicely done, dice.",
  },
  {
    id: 73,
    rarity: "rare",
    message: "Welcome, {user}. That entrance had some weight to it.",
  },
  {
    id: 74,
    rarity: "rare",
    message: "{user} rolled in and the room got brighter. Welcome!",
  },
  {
    id: 75,
    rarity: "rare",
    message: "Rare pull confirmed: {user} has joined.",
  },
  {
    id: 76,
    rarity: "rare",
    message: "Hey {user}. Good to have you. That one's going in the collection.",
  },
  {
    id: 77,
    rarity: "rare",
    message: "{user} just joined, and it's a good one. Welcome in.",
  },
  {
    id: 78,
    rarity: "epic",
    message: "{user} has arrived. Nowly doesn't hand out epic pulls lightly.",
  },
  {
    id: 79,
    rarity: "epic",
    message: "Epic drop. {user} just joined the server.",
  },
  {
    id: 80,
    rarity: "epic",
    message: "{user} is in. Don't waste this energy.",
  },
  {
    id: 81,
    rarity: "epic",
    message: "Well. {user} showed up, and everything got a little more serious.",
  },
  {
    id: 82,
    rarity: "epic",
    message: "Epic pull confirmed. {user} is in the building.",
  },
  {
    id: 83,
    rarity: "epic",
    message: "{user} just entered. Take a moment, this one matters.",
  },
  {
    id: 84,
    rarity: "epic",
    message: "An epic joined us. Stand up, {user}.",
  },
  {
    id: 85,
    rarity: "epic",
    message: "{user} walked in and the room noticed. Welcome.",
  },
  {
    id: 86,
    rarity: "epic",
    message: "Epic card drawn: {user}. Try to keep it that way.",
  },
  {
    id: 87,
    rarity: "epic",
    message: "{user} is here. The high roll landed right.",
  },
  {
    id: 88,
    rarity: "epic",
    message: "This one's different. {user} has joined.",
  },
  {
    id: 89,
    rarity: "epic",
    message: "Epic arrival, {user}. Don't let it go to your head.",
  },
  {
    id: 90,
    rarity: "epic",
    message: "{user} just pulled a great one. Welcome to the club.",
  },
  {
    id: 91,
    rarity: "epic",
    message: "Look at that, {user}. Epic rarity. Say something clever.",
  },
  {
    id: 92,
    rarity: "epic",
    message: "{user} joined and immediately leveled up the room.",
  },
  {
    id: 93,
    rarity: "legendary",
    message: "{user}... legendary drop. The whole server saw that one.",
  },
  {
    id: 94,
    rarity: "legendary",
    message: "Hold on. {user} is a legendary pull. Screenshot this.",
  },
  {
    id: 95,
    rarity: "legendary",
    message: "Legendary arrival. {user} just walked through the door.",
  },
  {
    id: 96,
    rarity: "legendary",
    message: "{user} joined. Legendary rarity. Absolute scenes.",
  },
  {
    id: 97,
    rarity: "legendary",
    message: "We do not get one of these often. {user} is legendary.",
  },
  {
    id: 98,
    rarity: "legendary",
    message: "Legendary pull. {user} just joined and rewrote the room.",
  },
  {
    id: 99,
    rarity: "mythic",
    message: "Hold on. {user} is a MYTHIC pull. Nobody move.",
  },
  {
    id: 100,
    rarity: "mythic",
    message: "MYTHIC. {user} just walked in. This is not a drill.",
  },
];
