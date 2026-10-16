import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import VideoIntro from "../components/VideoIntro";
import { finishFirstPlay } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";

/**
 * /play/:playerId/intro: the opening film, full screen, on a first play.
 *
 * first_play_done is saved as soon as the film ends or is skipped, so a
 * child who stops at the avatar screen isn't made to watch it again.
 */
export default function PlayIntro() {
  const { player, filmUrl, goNext } = useOutletContext();
  const finished = useRef(false);

  // While the film plays, quietly fetch the avatar screen and its pictures.
  useEffect(() => {
    prefetchStep("avatar", player);
  }, [player]);

  const finish = () => {
    if (finished.current) return; // Skip and the film's own end can both fire.
    finished.current = true;
    finishFirstPlay(player.id).then(({ error }) => {
      // Nothing for the child to do about it: the film just shows again next
      // time. Leave a trace for whoever is debugging.
      if (error) console.warn("Couldn't record that the film was seen.", error);
    });
    goNext({ first_play_done: true });
  };

  return <VideoIntro src={filmUrl ?? undefined} onDone={finish} />;
}
