import { CHARACTERS } from "./characters";

/*
  Blob's friends, who join the search (docs/story.md). Seven in all, one
  per place in the market, Blob first. Nothing is spent: how many have
  joined is how close the child is to finding their mother.

  Blob is here from Scene 1, for the Fruit Stall. Each of the others joins
  at a new place: `place` is the stall_progress id that brings them, null
  while their place isn't built. Sprout (green) joins at the end of the
  Provision Store's Chapter 2. A friend's name is given when their place
  is built.

  Until a friend joins they are a dark silhouette of their own shape
  (`unknown`, made from their art: public/friends/), so a child can see
  someone is coming without seeing who. Their art and name show once
  they join.
*/
const art = (id) => CHARACTERS.find((character) => character.id === id);

export const FRIENDS = [
  { id: "blob", name: "Blob", art: art("purple"), place: "start" },
  { id: "green", name: "Sprout", art: art("green"), unknown: { src: "/friends/green-unknown.webp" }, place: "provision-store-chapter-2" },
  ...["blue", "orange", "pink", "yellow", "teal"].map((id) => ({
    id,
    name: null, // given when their place is built
    art: art(id),
    unknown: { src: `/friends/${id}-unknown.webp` },
    place: null,
  })),
];

/** Each friend, and whether they have joined yet, from the stall_progress ids a child has. */
export const friendsFor = (cleared = []) =>
  FRIENDS.map((friend) => ({ ...friend, joined: friend.place === "start" || cleared.includes(friend.place) }));
