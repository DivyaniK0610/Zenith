import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy, Star } from 'lucide-react';
import { useZenithSounds } from '../../hooks/useSound';

const PARTICLE_COUNT = 20;

function Particle({ delay }) {
  const angle = Math.random() * 360;
  const distance = 80 + Math.random() * 120;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 4 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 0.8 + Math.random() * 0.4, delay, ease: 'easeOut' }}
    />
  );
}

function LevelUpContent({ data, onClose }) {
  const { playLevelUp } = useZenithSounds();

  useEffect(() => {
    playLevelUp();
  }, [playLevelUp]);

  return (
    <div className="relative flex flex-col items-center text-center px-8 py-10">
      {/* Particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} delay={i * 0.02} />
      ))}

      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Icon */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
          <Zap className="w-12 h-12 text-white" fill="white" />
        </div>
        <motion.div
          className="absolute -inset-2 rounded-3xl border-2 border-violet-400/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="text-xs font-bold tracking-[0.3em] text-violet-400 uppercase mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Achievement Unlocked
      </motion.div>

      <motion.h2
        className="text-4xl font-black text-white mb-1 tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Level {data.level}
      </motion.h2>

      <motion.p
        className="text-slate-400 text-sm mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        You leveled up from {data.old_level} → {data.level}
      </motion.p>

      <motion.div
        className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      >
        <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
        <span className="text-amber-400 font-bold">{data.total_xp} XP</span>
        <span className="text-slate-500 text-sm">total</span>
      </motion.div>

      <motion.button
        className="mt-8 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
        onClick={onClose}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.96 }}
      >
        Keep Going →
      </motion.button>
    </div>
  );
}

function StreakContent({ data, onClose }) {
  const { playStreak } = useZenithSounds();

  useEffect(() => {
    playStreak();
  }, [playStreak]);

  const getMilestoneLabel = (streak) => {
    if (streak >= 100) return 'Legendary 🔥';
    if (streak >= 30) return 'On Fire 🔥';
    if (streak >= 7) return 'Week Warrior 🔥';
    return `${streak}-Day Streak 🔥`;
  };

  return (
    <div className="relative flex flex-col items-center text-center px-8 py-10">
      <motion.div
        className="absolute inset-0 rounded-3xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)' }}
      />

      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 10, delay: 0.1 }}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/40">
          <Flame className="w-12 h-12 text-white" fill="white" />
        </div>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute -inset-1 rounded-3xl border border-orange-400/30"
            animate={{ scale: [1, 1.2 + i * 0.1, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </motion.div>

      <motion.div
        className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Streak Milestone
      </motion.div>

      <motion.h2
        className="text-3xl font-black text-white mb-1 tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {getMilestoneLabel(data.current_streak)}
      </motion.h2>

      <motion.p
        className="text-slate-400 text-sm max-w-[220px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {data.message}
      </motion.p>

      <motion.div
        className="flex items-center gap-3 mt-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
          <div className="text-2xl font-black text-orange-400">{data.current_streak}</div>
          <div className="text-xs text-slate-500">days</div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="text-2xl font-black text-blue-400">+{data.xp_gained}</div>
          <div className="text-xs text-slate-500">XP</div>
        </div>
        {data.milestone_bonus > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-2xl font-black text-amber-400">+{data.milestone_bonus}</div>
            <div className="text-xs text-slate-500">bonus</div>
          </div>
        )}
      </motion.div>

      <motion.button
        className="mt-8 px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/25"
        onClick={onClose}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileTap={{ scale: 0.96 }}
      >
        Keep the Streak →
      </motion.button>
    </div>
  );
}

export default function AchievementOverlay({ achievement, onClose }) {
  const isVisible = !!achievement;

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs"
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="bg-[#0f172a] border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 relative">
              {/* Subtle top shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {achievement?.type === 'level_up' ? (
                <LevelUpContent data={achievement} onClose={onClose} />
              ) : (
                <StreakContent data={achievement} onClose={onClose} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}