import "./Footer.css";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Learning", href: "#learning" },
  { label: "For parents", href: "#parents" },
];

export default function Footer() {
  return (
    <footer className="pm-footer">
      <div className="pm-shell pm-footer__inner">
        <div className="pm-footer__brand">
          <span className="pm-footer__mark">Pebble Math</span>
          <p className="pm-footer__line">
            A 2D math game for children, set in one market. In development.
          </p>
        </div>

        <nav className="pm-footer__nav" aria-label="Footer">
          {LINKS.map((link) => (
            <a key={link.href} className="pm-footer__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="pm-shell pm-footer__base">
        <span>© {new Date().getFullYear()} Pebble Math</span>
        <span>Prices in naira (₦)</span>
      </div>
    </footer>
  );
}
