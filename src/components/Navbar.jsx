import { useState } from "react";
import CTAButton from "./CTAButton";
import "./Navbar.css";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Learning", href: "#learning" },
  { label: "For parents", href: "#parents" },
];

export default function Navbar({ onStart }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="pm-nav" data-pm-nav data-open={open ? "true" : "false"}>
      <div className="pm-shell pm-nav__inner">
        <a className="pm-nav__mark" href="#top">
          Pebble Math
        </a>

        <nav className="pm-nav__links" aria-label="Main">
          {LINKS.map((link) => (
            <a key={link.href} className="pm-nav__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="pm-nav__actions">
          <CTAButton size="sm" onClick={onStart} className="pm-nav__cta">
            Get Started
          </CTAButton>

          <button
            type="button"
            className="pm-nav__burger"
            aria-expanded={open}
            aria-controls="pm-mobile-menu"
            data-pm-menu-toggle
            onClick={() => setOpen((v) => !v)}
          >
            <span className="pm-sr-only">Menu</span>
            <span className="pm-nav__burger-bars" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div className="pm-nav__mobile" id="pm-mobile-menu">
        <nav className="pm-nav__mobile-inner" aria-label="Main (mobile)">
          {LINKS.map((link) => (
            <a key={link.href} className="pm-nav__mobile-link" href={link.href}>
              {link.label}
            </a>
          ))}
          <CTAButton
            className="pm-nav__mobile-cta"
            onClick={() => {
              setOpen(false);
              onStart?.();
            }}
          >
            Get Started
          </CTAButton>
        </nav>
      </div>
    </header>
  );
}
