/*
  The market's places, on the map (components/MarketMap.jsx). One picture
  of the whole market, clear (public/art/market-map-day.webp); the haze
  over it is drawn in code, with a soft hole lifted over each place that
  is open.

  One row each, in the order of the main path:
    x, y   where it is on the picture, in percent
    r      how far its clearing reaches, in percent
    open   "start": open from the beginning (the Fruit Stall)
    opensAfter
           the stall_progress id after which two lanterns lift its haze
           (data/lanterns.js); none yet for places further along
    built  whether there is anything to play there yet
    teaches
           a line for its card on the map

  Positions are from the map demo. The places and their order are the
  demo's, not yet docs/market-plan.md's.
*/
export const MAP_ART = { src: "/art/market-map-day.webp", w: 1920, h: 1072 };

export const PLACES = [
  { id: "fruit", name: "Fruit Stall", x: 11, y: 80, r: 20, open: "start", built: true, teaches: "Making ten, and cracking a crate" },
  { id: "shop", name: "Provision Store", x: 27, y: 62, r: 17, opensAfter: "fruit-stall-chapter-1", teaches: "Taking away, with tins" },
  { id: "crates", name: "Produce Yard", x: 18, y: 21, r: 19, teaches: "Counting in groups" },
  { id: "bakery", name: "Bakery", x: 48, y: 31, r: 18, teaches: "Trays and rows" },
  { id: "danfo", name: "Bus Stop", x: 44, y: 9, r: 16, teaches: "Seats and passengers" },
  { id: "money", name: "Money Corner", x: 72, y: 56, r: 17, teaches: "Counting up for change" },
  { id: "tower", name: "The Tower", x: 86, y: 19, r: 17, teaches: null },
];

/** Whether a place's haze has lifted, from the stall_progress ids a child has. */
export const isOpen = (place, cleared = []) =>
  place.open === "start" || (place.opensAfter != null && cleared.includes(place.opensAfter));

/** How many places are open (the Fruit Stall always is). */
export const openCount = (cleared = []) => PLACES.filter((place) => isOpen(place, cleared)).length;
