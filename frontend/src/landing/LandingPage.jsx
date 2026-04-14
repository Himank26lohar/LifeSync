import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import LoadingScreen from "./components/LoadingScreen";
const features = [
  {
    icon: "🎯",
    title: "Smart Task Manager",
    description:
      "Prioritize, tag, and group tasks by date while visual completion stats keep daily planning clear.",
    tag: "Focus-linked",
    tone: "blue",
  },
  {
    icon: "🔥",
    title: "Habit Streaks",
    description:
      "Track routines with streaks, weekly consistency, monthly progress, and simple completion history.",
    tag: "Streak tracking",
    tone: "orange",
  },
  {
    icon: "🌿",
    title: "Wellness Logging",
    description:
      "Capture mood, sleep, energy, and stress, then review trends and emotional patterns over time.",
    tag: "Mood & sleep",
    tone: "green",
  },
  {
    icon: "⏱",
    title: "Focus Timer",
    description:
      "Run Pomodoro or deep-work sessions, connect them to tasks, and see daily, weekly, and monthly focus data.",
    tag: "Deep work",
    tone: "blue",
  },
  {
    icon: "📓",
    title: "Smart Journal",
    description:
      "Write entries with prompts, voice notes, media attachments, favorites, and streak tracking built in.",
    tag: "AI prompts",
    tone: "purple",
  },
  {
    icon: "✦",
    title: "AI Life Insights",
    description:
      "Generate summaries, scores, recommendations, next-week plans, and journal analysis from your real app data.",
    tag: "Powered by AI",
    tone: "mixed",
  },
];

const steps = [
  {
    title: "Log your day",
    description:
      "Capture tasks, habits, mood, focus sessions, and journal entries in seconds from one connected system.",
  },
  {
    title: "AI finds your patterns",
    description:
      "The app analyzes relationships across habits, wellness, journal entries, focus sessions, and tasks.",
  },
  {
    title: "Grow intentionally",
    description:
      "Use the weekly summaries, scores, and recommendations to make small changes that compound over time.",
  },
];

const testimonials = [
  {
    quote:
      "The AI insights genuinely surprised me. It noticed that my mood was consistently lower on days I skipped journaling.",
    name: "Arjun Mehta",
    role: "Product Designer, Mumbai",
    initials: "A",
    tone: "blue",
  },
  {
    quote:
      "Finally an app that does not feel like work. The dashboard makes me want to check my habits every morning.",
    name: "Sofia Reyes",
    role: "Grad Student, Barcelona",
    initials: "S",
    tone: "green",
  },
  {
    quote:
      "Three months in, my meditation streak is stable and my focus hours are way more consistent than before.",
    name: "Marcus Lee",
    role: "Founder, Singapore",
    initials: "M",
    tone: "orange",
  },
];

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

function HabitModule() {
  return (
    <div className="ls-module ls-module--habit">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--orange">🔥</div>
        <span>Habit Streaks</span>
      </div>

      <div className="rings-row">
        {[
          { label: "Exercise", score: "85%", offset: 15, color: "var(--ls-accent4)" },
          { label: "Meditate", score: "70%", offset: 30, color: "var(--ls-accent3)" },
          { label: "Read", score: "95%", offset: 5, color: "var(--ls-accent)" },
        ].map((ring) => (
          <div className="ring-wrap" key={ring.label}>
            <svg className="ring-svg" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={ring.color}
                strokeWidth="4"
                strokeDasharray="100.5"
                strokeDashoffset={ring.offset}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
              <text x="20" y="24" textAnchor="middle" fill="white" fontSize="9" fontFamily="Poppins, Inter, sans-serif" fontWeight="700">
                {ring.score}
              </text>
            </svg>
            <span className="ring-label">{ring.label}</span>
          </div>
        ))}
      </div>

      <div className="habit-streak">
        <span className="streak-fire">🔥</span>
        <span className="streak-num">21</span>
        <span className="streak-lbl">day streak</span>
      </div>
    </div>
  );
}

function FocusModule() {
  return (
    <div className="ls-module ls-module--focus">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--blue">⏱</div>
        <span>Focus</span>
      </div>

      <div className="timer-display">
        <div className="timer-ring-wrap">
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="var(--ls-accent)"
              strokeWidth="5"
              strokeDasharray="201"
              strokeDashoffset="50"
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="timer-label">24:15</div>
        </div>
        <div className="timer-sub">DEEP FOCUS · SESSION 2</div>
        <div className="timer-session">
          <div className="session-dot done" />
          <div className="session-dot done" />
          <div className="session-dot" />
          <div className="session-dot" />
        </div>
      </div>
    </div>
  );
}

function WellnessModule() {
  const bars = [80, 55, 90, 65, 75];
  const labels = ["M", "T", "W", "T", "F"];
  const colors = [
    "linear-gradient(180deg,var(--ls-accent3),rgba(255, 255, 255, 1))",
    "linear-gradient(180deg,var(--ls-accent3),rgba(95,255,200,0.3))",
    "linear-gradient(180deg,var(--ls-accent3),rgba(95,255,200,0.3))",
    "linear-gradient(180deg,var(--ls-accent),rgba(108,143,255,0.3))",
    "linear-gradient(180deg,var(--ls-accent2),rgba(167,139,255,0.3))",
  ];

  return (
    <div className="ls-module ls-module--mood">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--green">🌿</div>
        <span>Wellness</span>
      </div>
      <div className="mood-row">
        {bars.map((height, index) => (
          <div className="mood-bar-wrap" key={`${labels[index]}-${height}`}>
            <div className="mood-bar-bg">
              <div className="mood-bar-fill" style={{ height: `${height}%`, background: colors[index] }} />
            </div>
            <span className="mood-day">{labels[index]}</span>
          </div>
        ))}
      </div>
      <div className="mood-current-row">
        <span className="mood-emoji">😊</span>
        <span className="mood-current">Feeling great today</span>
      </div>
    </div>
  );
}

function TaskModule() {
  const tasks = [
    { label: "Morning review", done: true },
    { label: "Design sprint", done: true },
    { label: "Team standup", done: false },
    { label: "Evening journal", done: false },
  ];

  return (
    <div className="ls-module ls-module--task">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--purple">✅</div>
        <span>Today&apos;s Tasks</span>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <div className="task-item" key={task.label}>
            <div className={`task-check ${task.done ? "done" : ""}`} />
            <span className={`task-text ${task.done ? "done" : ""}`}>{task.label}</span>
          </div>
        ))}
      </div>
      <div className="task-progress-row">
        <div className="task-progress-bar">
          <div className="task-progress-fill" style={{ width: "50%" }} />
        </div>
        <span className="task-pct">50%</span>
      </div>
    </div>
  );
}

function AiModule() {
  return (
    <div className="ls-module ls-module--ai">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--mixed">✦</div>
        <span>AI Insight</span>
      </div>
      <div className="ai-score-row">
        {[
          { value: "87", label: "Wellbeing", color: "var(--ls-accent3)" },
          { value: "92", label: "Focus", color: "var(--ls-accent)" },
          { value: "78", label: "Balance", color: "var(--ls-accent2)" },
        ].map((item) => (
          <div className="ai-score-item" key={item.label}>
            <div className="ai-score-num" style={{ color: item.color }}>{item.value}</div>
            <div className="ai-score-lbl">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="ai-insight-text">
        Your <strong>focus quality improved 18%</strong> this week. Try shifting deep work to mornings.
      </div>
    </div>
  );
}

function JournalModule() {
  return (
    <div className="ls-module ls-module--journal">
      <div className="ls-module__header">
        <div className="ls-module__icon ls-module__icon--journal">📓</div>
        <span>Journal</span>
      </div>
      <div className="journal-prompt">&quot;What made today meaningful?&quot;</div>
      <div className="journal-footer">
        <div className="journal-streak">
          <div className="journal-dot" />
          14-day streak
        </div>
        <span className="journal-count">3 entries</span>
      </div>
    </div>
  );
}

function HeroScene() {
  return (
    <div className="hero-right">
      <div className="float-scene">
        <HabitModule />
        <FocusModule />
        <WellnessModule />
        <TaskModule />
        <AiModule />
        <JournalModule />
      </div>
    </div>
  );
}

export default function LandingPage({ session, onAuthSuccess }) {
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1300);
    return () => window.clearTimeout(timer);
  }, []);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (session?.token) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <>
      <AnimatePresence>{loading ? <LoadingScreen key="loader" /> : null}</AnimatePresence>

      <div className="ls-page">
        <div className="ls-bg-canvas" aria-hidden="true">
          <div className="ls-bg-orb ls-bg-orb-1" />
          <div className="ls-bg-orb ls-bg-orb-2" />
          <div className="ls-bg-orb ls-bg-orb-3" />
          <div className="ls-bg-grid" />
        </div>

        <div className="ls-wrapper">
          <nav className="ls-nav">
            <div className="ls-nav-logo">
              <div className="ls-nav-logo-dot" />
              LifeSync AI
            </div>
            <ul className="ls-nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#testimonials">Stories</a></li>
            </ul>
            <div className="ls-nav-actions">
              <button className="ls-btn-nav" onClick={() => openAuth("login")}>Sign In</button>
              <button className="ls-btn-nav ls-btn-nav--ghost" onClick={() => openAuth("signup")}>Sign Up</button>
            </div>
          </nav>

          <section className="ls-hero">
            <div className="hero-left">
              <motion.div className="hero-badge" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
                AI-powered lifestyle intelligence
              </motion.div>
              <motion.h1 className="hero-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7 }}>
                Your life,
                <br />
                <span>perfectly in sync.</span>
              </motion.h1>
              <motion.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.7 }}>
                Habits, tasks, wellness, focus, and journal unified by AI that learns your patterns
                and helps you grow every single day.
              </motion.p>
              <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.7 }}>
                <button className="ls-btn-primary" onClick={() => openAuth("signup")}>Create account</button>
                <button className="ls-btn-ghost" onClick={() => openAuth("login")}>Sign in</button>
              </motion.div>
              <motion.div className="hero-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.7 }}>
                <div className="stat-item">
                  <span className="stat-num">12k+</span>
                  <span className="stat-lbl">Active users</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">4.9★</span>
                  <span className="stat-lbl">Average rating</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">94%</span>
                  <span className="stat-lbl">Habit retention</span>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.75 }}>
              <HeroScene />
            </motion.div>
          </section>

          <section id="features" className="ls-section">
            <motion.div {...reveal}>
              <div className="section-label">What&apos;s inside</div>
              <h2 className="section-title">
                Everything your life
                <br />
                needs, together.
              </h2>
              <p className="section-sub">
                Six powerful modules work in concert so your progress in one area strengthens the rest.
              </p>
            </motion.div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.article
                  className="feature-card"
                  key={feature.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: index * 0.08 }}
                >
                  <div className={`feature-icon-wrap feature-icon-wrap--${feature.tone}`}>{feature.icon}</div>
                  <div className="feature-name">{feature.title}</div>
                  <div className="feature-desc">{feature.description}</div>
                  <span className={`feature-tag feature-tag--${feature.tone}`}>{feature.tag}</span>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="how" className="ls-section ls-section--tight">
            <div className="how-wrap">
              <div>
                <motion.div {...reveal}>
                  <div className="section-label">The process</div>
                  <h2 className="section-title">
                    Three steps to a
                    <br />
                    synced life.
                  </h2>
                </motion.div>

                <div className="steps">
                  {steps.map((step, index) => (
                    <motion.div
                      className="step"
                      key={step.title}
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.65, delay: index * 0.1 }}
                    >
                      <div className="step-num-col">
                        <div className="step-num">{`0${index + 1}`}</div>
                        {index < steps.length - 1 ? <div className="step-line" /> : null}
                      </div>
                      <div className="step-body">
                        <div className="step-title">{step.title}</div>
                        <div className="step-desc">{step.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div className="how-visual" {...reveal}>
                <div className="how-visual-glow" />
                <div className="dashboard-kicker">YOUR DASHBOARD · TODAY</div>
                <div className="dashboard-preview">
                  <div className="dp-row">
                    <div className="dp-card">
                      <div className="dp-card-label">TASKS DONE</div>
                      <div className="dp-card-val dp-card-val--green">8/12</div>
                    </div>
                    <div className="dp-card">
                      <div className="dp-card-label">FOCUS HRS</div>
                      <div className="dp-card-val dp-card-val--blue">3.5h</div>
                    </div>
                    <div className="dp-card">
                      <div className="dp-card-label">MOOD</div>
                      <div className="dp-card-val">😊 8</div>
                    </div>
                  </div>

                  <div className="dp-chart-card">
                    <div className="dp-card-label">THIS WEEK · FOCUS HOURS</div>
                    <div className="dp-bars">
                      {[55, 80, 45, 90, 70, 60, 40].map((height, index) => (
                        <div className="dp-bar" key={`${height}-${index}`} style={{ height: `${height}%`, opacity: index === 6 ? 0.35 : 0.7 }} />
                      ))}
                    </div>
                  </div>

                  <div className="dp-radar-placeholder">
                    <svg className="radar-svg" viewBox="0 0 100 100" aria-hidden="true">
                      <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="rgba(108,143,255,0.06)" stroke="rgba(108,143,255,0.2)" strokeWidth="1" />
                      <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="rgba(108,143,255,0.04)" stroke="rgba(108,143,255,0.1)" strokeWidth="1" />
                      <polygon points="50,18 80,34 78,66 50,82 22,66 20,34" fill="rgba(167,139,255,0.1)" stroke="rgba(167,139,255,0.4)" strokeWidth="1.5" />
                      {[["50", "18"], ["80", "34"], ["78", "66"], ["50", "82"], ["22", "66"], ["20", "34"]].map(([x, y]) => (
                        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="var(--ls-accent2)" />
                      ))}
                      <text x="50" y="54" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8" fontFamily="Poppins, Inter, sans-serif">
                        Life Balance
                      </text>
                    </svg>
                  </div>

                  <div className="dp-ai-card">
                    <div className="dp-ai-label">✦ AI INSIGHT</div>
                    <div className="dp-ai-text">
                      Sleep consistency is up 22%. Keep the 10pm wind-down routine going.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section id="testimonials" className="ls-section testi-section">
            <motion.div {...reveal}>
              <div className="section-label section-label--centered">Real stories</div>
              <h2 className="section-title">
                People who live
                <br />
                in sync.
              </h2>
              <p className="section-sub section-sub--centered">
                Thousands of people use LifeSync AI to keep habits, focus, and wellbeing aligned.
              </p>
            </motion.div>

            <div className="testi-grid">
              {testimonials.map((item, index) => (
                <motion.article
                  className="testi-card"
                  key={item.name}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: index * 0.08 }}
                >
                  <div className="testi-stars">★★★★★</div>
                  <p className="testi-quote">&quot;{item.quote}&quot;</p>
                  <div className="testi-author">
                    <div className={`testi-avatar testi-avatar--${item.tone}`}>{item.initials}</div>
                    <div>
                      <div className="testi-name">{item.name}</div>
                      <div className="testi-role">{item.role}</div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <motion.div className="cta-strip" {...reveal}>
            <div className="cta-glow" />
            <div>
              <div className="cta-title">
                Ready to live
                <br />
                <span>fully in sync?</span>
              </div>
              <p className="cta-copy">No credit card. No commitment. Just clarity.</p>
            </div>
            <div className="cta-actions">
              <button className="ls-btn-primary" onClick={() => openAuth("signup")}>Create account</button>
              <span className="cta-note">Join 1200+ people already in sync</span>
            </div>
          </motion.div>

          <footer className="ls-footer">
            <div className="footer-logo">LifeSync AI</div>
            <div className="footer-copy">© 2026 LifeSync AI. Built for intentional living.</div>
            <div className="footer-links">
              <a href="/">Privacy</a>
              <a href="/">Terms</a>
              <a href="/">Contact</a>
            </div>
          </footer>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        onAuthSuccess={onAuthSuccess}
      />
    </>
  );
}
