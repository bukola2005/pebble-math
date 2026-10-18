/**
 * The words a child builds their game name from: one from each list, by
 * tapping. Nothing is ever typed, so a child can never put a real name in.
 *
 * Edit freely. Keep every word warm, market-flavoured and easy to read
 * aloud, and avoid anything that is commonly someone's first name or
 * surname (River, Rain, Hill, Bell, Olive, Ginger, Kola…). Two words
 * together should never read like a real person's name.
 *
 * players.game_name stores the pair as one string, e.g. "Mango Moon". The
 * database accepts two words of letters and hyphens only, so keep to those.
 */
export const FIRST_WORDS = [
  "Mango",
  "Pepper",
  "Coconut",
  "Papaya",
  "Guava",
  "Plantain",
  "Cashew",
  "Peanut",
  "Pumpkin",
  "Melon",
  "Lemon",
  "Lime",
  "Pineapple",
  "Tomato",
  "Okra",
  "Sesame",
  "Chilli",
  "Biscuit",
  "Puff-Puff",
  "Chin-Chin",
];

export const SECOND_WORDS = [
  "Moon",
  "Sky",
  "Sun",
  "Star",
  "Cloud",
  "Rainbow",
  "Comet",
  "Drum",
  "Kite",
  "Pebble",
  "Basket",
  "Lantern",
  "Spark",
  "Wave",
  "Leaf",
  "Feather",
  "Shell",
  "Seed",
  "Firefly",
  "Sunrise",
];

export const randomIndex = (list) => Math.floor(Math.random() * list.length);

export const joinName = (first, second) => `${first} ${second}`;
