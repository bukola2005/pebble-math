import { useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import MarketPlaceholder from "../components/MarketPlaceholder";
import PlayLoading from "../components/PlayLoading";
import { nextStep, stepTasks } from "../lib/playFlow";

/**
 * /play/:playerId itself: the loading screen. It works out where this
 * child goes next (lib/playFlow.js), loads exactly what that step needs,
 * then sends them there.
 *
 * When every step built so far is done, it ends on "this is where the
 * market opens" for now.
 */
export default function PlayHub() {
  const { player, keepFilm } = useOutletContext();
  const navigate = useNavigate();
  // Decided once, when the screen appears: later saves mustn't restart it.
  const [step] = useState(() => nextStep(player));
  const [tasks] = useState(() => stepTasks(step, player, keepFilm));
  const [ready, setReady] = useState(false);

  const afterLoading = useCallback(() => {
    if (step) navigate(`/play/${player.id}/${step}`, { replace: true });
    else setReady(true);
  }, [step, player.id, navigate]);

  if (step || !ready) return <PlayLoading tasks={tasks} onDone={afterLoading} />;

  return (
    <div className="pm-session">
      <main id="main" className="pm-session__stage">
        <MarketPlaceholder player={player} />
      </main>
    </div>
  );
}
