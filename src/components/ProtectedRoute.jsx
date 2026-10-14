import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoading from "./PageLoading";

/**
 * Keeps signed-out visitors away from a page.
 *
 * While the stored session is still being read we show a loading state
 * instead of redirecting, otherwise a signed-in parent would be bounced to
 * sign-in on every refresh. Once we know they're signed out, we send them to
 * /signin and remember where they were headed in router state, so sign-in
 * can take them back there.
 */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;

  if (!session) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}
