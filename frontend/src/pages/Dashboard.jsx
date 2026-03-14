import React, { useEffect, useState, useCallback } from 'react';
import { useHabitStore } from '../store/habitStore';
import HabitCard from '../components/dashboard/HabitCard';
import AddHabitModal from '../components/dashboard/AddHabitModal';
import AchievementOverlay from '../components/gamification/AchievementOverlay';
import XPBar from '../components/gamification/XPBar';
import StatsRow from '../components/dashboard/StatsRow';
import { Plus, Sparkles, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ── Remove this whole block when done testing ──────────
const TEST_ACHIEVEMENTS = [
  {
    label: '🏆 Level Up',
    data: { type: 'level_up', level: 5, old_level: 4, total_xp: 450, message: 'You reached Level 5!' },
  },
  {
    label: '🔥 7-Day Streak',
    data: { type: 'streak', current_streak: 7, xp_gained: 60, milestone_bonus: 50, message: 'Consistency is the only cheat code.' },
  },
  {
    label: '🔥 30-Day Streak',
    data: { type: 'streak', current_streak: 30, xp_gained: 210, milestone_bonus: 200, message: 'On fire. 30 days straight.' },
  },
];

function TestPanel({ onTrigger }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
        style={{
          background: 'rgba(139,92,246,0.1)',
          color: '#a78bfa',
          borderColor: 'rgba(139,92,246,0.25)',
        }}
      >
        <FlaskConical size={12} />
        Test Overlays
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 rounded-xl border shadow-xl z-30 overflow-hidden"
            style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)', minWidth: 160 }}
          >
            {TEST_ACHIEVEMENTS.map(({ label, data }) => (
              <button
                key={label}
                onClick={() => { onTrigger(data); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-warm-white)', borderBottom: '1px solid rgba(58,52,46,0.5)' }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ── End test block ─────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border"
        style={{ background: 'var(--color-stone)', borderColor: 'rgba(58,52,46,0.9)' }}>
        <Sparkles className="w-6 h-6" style={{ color: 'var(--color-muted)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--color-warm-white)' }}>No habits yet</h3>
      <p className="text-sm max-w-xs mb-6 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        Start tracking your first habit to build streaks, earn XP, and level up.
      </p>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #a86d35, #7a4e22)', boxShadow: '0 8px 20px rgba(168,109,53,0.2)' }}>
        <Plus size={15} />Create your first habit
      </motion.button>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-20 rounded-2xl border animate-pulse"
      style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.5)' }} />
  );
}

export default function Dashboard() {
  const { habits, isLoading, error, loadHabits, userStats, completedToday } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [achievement, setAchievement] = useState(null);

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  const handleAchievement = useCallback((data) => setAchievement(data), []);
  const dismissAchievement = useCallback(() => setAchievement(null), []);

  const completedCount = habits.filter(h => completedToday.has(h.id)).length;
  const today = new Date();

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <motion.h1 className="text-3xl font-black tracking-tight leading-none mb-1"
            style={{ color: 'var(--color-warm-white)' }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </motion.h1>
          <motion.p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </motion.p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ── Remove <TestPanel> when done testing ── */}
          <TestPanel onTrigger={handleAchievement} />

          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all"
            style={{
              background: 'rgba(168,109,53,0.1)',
              color: 'var(--color-primary)',
              borderColor: 'rgba(168,109,53,0.25)',
            }}>
            <Plus size={15} /><span>Add Habit</span>
          </motion.button>
        </div>
      </div>

      <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} />
      <StatsRow habits={habits} userStats={userStats} />

      {/* Habits section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Today's Habits
          </h2>
          {habits.length > 0 && !isLoading && (
            <motion.span key={completedCount} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-muted)' }}>
              {completedCount} / {habits.length} done
            </motion.span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : error ? (
          <div className="p-4 rounded-2xl border text-sm"
            style={{ background: 'rgba(220,60,60,0.06)', borderColor: 'rgba(220,60,60,0.2)', color: '#f87171' }}>
            {error}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} onAchievement={handleAchievement} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={USER_ID} />
      <AchievementOverlay achievement={achievement} onClose={dismissAchievement} />
    </div>
  );
}