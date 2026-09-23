import { useEffect, useRef, useState } from "react";
import OnboardingStep from "./OnboardingStep";
import VideoIntro from "./VideoIntro";
import IntroSequence from "./IntroSequence";
import CTAButton from "./CTAButton";
import { CHARACTERS, getCharacter } from "../data/characters";
import "./GetStartedFlow.css";

const ROLES = [
  {
    id: "student",
    title: "Student",
    text: "I’m here to play and learn.",
  },
  {
    id: "parent",
    title: "Parent",
    text: "I’m setting this up for my child.",
  },
  {
    id: "teacher",
    title: "Teacher",
    text: "I want to use it with my class.",
  },
];

const AGES = ["6", "7", "8", "9", "10", "11+"];
const CLASSES = ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];

const EMPTY_PLAYER = { role: null, name: "", age: null, grade: null, character: "purple" };

/**
 * The Get Started journey, prototyped end to end on local state:
 * role → played before? → name → age → player → film → intro →
 * the market.
 *
 * There is no account, no database and no network call anywhere in here.
 * Nothing a child types leaves the browser tab.
 */
export default function GetStartedFlow({ open, onClose }) {
  const [step, setStep] = useState("role");
  const [player, setPlayer] = useState(EMPTY_PLAYER);
  const nameInput = useRef(null);
  const panel = useRef(null);

  const set = (patch) => setPlayer((prev) => ({ ...prev, ...patch }));

  // Escape closes; the page behind stays put while the flow is open.
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (step === "name") nameInput.current?.focus();
  }, [step]);

  if (!open) return null;

  const restart = () => {
    setPlayer(EMPTY_PLAYER);
    setStep("role");
  };

  const close = () => {
    onClose();
    // Next time the flow opens it starts clean.
    setTimeout(restart, 250);
  };

  const character = getCharacter(player.character);

  return (
    <div
      className="pm-flow"
      role="dialog"
      aria-modal="true"
      aria-label="Get started with Pebble Math"
    >
      <div className="pm-flow__bar">
        <span className="pm-flow__mark">Pebble Math</span>
        <button type="button" className="pm-flow__close" onClick={close}>
          <span className="pm-sr-only">Close</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={`pm-flow__panel${
          step === "video" ? " pm-flow__panel--wide" : ""
        }`}
        ref={panel}
        tabIndex={-1}
      >
        {/* ---------- 1. who are you ---------- */}
        {step === "role" && (
          <OnboardingStep index={1} total={5} title="Who are you?">
            <div className="pm-flow__roles">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className="pm-flow__role"
                  onClick={() => {
                    set({ role: role.id });
                    setStep(role.id === "student" ? "played" : "grown");
                  }}
                >
                  <span className="pm-flow__role-title">{role.title}</span>
                  <span className="pm-flow__role-text">{role.text}</span>
                </button>
              ))}
            </div>
          </OnboardingStep>
        )}

        {/* ---------- 2. have you been here before ---------- */}
        {step === "played" && (
          <OnboardingStep
            index={2}
            total={5}
            title="Have you played Pebble Math before?"
            onBack={() => setStep("role")}
          >
            <div className="pm-flow__roles pm-flow__roles--pair">
              <button
                type="button"
                className="pm-flow__role"
                onClick={() => setStep("name")}
              >
                <span className="pm-flow__role-title">No, I’m new</span>
                <span className="pm-flow__role-text">
                  Make a player and start at the first stall.
                </span>
              </button>
              <button
                type="button"
                className="pm-flow__role"
                onClick={() => setStep("returning")}
              >
                <span className="pm-flow__role-title">Yes, I’ve played</span>
                <span className="pm-flow__role-text">
                  There is no account to come back to yet.
                </span>
              </button>
            </div>
          </OnboardingStep>
        )}

        {/* ---------- the honest answer for returning players ---------- */}
        {step === "returning" && (
          <OnboardingStep
            title="Welcome back."
            sub="Pebble Math has no accounts yet, so there is nothing saved to come back to: not your name, not your progress. Everything is made fresh, and it disappears when you close the tab."
            onBack={() => setStep("played")}
            onNext={() => setStep("name")}
            nextLabel="Make a player"
          >
            <p className="pm-flow__aside">
              Saving progress is on the list, after the first chapter is
              playable.
            </p>
          </OnboardingStep>
        )}

        {/* ---------- 3. name ---------- */}
        {step === "name" && (
          <OnboardingStep
            index={3}
            total={5}
            title="What should we call you?"
            sub="This stays in your browser. We don’t send it anywhere."
            onBack={() => setStep("played")}
            onNext={() => setStep("age")}
            nextDisabled={!player.name.trim()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (player.name.trim()) setStep("age");
              }}
            >
              <label className="pm-sr-only" htmlFor="pm-name">
                Your name
              </label>
              <input
                id="pm-name"
                ref={nameInput}
                className="pm-flow__input"
                type="text"
                value={player.name}
                maxLength={24}
                autoComplete="off"
                placeholder="Type your name"
                onChange={(e) => set({ name: e.target.value })}
              />
            </form>
          </OnboardingStep>
        )}

        {/* ---------- 4. age or class ---------- */}
        {step === "age" && (
          <OnboardingStep
            index={4}
            total={5}
            title="How old are you?"
            sub="It sets where in the market you start. You can change it later."
            onBack={() => setStep("name")}
            onNext={() => setStep("player")}
            nextDisabled={!player.age}
          >
            <div className="pm-flow__chips">
              {AGES.map((age) => (
                <button
                  key={age}
                  type="button"
                  className={`pm-chip${player.age === age ? " is-on" : ""}`}
                  aria-pressed={player.age === age}
                  onClick={() => set({ age })}
                >
                  {age}
                </button>
              ))}
            </div>

            <p className="pm-flow__label">Class (optional)</p>
            <div className="pm-flow__chips">
              {CLASSES.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`pm-chip pm-chip--soft${
                    player.grade === grade ? " is-on" : ""
                  }`}
                  aria-pressed={player.grade === grade}
                  onClick={() =>
                    set({ grade: player.grade === grade ? null : grade })
                  }
                >
                  {grade}
                </button>
              ))}
            </div>
          </OnboardingStep>
        )}

        {/* ---------- 5. player ---------- */}
        {step === "player" && (
          <OnboardingStep
            index={5}
            total={5}
            title="Pick who you’ll be."
            sub="Your character walks the market with you."
            onBack={() => setStep("age")}
            onNext={() => setStep("video")}
            nextLabel="Enter Pebble Math"
          >
            <div className="pm-flow__picker">
              {CHARACTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`pm-flow__avatar${
                    player.character === option.id ? " is-on" : ""
                  }`}
                  aria-pressed={player.character === option.id}
                  onClick={() => set({ character: option.id })}
                >
                  <span className="pm-sr-only">{option.label} character</span>
                  <img
                    src={option.src}
                    alt=""
                    aria-hidden="true"
                    width={option.w}
                    height={option.h}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>

            <div className="pm-flow__card">
              <img
                className="pm-flow__card-img"
                src={character.src}
                alt=""
                aria-hidden="true"
                width={character.w}
                height={character.h}
                decoding="async"
              />
              <div>
                <p className="pm-flow__card-name">{player.name || "Player"}</p>
                <p className="pm-flow__card-meta">
                  Age {player.age}
                  {player.grade ? ` · ${player.grade}` : ""}
                </p>
              </div>
            </div>
          </OnboardingStep>
        )}

        {/* ---------- the opening film ---------- */}
        {step === "video" && <VideoIntro onDone={() => setStep("intro")} />}

        {/* ---------- the intro ---------- */}
        {step === "intro" && (
          <IntroSequence
            name={player.name.trim()}
            character={character}
            onDone={() => setStep("done")}
          />
        )}

        {/* ---------- where the game will start ---------- */}
        {step === "done" && (
          <div className="pm-flow__done">
            <div className="pm-flow__card pm-flow__card--lg">
              <img
                className="pm-flow__card-img"
                src={character.src}
                alt=""
                aria-hidden="true"
                width={character.w}
                height={character.h}
                decoding="async"
              />
              <div>
                <p className="pm-flow__card-name">
                  {player.name || "Player"}
                </p>
                <p className="pm-flow__card-meta">
                  Age {player.age}
                  {player.grade ? ` · ${player.grade}` : ""} · Chapter 1,
                  Addition
                </p>
              </div>
            </div>

            <h2 className="pm-flow__done-title">This is where the market opens.</h2>
            <p className="pm-flow__done-text">
              The first chapter is in development. Everything before this
              screen is the real journey. The game itself is what we build
              next.
            </p>

            <div className="pm-flow__done-actions">
              <CTAButton onClick={close}>Back to the site</CTAButton>
              <button type="button" className="pm-step__back" onClick={restart}>
                Start over
              </button>
            </div>
          </div>
        )}

        {/* ---------- parents and teachers ---------- */}
        {step === "grown" && (
          <OnboardingStep
            title={
              player.role === "teacher"
                ? "For your class."
                : "For your child."
            }
            sub="Pebble Math is a game a child plays. The tools around it are planned, not built yet."
            onBack={() => setStep("role")}
            onNext={() => {
              set({ role: "student" });
              setStep("name");
            }}
            nextLabel="Look around as a student"
          >
            <ul className="pm-flow__notes">
              <li>
                <strong>What exists today:</strong> the market, the first
                chapter&apos;s design, and this journey.
              </li>
              <li>
                <strong>What comes next:</strong> the addition chapter as a
                playable scene.
              </li>
              <li>
                <strong>Planned after that:</strong> a simple view of what a
                child has practised and where they got stuck.
              </li>
            </ul>
          </OnboardingStep>
        )}
      </div>
    </div>
  );
}
