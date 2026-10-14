import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

// `supabase` can be null when the settings are missing, but AuthProvider is
// only ever rendered by routes/AuthShell.jsx after it has checked that.

/*
  signUp, signIn and signOut return Supabase's own `{ data, error }` rather
  than throwing, so each page decides what to show. They don't touch React
  state themselves: when they succeed, Supabase fires an auth event and the
  listener below updates `session`. That keeps one source of truth.
*/

// The adult's name and role ride along as user metadata; a database
// trigger turns them into the `profiles` row (see supabase/schema.sql).
const signUp = ({ email, password, fullName, role }) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      // Where the confirmation link lands. The address must also be in the
      // Redirect URLs list in the Supabase dashboard, or it is ignored.
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });

const signIn = ({ email, password }) =>
  supabase.auth.signInWithPassword({ email, password });

// "local" ends this browser's session only. The default, "global", would
// also sign the same parent out of every other device they use.
const signOut = () => supabase.auth.signOut({ scope: "local" });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // True until we know whether a session already exists. Protected pages
  // wait on this so a signed-in parent isn't bounced to sign-in on refresh.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Read any session already stored in this browser. This also completes
    // the sign-in when the user arrives from an email confirmation link.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // Then follow sign-in, sign-out and token refresh as they happen.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
