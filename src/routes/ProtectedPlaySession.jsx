import ProtectedRoute from "../components/ProtectedRoute";
import PlaySessionShell from "./PlaySessionShell";

/**
 * One child's play session behind its sign-in check, lazy-loaded as one
 * module. The steps inside it (PlayHub, PlayIntro, PlayAvatar, PlayName)
 * are each their own chunk, see App.jsx.
 */
export default function ProtectedPlaySession() {
  return (
    <ProtectedRoute>
      <PlaySessionShell />
    </ProtectedRoute>
  );
}
