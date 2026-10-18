import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import PlayLoading from "../components/PlayLoading";
import { getPlayer } from "../lib/players";
import { listClearedStalls } from "../lib/progress";
import { nextStep } from "../lib/playFlow";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "../styles/game.css";
import "./PlaySessionShell.css";

/* The steps, one chunk each. lib/playFlow.js imports the same files to
   fetch a step before it is needed. */
const PlayHub = lazy(() => import("./PlayHub"));
const PlayIntro = lazy(() => import("./PlayIntro"));
const PlayAvatar = lazy(() => import("./PlayAvatar"));
const PlayName = lazy(() => import("./PlayName"));
const PlayStory = lazy(() => import("./PlayStory"));
const PlayStall = lazy(() => import("./PlayStall"));

/**
 * Everything at /play/:playerId and below: fetches the child's player row
 * once and hands it to whichever step is showing, through the Outlet
 * context:
 *
 *   player       the row, kept up to date as steps save things, plus
 *                `cleared_stalls` (from stall_progress)
 *   goNext(p)    record what a step just saved, then go to the next step
 *   filmUrl      the film, if the loading screen already downloaded it
 *   keepFilm(u)  for the loading screen to hand that copy over
 *   newcomer     true when this visit began before Scene 1 was played:
 *                the stall then gives them the basket and the tutorial.
 *                A child who comes back later goes straight to the stall.
 *
 * Row Level Security means another account's player simply isn't found, and
 * the child goes back to "Who's playing?".
 *
 * The steps are routed here rather than in App.jsx: /play/:playerId itself
 * is the loading screen (PlayHub), then /intro, /avatar, /name, /story and
 * /stall/fruit.
 */
export default function PlaySessionShell() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [failure, setFailure] = useState(null);
  const [missing, setMissing] = useState(false);
  const [filmUrl, setFilmUrl] = useState(null);
  const [newcomer, setNewcomer] = useState(false);
  const filmUrlRef = useRef(null);

  useDocumentTitle("Play");

  useEffect(() => {
    let active = true;
    // Which stalls they have cleared comes alongside, as
    // `player.cleared_stalls`. If that can't be read, the game still
    // starts, as if none were cleared yet.
    const cleared = listClearedStalls(playerId).catch((error) => ({ data: [], error }));
    Promise.all([getPlayer(playerId), cleared])
      .then(([{ data, error }, stalls]) => {
        if (!active) return;
        if (stalls.error) console.warn("Couldn't read which stalls are cleared.", stalls.error);
        if (error) setFailure(error);
        else if (!data) setMissing(true);
        else {
          setPlayer({ ...data, cleared_stalls: stalls.data });
          setNewcomer(!data.scene1_done);
          // Every visit starts at the loading screen, even a reload in the
          // middle of a step, so the step's pictures are in before it shows
          // and the steps can't be taken out of order.
          navigate(`/play/${data.id}`, { replace: true });
        }
      })
      .catch((error) => active && setFailure(error));
    return () => {
      active = false;
    };
  }, [playerId]);

  // The film arrives as a blob: URL. Free that memory when the session ends.
  const keepFilm = useCallback((url) => {
    filmUrlRef.current = url;
    setFilmUrl(url);
  }, []);

  useEffect(
    () => () => {
      if (filmUrlRef.current) URL.revokeObjectURL(filmUrlRef.current);
    },
    []
  );

  // Steps replace each other in history, so Back from any of them returns
  // to "Who's playing?" rather than replaying the film.
  const goNext = useCallback(
    (saved = {}) => {
      const updated = { ...player, ...saved };
      setPlayer(updated);
      const step = nextStep(updated);
      navigate(step ? `/play/${updated.id}/${step}` : `/play/${updated.id}`, {
        replace: true,
      });
    },
    [player, navigate]
  );

  const context = useMemo(
    () => ({ player, goNext, filmUrl, keepFilm, newcomer }),
    [player, goNext, filmUrl, keepFilm, newcomer]
  );

  if (missing) return <Navigate to="/play" replace />;

  if (failure) {
    return (
      <div className="pm-session">
        <main id="main" className="pm-session__message">
          <h1 className="pm-session__title">Something went wrong.</h1>
          <p className="pm-session__text">We couldn’t start the game.</p>
          {/* For whoever is setting this up, never shown to a visitor. */}
          {import.meta.env.DEV && (
            <p className="pm-session__dev">
              {failure.message ?? String(failure)}. If it names a column, run
              the SQL in supabase/schema.sql.
            </p>
          )}
          <CTAButton onClick={() => navigate("/play")}>Back</CTAButton>
        </main>
      </div>
    );
  }

  // The loading picture is up from the very first moment, so there is no
  // blank screen while the player row arrives.
  if (!player) return <PlayLoading tasks={null} />;

  return (
    <Suspense fallback={<PlayLoading tasks={null} />}>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route index element={<PlayHub />} />
          <Route path="intro" element={<PlayIntro />} />
          <Route path="avatar" element={<PlayAvatar />} />
          <Route path="name" element={<PlayName />} />
          <Route path="story" element={<PlayStory />} />
          <Route path="stall/fruit" element={<PlayStall />} />
          {/* Anything else under a player goes through the loading screen. */}
          <Route path="*" element={<Navigate to={`/play/${player.id}`} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
