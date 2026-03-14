import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Star } from 'lucide-react';
import { useZenithSounds } from '../../hooks/useSound';
import { createPortal } from 'react-dom';

function Particle({ delay }) {
  const angle = Math.random() * 360;
  const dist  = 70 + Math.random() * 110;
  const x     = Math.cos((angle * Math.PI) / 180) * dist;
  const y     = Math.sin((angle * Math.PI) / 180) * dist;
  const colors = ['#c9813a','#e8a45a','#9a5f25','#6fcf8a','#e8c35a'];
  const color  = colors[Math.floor(Math.random() * colors.length)];
  const size   = 4 + Math.random() * 5;
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, backgroundColor: color, left: '50%', top: '50%',
        marginLeft: -size/2, marginTop: -size/2 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 0.7 + Math.random() * 0.4, delay, ease: 'easeOut' }} />
  );
}

function LevelUpContent({ data, onClose }) {
  const { playLevelUp } = useZenithSounds();
  useEffect(() => { playLevelUp(); }, []);
  return (
    <div className="relative flex flex-col items-center text-center px-8 py-10">
      {Array.from({ length: 18 }).map((_, i) => <Particle key={i} delay={i * 0.02} />)}
      <div className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(201,129,58,0.1) 0%, transparent 70%)' }} />

      <motion.div className="relative mb-6"
        initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #c9813a, #8a4e1a)', boxShadow: '0 20px 60px rgba(201,129,58,0.35)' }}>
          <Zap className="w-10 h-10 text-white" fill="white" />
        </div>
        <motion.div className="absolute -inset-2 rounded-2xl border-2"
          style={{ borderColor: 'rgba(201,129,58,0.3)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }} />
      </motion.div>

      <motion.div className="text-xs font-bold tracking-widest uppercase mb-2"
        style={{ color: 'var(--color-primary)' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        Achievement Unlocked
      </motion.div>
      <motion.h2 className="text-4xl font-black mb-1 tracking-tight" style={{ color: 'var(--color-warm-white)' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        Level {data.level}
      </motion.h2>
      <motion.p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        Leveled up from {data.old_level} → {data.level}
      </motion.p>
      <motion.div className="flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{ background: 'rgba(201,129,58,0.1)', borderColor: 'rgba(201,129,58,0.25)' }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}>
        <Star className="w-4 h-4" style={{ color: '#e8c35a' }} fill="currentColor" />
        <span className="font-bold" style={{ color: '#e8c35a' }}>{data.total_xp} XP</span>
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>total</span>
      </motion.div>
      <motion.button onClick={onClose} whileTap={{ scale: 0.96 }}
        className="mt-7 px-8 py-3 rounded-2xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #c9813a, #9a5f25)', boxShadow: '0 8px 24px rgba(201,129,58,0.25)' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        Keep Going →
      </motion.button>
    </div>
  );
}

function StreakContent({ data, onClose }) {
  const { playStreak } = useZenithSounds();
  useEffect(() => { playStreak(); }, []);
  return (
    <div className="relative flex flex-col items-center text-center px-8 py-10">
      <div className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(224,122,48,0.08) 0%, transparent 70%)' }} />
      <motion.div className="relative mb-6"
        initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 10, delay: 0.1 }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #e07a30, #a04a10)', boxShadow: '0 20px 60px rgba(224,122,48,0.3)' }}>
          <Flame className="w-10 h-10 text-white" fill="white" />
        </div>
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} className="absolute -inset-1 rounded-2xl border"
            style={{ borderColor: 'rgba(224,122,48,0.25)' }}
            animate={{ scale: [1, 1.2 + i * 0.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
        ))}
      </motion.div>
      <motion.div className="text-xs font-bold tracking-widest uppercase mb-2"
        style={{ color: '#e07a30' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        Streak Milestone
      </motion.div>
      <motion.h2 className="text-3xl font-black mb-1 tracking-tight" style={{ color: 'var(--color-warm-white)' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        {data.current_streak} Days 🔥
      </motion.h2>
      <motion.p className="text-sm max-w-[220px]" style={{ color: 'var(--color-muted)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        {data.message}
      </motion.p>
      <motion.div className="flex items-center gap-3 mt-5"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {[
          { val: `${data.current_streak}d`, label: 'streak', color: '#e07a30' },
          { val: `+${data.xp_gained}`,      label: 'XP',     color: 'var(--color-primary)' },
          ...(data.milestone_bonus > 0 ? [{ val: `+${data.milestone_bonus}`, label: 'bonus', color: '#e8c35a' }] : []),
        ].map(({ val, label, color }) => (
          <div key={label} className="px-4 py-2 rounded-xl border text-center"
            style={{ background: color + '12', borderColor: color + '30' }}>
            <div className="text-xl font-black" style={{ color }}>{val}</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</div>
          </div>
        ))}
      </motion.div>
      <motion.button onClick={onClose} whileTap={{ scale: 0.96 }}
        className="mt-7 px-8 py-3 rounded-2xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #e07a30, #a04a10)', boxShadow: '0 8px 24px rgba(224,122,48,0.2)' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        Keep the Streak →
      </motion.button>
    </div>
  );
}

export default function AchievementOverlay({ achievement, onClose }) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [achievement, onClose]);

  return createPortal(
  <AnimatePresence>
    {achievement && (
      <>
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 51,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ width: '100%', maxWidth: '320px' }}
          >
            <div
              className="rounded-3xl overflow-hidden border shadow-2xl relative"
              style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)' }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(201,129,58,0.3), transparent)' }}
              />
              {achievement.type === 'level_up'
                ? <LevelUpContent data={achievement} onClose={onClose} />
                : <StreakContent  data={achievement} onClose={onClose} />}
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>,
  document.body
);
}