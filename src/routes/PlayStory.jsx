import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import DialogueBox from "../components/DialogueBox";
import PlayHud from "../components/PlayHud";
import StallBackdrop from "../components/StallBackdrop";
import { SCENE_1, SCENE_1_DONE, SPEAKERS } from "../data/dialogue";
import { CRATE } from "../data/market";
import { getZiziLook } from "../data/zizi";
import { finishScene1 } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";
import "./PlayStory.css";

/**
 * /play/:playerId/story: Scene 1, the dim market. The child's Zizi hides
 * behind toppled crates as the haze drifts past, and Blob finds her. The
 * lines are in data/dialogue.js; Zizi's are labelled with the game name.
 *
 * "Let's go" saves scene1_done and goes straight to the Fruit Stall
 * (there is no map yet).
 */
export default function PlayStory() {
  const { player, goNext } = useOutletContext();
  const [index, setIndex] = useState(0);
  const finished = useRef(false);
  const zizi = getZiziLook(player.character);

  // While the story plays, fetch the stall.
  useEffect(() => {
    prefetchStep("stall/fruit", player);
  }, [player]);

  const line = SCENE_1[index];
  const last = index === SCENE_1.length - 1;
  // Blob arrives with his first line and stays.
  const blobHere = SCENE_1.slice(0, index + 1).some((said) => said.speaker === "blob");

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    finishScene1(player.id)
      .then(({ error }) => {
        // The child carries on either way; the scene just plays again next time.
        if (error) console.warn("Couldn't record that Scene 1 was played.", error);
      })
      .catch((error) => console.warn("Couldn't record that Scene 1 was played.", error));
    goNext({ scene1_done: true });
  };

  const next = () => (last ? finish() : setIndex((i) => i + 1));

  return (
    <div className="pm-story">
      <StallBackdrop dim />
      <PlayHud player={player} />

      <main id="main" className="pm-story__stage">
        <h1 className="pm-sr-only">The market, in the haze</h1>

        <div className={`pm-story__zizi${line.speaker === "zizi" ? " is-speaking" : ""}`} aria-hidden="true">
          <img className="pm-story__figure" src={zizi.src} width={zizi.w} height={zizi.h} alt="" draggable={false} />
          <img className="pm-story__crate pm-story__crate--back" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
          <img className="pm-story__crate pm-story__crate--front" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
        </div>

        {blobHere && (
          <div className={`pm-story__blob${line.speaker === "blob" ? " is-speaking" : ""}`} aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
          </div>
        )}

        <div className="pm-story__dialogue">
          <DialogueBox
            line={line}
            values={{ name: player.game_name }}
            ziziPortrait={zizi}
            buttonLabel={last ? SCENE_1_DONE : "Next"}
            onNext={next}
          />
        </div>
      </main>
    </div>
  );
}
