/**
 * What a child earns, and where it comes from. Every reward comes from the
 * place that gave it, so a child can look at their things and see where
 * they have been.
 *
 * A reward is earned when its stall_progress row exists: finishing
 * Chapter 1 at the Fruit Stall (the "fruit-stall-chapter-1" row) earns
 * both of these. Nothing else is stored.
 */
export const REWARDS = [
  { id: "straw-hat", name: "Straw hat", place: "the Fruit Stall", from: "fruit-stall-chapter-1" },
  { id: "tally-stick", name: "Tally stick", place: "the Fruit Stall", from: "fruit-stall-chapter-1" },
];

/** The rewards a child has, from the stall_progress ids they have cleared. */
export const rewardsFor = (cleared = []) => REWARDS.filter((reward) => cleared.includes(reward.from));

/*
  The shelf in a child's profile (components/ProfilePanel.jsx): the places
  that give things, in the order a child reaches them, with a space for
  each thing. A place that is built has a space for each of its rewards
  above. One not built yet is `locked`, with `spaces` empty ones: a guess
  at how many it will give, there so a child can see there is more to
  come.
*/
export const SHELF = [
  { place: "the Fruit Stall" },
  { place: "the Bakery", locked: true, spaces: 4 },
];

/**
 * The shelf for a child: each place with its spaces, holding the rewards
 * they have from it first, then null for each one still to find.
 */
export function shelfFor(cleared = []) {
  return SHELF.map(({ place, locked = false, spaces = 0 }) => {
    if (locked) return { place, locked, spaces: Array(spaces).fill(null) };
    const from = REWARDS.filter((reward) => reward.place === place);
    const have = from.filter((reward) => cleared.includes(reward.from));
    return { place, locked, spaces: [...have, ...Array(from.length - have.length).fill(null)] };
  });
}
