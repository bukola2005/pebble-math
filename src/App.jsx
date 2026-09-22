import { lazy, Suspense, useState } from "react";
import "./styles/tokens.css";
import "./styles/base.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import InsideMarket from "./components/InsideMarket";
import BigIdea from "./components/BigIdea";
import HowItWorks from "./components/HowItWorks";
import LearningJourney from "./components/LearningJourney";
import MathInteractionPreview from "./components/MathInteractionPreview";
import MoneyPreview from "./components/MoneyPreview";
import ParentSection from "./components/ParentSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

/* The onboarding flow is a few hundred lines and eight character
   images that most visitors never open, so it is fetched on the click
   that needs it rather than shipped with the landing page. */
const GetStartedFlow = lazy(() => import("./components/GetStartedFlow"));

export default function App() {
  const [starting, setStarting] = useState(false);
  const start = () => setStarting(true);

  return (
    <>
      <a className="pm-skip" href="#main">
        Skip to content
      </a>
      <Navbar onStart={start} />
      <main id="main">
        <Hero onStart={start} />
        <InsideMarket />
        <BigIdea />
        <HowItWorks />
        <LearningJourney />
        <MathInteractionPreview />
        <MoneyPreview />
        <ParentSection />
        <CTASection onStart={start} />
      </main>
      <Footer />

      {starting && (
        <Suspense fallback={null}>
          <GetStartedFlow open onClose={() => setStarting(false)} />
        </Suspense>
      )}
    </>
  );
}
