import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Target, Clock } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useZenithSounds } from '../../hooks/useSound';

function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null;
  const isLegendary = streak >= 30;
  const isHot       = streak >= 7;
  const isMild      = streak >= 3;
  const flameSize   = isLegendary ? 12 : isHot ? 11 : 10;
  const glowColor   = isLegendary ? '#ff6020' : isHot ? '#e08040' : 'var(--color-primary)';

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isLegendary
          ? 'rgba(255,96,32,0.15)'
          : isHot
          ? 'rgba(224,120,48,0.14)'
          : isMild
          ? 'rgba(184,115,51,0.1)'
          : 'rgba(58,50,40,0.6)',
        color: glowColor,
        border: `1px solid ${isLegendary ? 'rgba(255,96,32,0.3)' : isHot ? 'rgba(224,120,48,0.25)' : 'rgba(184,115,51,0.15)'}`,
        letterSpacing: '0.01em',
      }}
    >
      <Flame
        size={flameSize}
        fill={isHot ? 'currentColor' : 'none'}
        strokeWidth={isHot ? 0 : 2}
        style={{
          filter: isLegendary
            ? 'drop-shadow(0 0 4px rgba(255,96,32,0.8))'
            : isHot
            ? 'drop-shadow(0 0 2px rgba(224,120,48,0.6))'
            : 'none',
        }}
      />
      {streak}d
    </span>
  );
}

function MetricBadge({ habit }) {
  if (habit.metric_type !== 'numeric') return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(184,115,51,0.08)',
        color: 'var(--color-primary)',
        border: '1px solid rgba(184,115,51,0.15)',
      }}
    >
      <Clock size={9} />
      {habit.target_value} {habit.unit}
    </span>
  );
}

export default function HabitCard({ habit, onAchievement }) {
  const { logHabit, loadHabits, completedToday } = useHabitStore();
  const isCompleted = completedToday.has(habit.id);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const { playSuccess } = useZenithSounds();

  const handleComplete = async () => {
    if (isCompleted || isAnimating) return;
    setIsAnimating(true);
    setJustCompleted(true);
    playSuccess();

    try {
      const response = await logHabit(habit.id, true, null);
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
        if (habit.user_id) await loadHabits(habit.user_id);
      }
    } catch (_) {
      setJustCompleted(false);
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={!isCompleted ? { y: -1 } : {}}
      transition={{ duration: 0.22 }}
      className="relative group"
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 0.985, 1.005, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: isCompleted
            ? 'rgba(18,24,18,0.9)'
            : 'var(--color-surface-2)',
          border: `1px solid ${isCompleted ? 'rgba(82,168,115,0.18)' : 'var(--color-border)'}`,
          transition: 'border-color 0.3s, background 0.3s',
        }}
      >
        {/* Top shimmer line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: isCompleted
              ? 'linear-gradient(90deg, transparent, rgba(82,168,115,0.12), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
          }}
        />

        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full pointer-events-none"
          style={{
            background: isCompleted
              ? 'linear-gradient(to bottom, rgba(82,168,115,0.6), rgba(52,138,85,0.2))'
              : 'linear-gradient(to bottom, rgba(184,115,51,0.5), rgba(184,115,51,0.1))',
            opacity: isCompleted ? 1 : 0.6,
            transition: 'opacity 0.3s, background 0.3s',
          }}
        />

        {/* Sweep animation on complete */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(82,168,115,0.07), transparent)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Checkbox */}
          <motion.button
            whileTap={!isCompleted ? { scale: 0.78 } : {}}
            onClick={handleComplete}
            disabled={isCompleted}
            aria-label={isCompleted ? 'Completed' : 'Complete habit'}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: isCompleted
                ? 'rgba(52,138,85,0.15)'
                : 'var(--color-stone)',
              border: `1px solid ${isCompleted ? 'rgba(82,168,115,0.3)' : 'var(--color-stone-light)'}`,
              cursor: isCompleted ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                >
                  <Check size={15} color="#6fcf8a" strokeWidth={2.8} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-3.5 h-3.5 rounded-md border-2 habit-checkbox-idle"
                  style={{ borderColor: 'var(--color-stone-light)' }}
                />
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span
                className="text-sm font-medium leading-tight"
                style={{
                  color: isCompleted ? 'rgba(111,207,138,0.5)' : 'var(--color-text-1)',
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(111,207,138,0.35)',
                  transition: 'color 0.3s',
                }}
              >
                {habit.title}
              </span>
              <StreakBadge streak={habit.current_streak || 0} />
              <MetricBadge habit={habit} />
            </div>
            {habit.description && (
              <p
                className="text-xs leading-snug line-clamp-1"
                style={{ color: 'var(--color-text-3)' }}
              >
                {habit.description}
              </p>
            )}
          </div>

          {/* XP earned indicator — shows briefly on complete */}
          <AnimatePresence>
            {justCompleted && isCompleted && (
              <motion.span
                initial={{ opacity: 0, y: 4, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="flex-shrink-0 text-xs font-bold"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
              >
                +10 XP
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}