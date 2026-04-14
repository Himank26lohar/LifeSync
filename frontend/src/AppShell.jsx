import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "./responsive.css";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Habits from "./pages/Habits";
import Wellness from "./pages/Wellness";
import Journal from "./pages/Journal";
import AIInsights from "./pages/AIInsights";
import TimeManager from "./pages/TimeManager";
import Profile from "./pages/Profile";

import { T } from "./constants/theme";
import { getTasks } from "./api/tasks";
import { getHabits } from "./api/habits";
import { getWellness } from "./api/wellness";
import { getEntries } from "./api/journal";
import { getFocusSessions, getBlocks } from "./api/time";

const VALID_PAGES = new Set([
  "dashboard",
  "tasks",
  "habits",
  "wellness",
  "time",
  "journal",
  "ai",
  "profile",
]);

export default function AppShell({ session, onSignOut }) {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const page = pageId || "dashboard";
  const [theme, setTheme] = useState(() => localStorage.getItem("lifesync-theme") || "light");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [loadingWellness, setLoadingWellness] = useState(true);
  const [loadingJournal, setLoadingJournal] = useState(true);
  const [focusSessions, setFocusSessions] = useState([]);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    getTasks().then(setTasks).catch(() => {}).finally(() => setLoadingTasks(false));
    getHabits().then(setHabits).catch(() => {}).finally(() => setLoadingHabits(false));
    getWellness().then(setWellness).catch(() => {}).finally(() => setLoadingWellness(false));
    getEntries().then(setEntries).catch(() => {}).finally(() => setLoadingJournal(false));
    getFocusSessions().then(setFocusSessions).catch(() => {});
    getBlocks().then(setBlocks).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("lifesync-theme", theme);
  }, [theme]);

  const setPage = (nextPage) => {
    if (VALID_PAGES.has(nextPage)) {
      navigate(`/app/${nextPage}`);
    }
  };

  const pages = useMemo(
    () => ({
      dashboard: (
        <Dashboard
          tasks={tasks}
          habits={habits}
          wellness={wellness}
          focusSessions={focusSessions}
          entries={entries}
          setPage={setPage}
        />
      ),
      tasks: <Tasks tasks={tasks} setTasks={setTasks} loading={loadingTasks} />,
      habits: <Habits habits={habits} setHabits={setHabits} loading={loadingHabits} />,
      wellness: <Wellness wellness={wellness} setWellness={setWellness} loading={loadingWellness} />,
      time: (
        <TimeManager
          focusSessions={focusSessions}
          setFocusSessions={setFocusSessions}
          blocks={blocks}
          setBlocks={setBlocks}
          tasks={tasks}
        />
      ),
      journal: <Journal entries={entries} setEntries={setEntries} loading={loadingJournal} />,
      ai: (
        <AIInsights
          tasks={tasks}
          habits={habits}
          wellness={wellness}
          focusSessions={focusSessions}
          entries={entries}
        />
      ),
      profile: <Profile theme={theme} setTheme={setTheme} />,
    }),
    [
      tasks,
      habits,
      wellness,
      focusSessions,
      entries,
      loadingTasks,
      loadingHabits,
      loadingWellness,
      loadingJournal,
      blocks,
      theme,
      setPage,
    ]
  );

  if (!VALID_PAGES.has(page)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div
      className="app-layout"
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Inter", sans-serif',
      }}
    >
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} session={session} onSignOut={onSignOut} />

      <div
        className="main-content"
        style={{
          paddingLeft: sidebarOpen ? "294px" : "34px",
          transition: "padding-left 0.3s ease",
          maxWidth: "99vw",
          overflowX: "hidden",
          paddingTop: "20px",
        }}
      >
        <div className="app-page-frame">
          {pages[page]}
        </div>
      </div>
    </div>
  );
}
