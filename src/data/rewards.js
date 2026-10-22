/**
 * Keepsakes: what a child is given, and where it comes from. Grandma's
 * gifts at the end of Chapter 1, and nothing more is coming: they are
 * gifts, not a set to complete (docs/story.md: nothing collected that
 * doesn't lead to her).
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
