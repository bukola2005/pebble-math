import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Global styles come first so every route has the tokens and the reset,
// whichever page loads. Home imports them too; the bundler includes them once.
import "./styles/tokens.css";
import "./styles/base.css";
import App from "./App";

// AuthProvider is not here: it wraps only the account pages (routes/AuthShell.jsx).
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
