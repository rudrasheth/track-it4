import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Navigate to="/login" replace />;
}
