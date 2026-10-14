import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "./Dashboard";

/**
 * The dashboard behind its sign-in check. It's a module of its own so the
 * route table can lazy-load the pair in one request, instead of fetching
 * ProtectedRoute first and the dashboard after it.
 */
export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
