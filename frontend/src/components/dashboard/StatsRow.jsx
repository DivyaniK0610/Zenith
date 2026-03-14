import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Trophy, Zap } from 'lucide-react';

const STATS = [
  {
    key: 'streak',
    icon: Flame,
    label: 'Streak',
    accent: '#e07830',
    accentBg: 'rgba(224,120,48,0.1)',
    accentBorder: 'rgba(224,120,48,0.18)',
    iconFill: true,
  },
  {
    key: 'habits',
    icon: CheckCircle2,
    label: 'Habits',
    accent: '#52a873',
    accentBg: 'rgba(82,168,115,0.1)',
    accentBorder: 'rgba(82,168,115,0.18)',
    iconFill: false,
  },
  {
    key: 'best',
    icon: Trophy,
    label: 'Best',
    accent: '#c9a43a',
    accentBg: 'rgba(201,164,58,0.1)',
    accentBorder: 'rgba(201,164,58,0.18)',
    iconFill: false,
  },
  {
    key: 'level',
    icon: Zap,
    label: 'Level',
    accent: '#b87333',
    accentBg: 'rgba(184,115,51,0.1)',
    accentBorder: 'rgba(184,115,51,0.18)',
    iconFill: true,
  },
];

function StatCard({ icon: Icon, label, value, accent, accentBg, accentBorder, iconFill, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 min-w-0 relative rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface-2)',
        border: `1px solid ${accentBorder}`,
      }}
    >
      {/* Top shimmer tinted with accent */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
        }}
      />

      {/* Subtle accent glow in top-right */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${accent}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-3.5">
        {/* Icon chip */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5"
          style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
        >
          <Icon
            size={13}
            style={{ color: accent }}
            fill={iconFill ? accent : 'none'}
            strokeWidth={iconFill ? 0 : 2}
          />
        </div>

        {/* Value */}
        <div
          className="leading-none mb-1"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--color-warm-white)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-3)',
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsRow({ habits = [], userStats = null }) {
  const values = {
    streak: `${userStats?.current_streak || 0}d`,
    habits: habits.length,
    best:   `${userStats?.longest_streak || 0}d`,
    level:  userStats?.level || 1,
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {STATS.map((stat, i) => {
        const { key, ...statProps } = stat;
        return (
          <StatCard
            key={key}
            {...statProps}
            value={values[key]}
            delay={i * 0.06}
          />
        );
      })}
    </div>
  );
}