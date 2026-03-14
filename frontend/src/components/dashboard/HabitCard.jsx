import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Target } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useZenithSounds } from '../../hooks/useSound';

function StreakBadge({ streak }) {
  if (!streak) return null;
  const isHot = streak >= 3;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border"
      style={{
        background: isHot ? 'rgba(224,122,48,0.15)' : 'rgba(58,52,46,0.5)',
        color: isHot ? '#e8935a' : 'var(--color-muted)',
        borderColor: isHot ? 'rgba(224,122,48,0.3)' : 'rgba(58,52,46,0.8)',
      }}>
      <Flame size={10} fill={isHot ? 'currentColor' : 'none'} />
      {streak}
    </span>
  );
}

function MetricBadge({ habit }) {
  if (habit.metric_type === 'boolean') return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
      style={{ background: 'rgba(201,129,58,0.1)', color: 'var(--color-primary)', borderColor: 'rgba(201,129,58,0.25)' }}>
      <Target size={10} />
      {habit.target_value} {habit.unit}
    </span>
  );
}

export default function HabitCard({ habit, onAchievement }) {
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
      if (response) {
        if (response.leveled_up) {
          onAchievement?.({ type: 'level_up', level: response.level, old_level: response.old_level,
            total_xp: response.total_xp, message: response.message });
        } else if (response.milestone_bonus > 0 || (response.current_streak > 0 && response.current_streak % 7 === 0)) {
          onAchievement?.({ type: 'streak', current_streak: response.current_streak,
            xp_gained: response.xp_gained, milestone_bonus: response.milestone_bonus || 0, message: response.message });
        }
        if (habit.user_id) await loadHabits(habit.user_id);
      }
    } catch (_) {
      // handled in store
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }} whileHover={!isCompleted ? { y: -1 } : {}}
      className="relative group">

      {/* Completion glow */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(82,168,115,0.18), rgba(52,138,85,0.06))' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      <motion.div
        animate={isAnimating ? { scale: [1, 0.97, 1.01, 1] } : {}}
        transition={{ duration: 0.35 }}
        className="relative rounded-2xl border overflow-hidden transition-colors"
        style={{
          background: isCompleted ? 'rgba(52,138,85,0.06)' : 'var(--color-surface)',
          borderColor: isCompleted ? 'rgba(82,168,115,0.3)' : 'rgba(58,52,46,0.8)',
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,129,58,0.12), transparent)' }} />

        {/* Sweep on complete */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(82,168,115,0.1), transparent)' }}
              initial={{ x: '-100%' }} animate={{ x: '200%' }}
              transition={{ duration: 0.55, ease: 'easeOut' }} />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 p-4">
          {/* Checkbox */}
          <motion.button whileTap={!isCompleted ? { scale: 0.82 } : {}}
            onClick={handleComplete} disabled={isCompleted}
            aria-label={isCompleted ? 'Completed' : 'Complete habit'}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
            style={{
              background: isCompleted ? 'rgba(82,168,115,0.18)' : 'var(--color-stone)',
              borderColor: isCompleted ? 'rgba(82,168,115,0.4)' : 'rgba(58,52,46,0.9)',
              cursor: isCompleted ? 'default' : 'pointer',
            }}>
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div key="check"
                  initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 14 }}>
                  <Check size={18} style={{ color: '#6fcf8a' }} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div key="empty" exit={{ scale: 0 }}
                  className="w-4 h-4 rounded-md border-2 transition-colors"
                  style={{ borderColor: 'var(--color-stone-light)' }} />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-sm font-semibold transition-all"
                style={{ color: isCompleted ? 'rgba(111,207,138,0.6)' : 'var(--color-warm-white)',
                  textDecoration: isCompleted ? 'line-through' : 'none' }}>
                {habit.title}
              </span>
              <StreakBadge streak={habit.current_streak || 0} />
              <MetricBadge habit={habit} />
            </div>
            {habit.description && (
              <p className="text-xs leading-snug line-clamp-1" style={{ color: 'var(--color-muted)' }}>
                {habit.description}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}