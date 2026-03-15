import React, { useEffect, useState, useCallback } from 'react';
import { useHabitStore } from '../store/habitStore';
import HabitCard from '../components/dashboard/HabitCard';
import AddHabitModal from '../components/dashboard/AddHabitModal';
import AchievementOverlay from '../components/gamification/AchievementOverlay';
import XPBar from '../components/gamification/XPBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, ChevronDown, Flame, CheckCircle2, Trophy, Zap, Archive, Target } from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'sonner';
import { useZenithSounds } from '../hooks/useSound';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

const TEST_ACHIEVEMENTS = [
  { label: '⚡ Level Up overlay', data: { type: 'level_up', level: 5, old_level: 4, total_xp: 450, message: 'You reached Level 5!' } },
  { label: '🔥 7-day streak reward', data: { type: 'streak', current_streak: 7, xp_gained: 60, milestone_bonus: 50, message: 'Consistency is the only cheat code.' } },
  { label: '🔥 30-day streak reward', data: { type: 'streak', current_streak: 30, xp_gained: 210, milestone_bonus: 200, message: 'On fire. 30 days straight.' } },
];

function TestPanel({ onTrigger }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{ background: open ? 'rgba(184,115,51,0.15)' : 'rgba(184,115,51,0.08)', color: 'var(--color-primary)', borderColor: open ? 'rgba(184,115,51,0.4)' : 'var(--color-primary-border)' }}
      >
        <Sparkles size={11} />
        Demo
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={10} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }} transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden z-30"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-primary-border)', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)' }}>Feature demos</span>
              </div>
              {TEST_ACHIEVEMENTS.map(({ label, data }, i) => (
                <motion.button key={label} onClick={() => { onTrigger(data); setOpen(false); }}
                  whileHover={{ x: 3 }} transition={{ duration: 0.1 }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5"
                  style={{ color: 'var(--color-text-2)', fontSize: '12px', borderBottom: i < TEST_ACHIEVEMENTS.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '13px' }}>{label.split(' ')[0]}</span>
                  <span>{label.split(' ').slice(1).join(' ')}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
        <Sparkles size={18} style={{ color: 'var(--color-text-3)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-1)', letterSpacing: '-0.01em' }}>No habits yet</h3>
      <p className="text-xs max-w-xs mb-6 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
        Start tracking your first habit to build streaks, earn XP, and level up.
      </p>
      <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))', boxShadow: '0 4px 16px rgba(184,115,51,0.2)', border: '1px solid rgba(184,115,51,0.3)' }}>
        <Plus size={14} />
        Create your first habit
      </motion.button>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />;
}

// ── Right panel stat card ─────────────────────────────────────────────
function StatBlock({ icon: Icon, label, value, accent, accentBg, accentBorder, iconFill }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'var(--color-stone)', border: `1px solid ${accentBorder}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
        <Icon size={14} style={{ color: accent }} fill={iconFill ? accent : 'none'} strokeWidth={iconFill ? 0 : 2} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '3px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Right panel — sticky sidebar on desktop ───────────────────────────
function RightPanel({ habits, userStats, completedToday, today, allDone, completedCount }) {
  const activeCount   = habits.filter(h => h.status !== 'paused').length;
  const completionPct = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Today's progress ring */}
      <div className="relative rounded-2xl overflow-hidden p-5"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.2), transparent)' }} />

        <div className="flex items-center justify-between mb-4">
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
            Today's Progress
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: allDone ? '#6fcf8a' : 'var(--color-primary)' }}>
            {completedCount}/{habits.filter(h => h.status !== 'paused').length}
          </span>
        </div>

        {/* Circular progress */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-stone)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="40" fill="none"
                stroke={allDone ? '#6fcf8a' : 'var(--color-primary)'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - completionPct / 100) }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                transform="rotate(-90 50 50)"
                style={{ filter: allDone ? 'drop-shadow(0 0 6px rgba(111,207,138,0.4))' : 'drop-shadow(0 0 4px rgba(184,115,51,0.3))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: allDone ? '#6fcf8a' : 'var(--color-warm-white)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {completionPct}%
              </span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-3)', fontWeight: 500, marginTop: '2px' }}>
                {allDone ? 'perfect' : 'done'}
              </span>
            </div>
          </div>
        </div>

        {allDone && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 py-2 rounded-xl"
            style={{ background: 'rgba(82,168,115,0.08)', border: '1px solid rgba(82,168,115,0.15)' }}>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>🌿</motion.span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6fcf8a' }}>Perfect day</span>
          </motion.div>
        )}
      </div>

      {/* XP bar */}
      <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBlock icon={Flame} label="Streak" value={`${userStats?.current_streak || 0}d`}
          accent="#e07830" accentBg="rgba(224,120,48,0.1)" accentBorder="rgba(224,120,48,0.18)" iconFill />
        <StatBlock icon={CheckCircle2} label="Habits" value={habits.length}
          accent="#52a873" accentBg="rgba(82,168,115,0.1)" accentBorder="rgba(82,168,115,0.18)" iconFill={false} />
        <StatBlock icon={Trophy} label="Best" value={`${userStats?.longest_streak || 0}d`}
          accent="#c9a43a" accentBg="rgba(201,164,58,0.1)" accentBorder="rgba(201,164,58,0.18)" iconFill={false} />
        <StatBlock icon={Zap} label="Level" value={userStats?.level || 1}
          accent="#b87333" accentBg="rgba(184,115,51,0.1)" accentBorder="rgba(184,115,51,0.18)" iconFill />
      </div>

      {/* Quick tip */}
      <div className="rounded-2xl p-4"
        style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Target size={11} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            Daily tip
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          {completedCount === 0
            ? "Start with your easiest habit to build momentum."
            : completedCount < habits.length / 2
            ? "You're building momentum. Keep the chain going."
            : allDone
            ? "Every habit done. You've earned your streak today."
            : "Past halfway. Don't break the chain now."}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { habits, isLoading, error, loadHabits, userStats, completedToday, fetchArchivedHabits } = useHabitStore();
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [achievement, setAchievement]         = useState(null);
  const [showArchived, setShowArchived]       = useState(false);
  const [archivedHabits, setArchivedHabits]   = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const activeHabits    = habits.filter(h => h.status !== 'paused');
  const pausedHabits    = habits.filter(h => h.status === 'paused');
  const pendingHabits   = activeHabits.filter(h => !completedToday.has(h.id));
  const completedHabits = activeHabits.filter(h => completedToday.has(h.id));
  const completedCount  = completedHabits.length;
  const today           = new Date();
  const allDone         = activeHabits.length > 0 && completedCount === activeHabits.length;
  const { playModalOpen } = useZenithSounds();

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAchievement  = useCallback((data) => setAchievement(data), []);
  const dismissAchievement = useCallback(() => setAchievement(null), []);

  const greeting = (() => {
    const h = today.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <motion.h1 className="text-display"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </motion.h1>
          <motion.p style={{ color: 'var(--color-text-3)', fontSize: '12px', marginTop: '2px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
            {greeting} · {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </motion.p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <TestPanel onTrigger={handleAchievement} />
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => { playModalOpen(); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-sm"
            style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)', letterSpacing: '-0.01em' }}
          >
            <Plus size={13} />
            Add Habit
            <span style={{ fontSize: '9px', opacity: 0.5, background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)', marginLeft: '2px' }}>N</span>
          </motion.button>
        </div>
      </div>

      {/* ── Two-column layout (desktop) / single (mobile) ── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT: Habits list ─────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Mobile-only XP + stats */}
          <div className="md:hidden space-y-3">
            <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} />
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Flame,       label: 'Streak', value: `${userStats?.current_streak || 0}d`, accent: '#e07830', accentBg: 'rgba(224,120,48,0.1)', accentBorder: 'rgba(224,120,48,0.18)', iconFill: true },
                { icon: CheckCircle2,label: 'Habits', value: habits.length,                        accent: '#52a873', accentBg: 'rgba(82,168,115,0.1)', accentBorder: 'rgba(82,168,115,0.18)', iconFill: false },
                { icon: Trophy,      label: 'Best',   value: `${userStats?.longest_streak || 0}d`, accent: '#c9a43a', accentBg: 'rgba(201,164,58,0.1)', accentBorder: 'rgba(201,164,58,0.18)', iconFill: false },
                { icon: Zap,         label: 'Level',  value: userStats?.level || 1,                accent: '#b87333', accentBg: 'rgba(184,115,51,0.1)', accentBorder: 'rgba(184,115,51,0.18)', iconFill: true },
              ].map(({ icon: Icon, label, value, accent, accentBg, accentBorder, iconFill }) => (
                <div key={label} className="flex-1 relative rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-surface-2)', border: `1px solid ${accentBorder}` }}>
                  <div className="flex items-center gap-2 px-2.5 py-2.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: accentBg }}>
                      <Icon size={10} style={{ color: accent }} fill={iconFill ? accent : 'none'} strokeWidth={iconFill ? 0 : 2} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '2px' }}>{label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between">
            <span className="text-subheading">Today's Habits</span>
            {habits.length > 0 && !isLoading && (
              <motion.div key={completedCount} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5">
                {allDone && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, rgba(82,168,115,0.15), rgba(52,138,85,0.08))', color: '#6fcf8a', border: '1px solid rgba(82,168,115,0.25)', boxShadow: '0 0 12px rgba(82,168,115,0.1)' }}>
                    <span style={{ fontSize: '10px' }}>✦</span>
                    Perfect day
                  </motion.span>
                )}
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: allDone ? '#6fcf8a' : 'var(--color-text-3)' }}>
                  {completedCount}/{activeHabits.length}
                </span>
              </motion.div>
            )}
          </div>

          {/* Habit list */}
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : error ? (
            <div className="p-4 rounded-2xl text-xs"
              style={{ background: 'rgba(220,60,60,0.06)', border: '1px solid rgba(220,60,60,0.15)', color: '#f87171' }}>
              {error}
            </div>
          ) : habits.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence mode="popLayout">
                {pendingHabits.map((habit, i) => (
                  <motion.div key={habit.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                    <HabitCard habit={habit} onAchievement={handleAchievement} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Paused habits — always at bottom of pending */}
              {pausedHabits.length > 0 && (
                <div className="space-y-2">
                  {pausedHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} onAchievement={handleAchievement} />
                  ))}
                </div>
              )}

              {completedHabits.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0 10px' }} />
                  <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '8px' }}>
                    Completed
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {completedHabits.map(habit => (
                        <HabitCard key={habit.id} habit={habit} onAchievement={handleAchievement} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* All done celebration */}
              <AnimatePresence>
                {allDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-2xl overflow-hidden mt-2 p-5 text-center"
                    style={{ background: 'linear-gradient(135deg, rgba(82,168,115,0.07), rgba(52,138,85,0.03))', border: '1px solid rgba(82,168,115,0.15)' }}>
                    <div className="absolute inset-x-0 top-0 h-px"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(82,168,115,0.3), transparent)' }} />
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ fontSize: '28px', marginBottom: '8px' }}>🌿</motion.div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#6fcf8a', letterSpacing: '-0.01em', marginBottom: '4px' }}>
                      All habits complete
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>
                      You've earned every XP today. Come back tomorrow.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Archived habits */}
          <div className="mt-2">
            <button
              onClick={async () => {
                if (!showArchived) {
                  setLoadingArchived(true);
                  const data = await fetchArchivedHabits(USER_ID);
                  setArchivedHabits(data);
                  setLoadingArchived(false);
                }
                setShowArchived(o => !o);
              }}
              className="flex items-center gap-2 w-full py-2"
              style={{ color: 'var(--color-text-3)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Archive size={11} />
              Archived habits
              <motion.span animate={{ rotate: showArchived ? 90 : 0 }} transition={{ duration: 0.15 }}
                style={{ marginLeft: 'auto', display: 'flex' }}>
                <ChevronDown size={11} />
              </motion.span>
            </button>
            <AnimatePresence>
              {showArchived && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                  {loadingArchived ? (
                    <div className="py-4 text-center" style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>Loading...</div>
                  ) : archivedHabits.length === 0 ? (
                    <div className="py-4 text-center" style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>No archived habits</div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {archivedHabits.map(habit => (
                        <div key={habit.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                          style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)', opacity: 0.6 }}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{habit.title}</span>
                          <button
                            onClick={async () => {
                              await apiClient.patch(`/api/v1/habits/${habit.id}`, { status: 'active' });
                              setArchivedHabits(prev => prev.filter(h => h.id !== habit.id));
                              loadHabits(USER_ID);
                              toast('Habit restored', { duration: 2000 });
                            }}
                            style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: Stats panel (desktop only) ────────────── */}
        <div className="hidden md:block flex-shrink-0 sticky top-6" style={{ width: '260px' }}>
          <RightPanel
            habits={habits}
            userStats={userStats}
            completedToday={completedToday}
            today={today}
            allDone={allDone}
            completedCount={completedCount}
          />
        </div>
      </div>

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={USER_ID} />
      <AchievementOverlay achievement={achievement} onClose={dismissAchievement} />
    </motion.div>
  );
}