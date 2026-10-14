import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./AuthLayout.css";

/**
 * The page sign-up and sign-in share: wordmark, a card with the headline,
 * and a line underneath that points to the other page.
 */
export default function AuthLayout({ title, sub, footer, children }) {
  // Headlines on this site end in a full stop; a browser tab shouldn't.
  useDocumentTitle(title.replace(/\.$/, ""));

  return (
    <div className="pm-auth">
      <header className="pm-auth__bar">
        <Link to="/" className="pm-auth__mark">
          Pebble Math
        </Link>
      </header>

      <main id="main" className="pm-auth__main">
        <div className="pm-auth__card">
          <h1 className="pm-auth__title">{title}</h1>
          {sub && <p className="pm-auth__sub">{sub}</p>}
          {children}
        </div>

        {footer && <p className="pm-auth__footer">{footer}</p>}
      </main>
    </div>
  );
}
