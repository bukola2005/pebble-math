import ProtectedRoute from "../components/ProtectedRoute";
import PlaySession from "./PlaySession";

/** One child's play session behind its sign-in check, lazy-loaded as one module. */
export default function ProtectedPlaySession() {
  return (
    <ProtectedRoute>
      <PlaySession />
    </ProtectedRoute>
  );
}
