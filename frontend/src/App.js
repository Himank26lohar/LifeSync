import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./landing/LandingPage";
import AppShell from "./AppShell";
import { clearStoredSession, getStoredSession } from "./api/client";
import { me } from "./api/auth";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    me()
      .then((response) => {
        setSession((current) => current ? { ...current, user: response.user } : current);
      })
      .catch(() => {
        clearStoredSession();
        setSession(null);
      });
  }, [session?.token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage session={session} onAuthSuccess={setSession} />} />
        <Route path="/app" element={session ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/" replace />} />
        <Route path="/app/:pageId" element={session ? <AppShell session={session} onSignOut={() => setSession(null)} /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
