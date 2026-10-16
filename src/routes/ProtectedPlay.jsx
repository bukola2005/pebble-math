import ProtectedRoute from "../components/ProtectedRoute";
import Play from "./Play";

/** "Who's playing?" behind its sign-in check, lazy-loaded as one module. */
export default function ProtectedPlay() {
  return (
    <ProtectedRoute>
      <Play />
    </ProtectedRoute>
  );
}
