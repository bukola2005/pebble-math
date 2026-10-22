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
