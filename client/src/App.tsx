import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { SchedulerPage } from "@/pages/SchedulerPage";
import { SignupPage } from "@/pages/SignupPage";
import type { ReactNode } from "react";

/** Blank ground while the session check runs, so nothing flashes. */
function Loading() {
  return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
}

/**
 * Gate for signed-in routes. This is a UX guard only - the real enforcement is
 * `requireAuth` on the server, which every task route sits behind.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Keeps a signed-in user off the auth pages. */
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <SchedulerPage />
          </RequireAuth>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
