import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Never redirect while the session is still hydrating — prevents a
  // login-page flash on hard refresh for logged-in users.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
