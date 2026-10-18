import { lazy, Suspense, useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageLoading from "./components/PageLoading";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import Home from "./routes/Home";

/* The account and play pages are fetched only when someone goes to one of
   them, so the landing page ships no supabase-js and no account code. */
const AuthShell = lazy(() => import("./routes/AuthShell"));
const SignUp = lazy(() => import("./routes/SignUp"));
const SignIn = lazy(() => import("./routes/SignIn"));
const ForgotPassword = lazy(() => import("./routes/ForgotPassword"));
const ResetPassword = lazy(() => import("./routes/ResetPassword"));
const ProtectedDashboard = lazy(() => import("./routes/ProtectedDashboard"));
const ProtectedPlay = lazy(() => import("./routes/ProtectedPlay"));
const ProtectedPlaySession = lazy(() => import("./routes/ProtectedPlaySession"));
// The privacy notice and terms: public, and also fetched only when opened.
const LegalPage = lazy(() => import("./routes/LegalPage"));

export default function App() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  // A new page starts at the top. Without this, "Get Started" at the foot of
  // the landing page would open sign-up scrolled halfway down. The first
  // render is left alone so a link to /#parents still lands on that section.
  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <RouteErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<LegalPage doc="privacy" />} />
          <Route path="/terms" element={<LegalPage doc="terms" />} />

          {/* One AuthProvider for every page that needs an account (see AuthShell). */}
          <Route element={<AuthShell />}>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="/play" element={<ProtectedPlay />} />
            {/* A child's play session. Its steps (/intro, /avatar, /name)
                are routed inside PlaySessionShell, so that not even their
                names ship with the landing page. */}
            <Route path="/play/:playerId/*" element={<ProtectedPlaySession />} />
          </Route>

          {/* Anything else goes home rather than to a blank page. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
