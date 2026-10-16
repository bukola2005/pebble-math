import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import CharacterPicker from "../components/CharacterPicker";
import IntroSequence from "../components/IntroSequence";
import MarketPlaceholder from "../components/MarketPlaceholder";
import PlayLoading from "../components/PlayLoading";
import VideoIntro from "../components/VideoIntro";
import { CHARACTERS, getCharacter } from "../data/characters";
import { INTRO_FILM } from "../data/media";
import { chooseCharacter, finishFirstPlay, getPlayer } from "../lib/players";
import { pickPlayableSource, preloadFile, preloadImage } from "../lib/preload";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./PlaySession.css";

// Rough sizes in bytes. They only balance the bar between files until each
// file reports its real size; how full the bar is comes from real loading.
const IMAGE_BYTES = 45_000;
const FILM_BYTES = 1_800_000;

/*
  What the loading screen waits for.

  First play: all eight characters (the child is about to choose one), the
  film's poster, and the film itself, so it plays without stalling.
  Every play after that: only the child's own character. The market isn't
  built yet, so there is nothing else to fetch, and the bar says so honestly
  by filling fast.
*/
function sessionTasks(player, firstPlay, keepFilm) {
  const image = (src) => ({ weight: IMAGE_BYTES, run: () => preloadImage(src) });

  if (!firstPlay) {
    return player.character ? [image(getCharacter(player.character).src)] : [];
  }

  const film = pickPlayableSource(INTRO_FILM.sources);
  return [
    ...CHARACTERS.map((character) => image(character.src)),
    image(INTRO_FILM.poster),
    ...(film
      ? [
          {
            weight: FILM_BYTES,
            run: (report, signal) => preloadFile(film.src, report, signal).then(keepFilm),
          },
        ]
      : []),
  ];
}

/**
 * One child's play session, at /play/:playerId:
 *
 *   loading → (first play only: pick a character → the film → the welcome)
 *           → the market
 *
 * The character is saved the moment the child confirms it. first_play_done
 * is saved when they reach the market, so a child who leaves part-way
 * through sees the introduction again next time.
 */
export default function PlaySession() {
  const { playerId } = useParams();
  const navigate = useNavigate();

  // `firstPlay` is fixed when the player row arrives: finishing the intro
  // part-way through must not change what this session is.
  const [session, setSession] = useState(null);
  const [failure, setFailure] = useState(null);
  const [missing, setMissing] = useState(false);
  // "loading" | "character" | "video" | "welcome" | "market"
  const [stage, setStage] = useState("loading");
  const [character, setCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [filmUrl, setFilmUrl] = useState(null);
  const filmUrlRef = useRef(null);
  const stageRef = useRef(null);
  const markedDone = useRef(false);

  useDocumentTitle("Play");

  // Row Level Security: another account's player simply isn't found.
  useEffect(() => {
    let active = true;
    getPlayer(playerId)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setFailure(error);
        else if (!data) setMissing(true);
        else {
          setSession({ player: data, firstPlay: !data.first_play_done });
          setCharacter(data.character);
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

  const tasks = useMemo(
    () => (session ? sessionTasks(session.player, session.firstPlay, keepFilm) : null),
    [session, keepFilm]
  );

  const afterLoading = useCallback(() => {
    setStage(session.firstPlay ? "character" : "market");
  }, [session]);

  // Each new step takes focus, so keyboard and screen-reader users start
  // there rather than on a button that has just disappeared.
  useEffect(() => {
    if (stage !== "loading") stageRef.current?.focus();
  }, [stage]);

  // Reaching the market is what completes a first play.
  useEffect(() => {
    if (stage !== "market" || !session?.firstPlay || markedDone.current) return;
    markedDone.current = true;
    finishFirstPlay(session.player.id).then(({ error }) => {
      // Nothing for the child to do about it: the introduction just shows
      // again next time. Leave a trace for whoever is debugging.
      if (error) console.warn("Couldn't record that the first play is done.", error);
    });
  }, [stage, session]);

  const confirmCharacter = async (id) => {
    setSaving(true);
    setSaveError("");
    try {
      const { error } = await chooseCharacter(session.player.id, id);
      if (error) {
        setSaveError("That didn’t save. Please try again.");
        return;
      }
      setCharacter(id);
      setStage("video");
    } catch {
      setSaveError("That didn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (missing) return <Navigate to="/play" replace />;

  if (failure) {
    return (
      <div className="pm-session">
        <main id="main" className="pm-session__stage pm-session__message">
          <h1 className="pm-session__title">Something went wrong.</h1>
          <p className="pm-session__text">We couldn’t start the game.</p>
          {/* For whoever is setting this up, never shown to a visitor. */}
          {import.meta.env.DEV && (
            <p className="pm-session__dev">
              {failure.message ?? String(failure)} — if it mentions
              first_play_done, run the SQL in supabase/schema.sql.
            </p>
          )}
          <CTAButton onClick={() => navigate("/play")}>Back</CTAButton>
        </main>
      </div>
    );
  }

  if (stage === "loading") {
    return <PlayLoading tasks={tasks} onDone={afterLoading} />;
  }

  const player = { ...session.player, character };

  return (
    <div className="pm-session">
      <main
        id="main"
        ref={stageRef}
        tabIndex={-1}
        className={`pm-session__stage pm-session__stage--${stage}`}
      >
        {stage === "character" && (
          <CharacterPicker
            initial={session.player.character}
            saving={saving}
            error={saveError}
            onConfirm={confirmCharacter}
          />
        )}

        {stage === "video" && (
          <VideoIntro src={filmUrl ?? undefined} onDone={() => setStage("welcome")} />
        )}

        {stage === "welcome" && (
          <IntroSequence
            name={player.display_name}
            character={getCharacter(player.character)}
            onDone={() => setStage("market")}
          />
        )}

        {stage === "market" && <MarketPlaceholder player={player} />}
      </main>
    </div>
  );
}
