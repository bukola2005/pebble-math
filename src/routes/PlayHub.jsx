import { useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import PlayLoading from "../components/PlayLoading";
import { nextStep, stepTasks } from "../lib/playFlow";

/**
 * /play/:playerId itself: the loading screen. It works out where this
 * child goes next (lib/playFlow.js), loads exactly what that step needs,
 * then sends them there. Once the story is done, that is the Fruit Stall.
 */
export default function PlayHub() {
  const { player, keepFilm } = useOutletContext();
  const navigate = useNavigate();
  // Decided once, when the screen appears: later saves mustn't restart it.
  const [step] = useState(() => nextStep(player));
  const [tasks] = useState(() => stepTasks(step, player, keepFilm));

  const afterLoading = useCallback(() => {
    navigate(`/play/${player.id}/${step}`, { replace: true });
  }, [step, player.id, navigate]);

  // On a first play (the film is next) the picture is up for about two
  // seconds at least: it is the first thing the child sees. After that,
  // one second is enough.
  return <PlayLoading tasks={tasks} onDone={afterLoading} minimum={step === "intro" ? 2000 : 1000} />;
}
