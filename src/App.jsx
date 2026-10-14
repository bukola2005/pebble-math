import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoading from "./components/PageLoading";
import Home from "./routes/Home";

/* The account pages are fetched only when someone goes to one of them, so
   the landing page ships no supabase-js and no account code. */
const AuthShell = lazy(() => import("./routes/AuthShell"));
const SignUp = lazy(() => import("./routes/SignUp"));
const SignIn = lazy(() => import("./routes/SignIn"));
const ProtectedDashboard = lazy(() => import("./routes/ProtectedDashboard"));

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* One AuthProvider for the three account pages (see AuthShell). */}
        <Route element={<AuthShell />}>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<ProtectedDashboard />} />
        </Route>

        {/* Anything else goes home rather than to a blank page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
