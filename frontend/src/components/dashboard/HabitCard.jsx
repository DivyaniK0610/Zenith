import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Target } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useZenithSounds } from '../../hooks/useSound';

function StreakBadge({ streak }) {
  if (streak === 0) return null;
  const isHot = streak >= 3;
  return (
    <motion.div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
        isHot
          ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
          : 'bg-slate-700/50 text-slate-400 border-slate-700'
      }`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <Flame
        size={11}
        className={isHot ? 'text-orange-400' : 'text-slate-500'}
        fill={isHot ? 'currentColor' : 'none'}
      />
      <span>{streak}</span>
    </motion.div>
  );
}

function MetricBadge({ habit }) {
  if (habit.metric_type === 'boolean') return null;
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
      <Target size={10} />
      <span>{habit.target_value} {habit.unit}</span>
    </div>
  );
}

export default function HabitCard({ habit, onAchievement }) {
  // Read completion from the store so Dashboard counter stays in sync
  const { logHabit, loadHabits, completedToday } = useHabitStore();
  const isCompleted = completedToday.has(habit.id);
  const [isAnimating, setIsAnimating] = useState(false);
  const { playSuccess } = useZenithSounds();

  const handleComplete = async () => {
    if (isCompleted || isAnimating) return;

    setIsAnimating(true);
    playSuccess();

    try {
      const response = await logHabit(habit.id, true, null);

      // Check for achievements (response is null on 409, skip quietly)
      if (response) {
        if (response.leveled_up) {
          onAchievement?.({
            type: 'level_up',
            level: response.level,
            old_level: response.old_level,
            total_xp: response.total_xp,
            message: response.message,
          });
        } else if (response.milestone_bonus > 0 || (response.current_streak > 0 && response.current_streak % 7 === 0)) {
          onAchievement?.({
            type: 'streak',
            current_streak: response.current_streak,
            xp_gained: response.xp_gained,
            milestone_bonus: response.milestone_bonus || 0,
            message: response.message,
          });
        }

        if (habit.user_id) {
          await loadHabits(habit.user_id);
        }
      }
    } catch (error) {
      // logHabit already handles 409 silently and reverts on real errors
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!isCompleted ? { y: -2 } : {}}
      className="relative group"
    >
      {/* Outer glow on completion */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.08))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        animate={isAnimating ? { scale: [1, 0.97, 1.01, 1] } : {}}
        transition={{ duration: 0.4, times: [0, 0.3, 0.7, 1] }}
        className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
          isCompleted
            ? 'bg-emerald-500/8 border-emerald-500/30'
            : 'bg-surface border-slate-700/80 hover:border-slate-600'
        }`}
      >
        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Shimmer sweep on complete */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3
                className={`text-base font-semibold leading-snug transition-all duration-300 ${
                  isCompleted ? 'text-emerald-400/70 line-through' : 'text-white'
                }`}
              >
                {habit.title}
              </h3>
              <StreakBadge streak={habit.current_streak || 0} />
              <MetricBadge habit={habit} />
            </div>

            {habit.description && (
              <p className="text-sm text-slate-500 leading-snug line-clamp-2">
                {habit.description}
              </p>
            )}
          </div>

          <motion.button
            whileTap={!isCompleted ? { scale: 0.85 } : {}}
            onClick={handleComplete}
            disabled={isCompleted}
            aria-label={isCompleted ? 'Completed' : 'Mark as complete'}
            className={`relative flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500/20 border border-emerald-500/40 cursor-default'
                : 'bg-slate-800 border border-slate-700 hover:border-primary/50 hover:bg-primary/10 group-hover:border-primary/40'
            }`}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                >
                  <Check className="w-5 h-5 text-emerald-400" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="w-4 h-4 rounded-md border-2 border-slate-600 group-hover:border-primary/60 transition-colors"
                  exit={{ scale: 0 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {habit.metric_type === 'numeric' && !isCompleted && (
          <div className="mt-3 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}