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

  return <PlayLoading tasks={tasks} onDone={afterLoading} />;
}
