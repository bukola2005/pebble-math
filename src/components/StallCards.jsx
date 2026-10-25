import { useEffect, useRef, useState } from "react";
import { SPEAKERS, fillLine } from "../data/dialogue";
import { LANTERN } from "../data/lanterns";
import { speak, useReadAloud } from "../lib/speech";

/*
  What every stall shows around its rounds, the same at each place: the
  customer's order strip, the trader coming back with their lantern, a
  friend of Blob's joining, and Blob's errand as the child leaves. Styled
  in routes/PlayStall.css, which both stall screens use.
*/

/**
 * The order, up for the whole round: who asked, and the number ("23
 * oranges"), read aloud as they say it (`say`). Done appears once there is
 * something to check (`onDone`); "Hmm, let me count these again." comes
 * under it (`note`, said again each time `noteKey` changes). With no
 * Done, it is just the strip: a shelf's size, say.
 */
export function OrderStrip({ who, text, say, voice = SPEAKERS.customer.voice, onDone = null, doneLabel = "Done", note = null, noteKey = 0 }) {
  useReadAloud(say, voice);

  // Said each time it is given, even when it hasn't changed.
  useEffect(() => {
    if (note) speak(note, voice);
  }, [note, noteKey]);

  return (
    <div className="pm-stall__order" role="group" aria-label={who}>
      <p className="pm-stall__order-words">
        <span className="pm-stall__order-who">{who}</span>
        <span className="pm-stall__order-want">{text}</span>
      </p>
      {onDone && (
        <button type="button" className="pm-stall__order-done" onClick={onDone}>
          {doneLabel}
        </button>
      )}
      {note && (
        <p key={noteKey} className="pm-stall__order-note" aria-live="polite">
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * The end of a chapter: the trader is back from asking along the row
 * (into the picture, and on a card), with whatever news there is (`news`,
 * the first time only). Their lantern arrives, and the first time one
 * more, for minding the stall alone; after that, one for coming back
 * (data/lanterns.js), each with the line that brings it. Then they point
 * at the next part of the market. In their voice; without motion the
 * lanterns are simply there.
 *   words   { title, news?, first, again, point, button } (data/dialogue.js)
 */
export function TraderBack({ words, portrait, voice, first, values = {}, onDone }) {
  const buttonRef = useRef(null);
  const news = first ? (words.news ?? []).map((text) => fillLine(text, values)) : [];
  const lines = first ? words.first : words.again;

  useReadAloud(`${words.title} ${[...news, ...lines].join(" ")} ${words.point}`, voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-back-title">
      <div className="pm-stall__end-card pm-stall__back-card">
        <img className="pm-stall__back-trader" src={portrait.src} width={portrait.w} height={portrait.h} alt="" draggable={false} />
        <h2 id="pm-back-title" className="pm-stall__end-title">
          {words.title}
        </h2>
        {news.length > 0 && (
          <div className="pm-stall__back-news">
            {news.map((text) => (
              <p key={text} className="pm-stall__end-text">
                {text}
              </p>
            ))}
          </div>
        )}
        <ul className="pm-stall__back-lanterns">
          {lines.map((text, i) => (
            // Each lantern waits a little for the news before it.
            <li key={text} className="pm-stall__back-beat" style={{ "--beat": i + news.length * 0.7 }}>
              <img className="pm-stall__back-lantern" src={LANTERN.lit.src} width={LANTERN.lit.w} height={LANTERN.lit.h} alt="" draggable={false} />
              <p className="pm-stall__end-text">{text}</p>
            </li>
          ))}
        </ul>
        <p className="pm-stall__back-point">
          {words.point}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {words.button}
        </button>
      </div>
    </div>
  );
}

/**
 * One of Blob's friends joins the search (data/friends.js), the first time
 * a place is finished. Blob says it, in his voice: he knows them.
 *   words   { title, lines, button }, with `{friend}` for their name
 */
export function FriendCard({ friend, words, onDone }) {
  const buttonRef = useRef(null);
  const values = { friend: friend.name };
  const title = fillLine(words.title, values);
  const lines = words.lines.map((text) => fillLine(text, values));

  useReadAloud(`${title} ${lines.join(" ")}`, SPEAKERS.blob.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-friend-title">
      <div className="pm-stall__end-card pm-stall__friend-card">
        <img className="pm-stall__friend" src={friend.art.src} width={friend.art.w} height={friend.art.h} alt="" draggable={false} />
        <h2 id="pm-friend-title" className="pm-stall__end-title">
          {title}
        </h2>
        {lines.map((text) => (
          <p key={text} className="pm-stall__end-text">
            {text}
          </p>
        ))}
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {words.button}
        </button>
      </div>
    </div>
  );
}

/**
 * The end of a session: Blob's errand, one small thing to try away from
 * the screen, picked at random from the stall's list (`errands`,
 * data/dialogue.js). `sayEnd` adds `endLine`, that this is as far as the
 * market goes for now, unless the card before just said so.
 */
export function EndForNow({ errands, labels, sayEnd, endLine = labels.endLine, onDone }) {
  const buttonRef = useRef(null);
  const [errand] = useState(() => errands[Math.floor(Math.random() * errands.length)]);

  useReadAloud(sayEnd ? `${errand} ${endLine}` : errand, SPEAKERS.blob.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-end-errand">
      <div className="pm-stall__end-card">
        <div className="pm-stall__errand">
          <img className="pm-stall__errand-blob" src={SPEAKERS.blob.portrait} alt="" draggable={false} />
          <div>
            <p className="pm-stall__errand-label">{labels.errandLabel}</p>
            <h2 id="pm-end-errand" className="pm-stall__errand-text">
              {errand}
            </h2>
          </div>
        </div>
        {sayEnd && <p className="pm-stall__end-quiet">{endLine}</p>}
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {labels.button}
        </button>
      </div>
    </div>
  );
}
