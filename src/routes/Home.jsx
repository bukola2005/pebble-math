import { useNavigate } from "react-router-dom";
import "../styles/tokens.css";
import "../styles/base.css";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import InsideMarket from "../components/InsideMarket";
import BigIdea from "../components/BigIdea";
import HowItWorks from "../components/HowItWorks";
import LearningJourney from "../components/LearningJourney";
import MathInteractionPreview from "../components/MathInteractionPreview";
import MoneyPreview from "../components/MoneyPreview";
import ParentSection from "../components/ParentSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();
  // Every Get Started button on the page leads to sign-up: the account is
  // the grown-up's, and children are added from the dashboard.
  const start = () => navigate("/signup");

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
    </>
  );
}
