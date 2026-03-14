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

// ── Test panel ─────────────────────────────────────────
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
        style={{
          background: 'rgba(139,92,246,0.08)',
          color: '#a78bfa',
          borderColor: 'rgba(139,92,246,0.2)',
          letterSpacing: '0.01em',
        }}
      >
        <FlaskConical size={11} />
        Test
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-30 overflow-hidden"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              minWidth: 152,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {TEST_ACHIEVEMENTS.map(({ label, data }, i) => (
              <button
                key={label}
                onClick={() => { onTrigger(data); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  color: 'var(--color-text-2)',
                  borderBottom: i < TEST_ACHIEVEMENTS.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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

function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--color-stone)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Sparkles size={18} style={{ color: 'var(--color-text-3)' }} />
      </div>
      <h3
        className="text-sm font-semibold mb-1.5"
        style={{ color: 'var(--color-text-1)', letterSpacing: '-0.01em' }}
      >
        No habits yet
      </h3>
      <p
        className="text-xs max-w-xs mb-6 leading-relaxed"
        style={{ color: 'var(--color-text-3)' }}
      >
        Start tracking your first habit to build streaks, earn XP, and level up.
      </p>
      <motion.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white btn-primary"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
          boxShadow: '0 4px 16px rgba(184,115,51,0.2)',
          border: '1px solid rgba(184,115,51,0.3)',
        }}
      >
        <Plus size={14} />
        Create your first habit
      </motion.button>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="h-16 rounded-2xl animate-pulse"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
    />
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
  const allDone = habits.length > 0 && completedCount === habits.length;

  return (
    <div className="space-y-4 pb-4 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <motion.h1
            className="text-display"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </motion.h1>
          <motion.p
            style={{ color: 'var(--color-text-3)', fontSize: '12px', marginTop: '2px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
          >
            {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </motion.p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <TestPanel onTrigger={handleAchievement} />

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-sm"
            style={{
              background: 'var(--color-primary-glow)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary-border)',
              letterSpacing: '-0.01em',
            }}
          >
            <Plus size={13} />
            Add Habit
          </motion.button>
        </div>
      </div>

      <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} />
      <StatsRow habits={habits} userStats={userStats} />

      {/* Habits section */}
      <div>
        <div className="flex items-center justify-between mb-3 mt-1">
          <span className="text-subheading">Today's Habits</span>

          {habits.length > 0 && !isLoading && (
            <motion.div
              key={completedCount}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5"
            >
              {allDone && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(82,168,115,0.12)',
                    color: '#6fcf8a',
                    border: '1px solid rgba(82,168,115,0.2)',
                  }}
                >
                  All done ✓
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: allDone ? '#6fcf8a' : 'var(--color-text-3)',
                }}
              >
                {completedCount}/{habits.length}
              </span>
            </motion.div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div
            className="p-4 rounded-2xl text-xs"
            style={{
              background: 'rgba(220,60,60,0.06)',
              border: '1px solid rgba(220,60,60,0.15)',
              color: '#f87171',
            }}
          >
            {error}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {habits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onAchievement={handleAchievement}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={USER_ID}
      />
      <AchievementOverlay achievement={achievement} onClose={dismissAchievement} />
    </div>
  );
}