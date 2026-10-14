import { Link, Outlet } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { AuthProvider } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * What sits around /signup, /signin and /dashboard, and nothing else.
 *
 * AuthProvider lives here rather than in main.jsx so the landing page never
 * loads supabase-js or any account code. This file is itself lazily loaded
 * (see App.jsx).
 *
 * If the Supabase settings are missing there is no client to talk to, so
 * every account page shows the same plain message instead. The landing page
 * is unaffected.
 */
export default function AuthShell() {
  if (!supabase) return <AccountsUnavailable />;

  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function AccountsUnavailable() {
  return (
    <AuthLayout
      title="Accounts aren’t available right now."
      sub="This copy of Pebble Math isn’t connected to its account service yet."
      footer={
        <Link className="pm-auth__link" to="/">
          Back to the home page
        </Link>
      }
    >
      {/* Only shown while developing; visitors don't need the variable names. */}
      {import.meta.env.DEV && (
        <p className="pm-auth__aside">
          Developer note: set VITE_SUPABASE_URL and
          VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart{" "}
          <code>npm run dev</code>. The README has the steps.
        </p>
      )}
    </AuthLayout>
  );
}
