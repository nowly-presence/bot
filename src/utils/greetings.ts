// Greetings the bot waves back at. Kept as plain words so "hey everyone" is
// caught while "hey, can you look at this" is not.
const greetingWords = [
  "hi",
  "hiya",
  "hii",
  "hiii",
  "hiiii",
  "hey",
  "heya",
  "heyy",
  "hello",
  "helo",
  "hallo",
  "halo",
  "yo",
  "sup",
  "wsup",
  "wassup",
  "howdy",
  "yoohoo",
  "greetings",
  "salutations",
  "salut",
  "slt",
  "coucou",
  "bonjour",
  "bj",
  "bonsoir",
  "salve",
  "wesh",
  "tchin",
  "hola",
  "ola",
  "buenas",
  "buenos",
  "que",
  "tal",
  "dias",
  "noches",
  "tarde",
  "manana",
  "ey",
  "eae",
  "eai",
  "opa",
  "ciao",
  "buongiorno",
  "buonasera",
  "ehi",
  "bom",
  "dia",
  "guten",
  "tag",
  "morgen",
  "abend",
  "hall",
  "hej",
  "hujambo",
  "szia",
  "dag",
  "goeiedag",
  "goedendag",
  "avond",
  "middag",
  "dobri",
  "zdravo",
  "привет",
  "приветик",
  "хай",
  "здаров",
  "добрый",
  "konnichiwa",
  "ohayou",
  "annyeong",
  "nihao",
  "salaam",
  "salam",
  "ahlan",
  "marhaba",
  "selam",
  "ahoy",
  "gday",
  "morning",
  "afternoon",
  "evening",
  "night",
];

// Addressed groups, times of day and filler allowed next to a greeting, so
// "salut tout le monde" and "good morning everyone" still count.
const fillerWords = [
  "a",
  "all",
  "alle",
  "alles",
  "amiga",
  "amigo",
  "amigos",
  "amies",
  "amis",
  "copains",
  "chat",
  "crew",
  "dan",
  "den",
  "dobar",
  "dobri",
  "доброе",
  "everyone",
  "everybody",
  "every1",
  "family",
  "fam",
  "folks",
  "good",
  "gente",
  "guys",
  "her",
  "here",
  "la",
  "le",
  "les",
  "gens",
  "equipe",
  "tudo",
  "todos",
  "todo",
  "mate",
  "me",
  "monde",
  "mundo",
  "people",
  "peace",
  "sir",
  "madam",
  "mister",
  "there",
  "to",
  "tout",
  "tous",
  "toute",
  "toutes",
  "team",
  "u",
  "utro",
  "vecer",
  "вечер",
  "yall",
  "you",
];

const stripDiacritics = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalize = (content: string): string =>
  stripDiacritics(content)
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const greeting = new Set(greetingWords.map(stripDiacritics));
const filler = new Set(fillerWords.map(stripDiacritics));

// A message is a greeting when it holds at least one greeting word and nothing
// else but greetings and address fillers, whatever the order or the repetition.
export const isGreeting = (content: string): boolean => {
  const words = normalize(content).split(" ").filter(Boolean);

  if (!words.some((word) => greeting.has(word))) {
    return false;
  }

  return words.every((word) => greeting.has(word) || filler.has(word));
};
