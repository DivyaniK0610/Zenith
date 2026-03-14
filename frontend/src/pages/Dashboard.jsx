import React, { useEffect, useState, useCallback } from 'react';
import { useHabitStore } from '../store/habitStore';
import HabitCard from '../components/dashboard/HabitCard';
import AddHabitModal from '../components/dashboard/AddHabitModal';
import AchievementOverlay from '../components/gamification/AchievementOverlay';
import XPBar from '../components/gamification/XPBar';
import StatsRow from '../components/dashboard/StatsRow';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No habits yet</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-7 leading-relaxed">
        Start tracking your first habit to build streaks, earn XP, and level up.
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-blue-500 transition-colors"
      >
        <Plus size={16} />
        Create your first habit
      </motion.button>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-24 bg-surface rounded-2xl border border-slate-700/50 animate-pulse overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent animate-shimmer" />
    </div>
  );
}

function DateHeader() {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div>
      <motion.h1
        className="text-3xl font-black text-white tracking-tight mb-0.5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {dayName}
      </motion.h1>
      <motion.p
        className="text-slate-500 text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {dateStr}
      </motion.p>
    </div>
  );
}

export default function Dashboard() {
  const { habits, isLoading, error, loadHabits, userStats, completedToday } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [achievement, setAchievement] = useState(null);

  useEffect(() => {
    loadHabits(USER_ID);
  }, [loadHabits]);

  const handleAchievement = useCallback((data) => {
    setAchievement(data);
  }, []);

  const dismissAchievement = useCallback(() => {
    setAchievement(null);
  }, []);

  const completedCount = habits.filter((h) => completedToday.has(h.id)).length;

  return (
    <div className="w-full min-h-full space-y-6 pb-20">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <DateHeader />
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-semibold text-sm border border-primary/20 hover:border-primary transition-all"
        >
          <Plus size={16} />
          <span>Add Habit</span>
        </motion.button>
      </div>

      {/* XP Bar */}
      <XPBar
        xp={userStats?.xp || 0}
        level={userStats?.level || 1}
      />

      {/* Stats row */}
      <StatsRow habits={habits} userStats={userStats} />

      {/* Habits section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-300">
            Today's Habits
          </h2>
          {habits.length > 0 && !isLoading && (
            <motion.span
              key={completedCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs text-slate-500 font-medium tabular-nums"
            >
              {completedCount} / {habits.length} done
            </motion.span>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="p-5 bg-rose-500/8 border border-rose-500/20 text-rose-400 rounded-2xl text-sm">
            {error}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <motion.div
            layout
            className="grid gap-3 md:grid-cols-2"
          >
            <AnimatePresence mode="popLayout">
              {habits.map((habit) => (
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

      {/* Modals */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={USER_ID}
      />

      <AchievementOverlay
        achievement={achievement}
        onClose={dismissAchievement}
      />
    </div>
  );
}