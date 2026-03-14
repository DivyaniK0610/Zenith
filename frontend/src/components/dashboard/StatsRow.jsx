import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Trophy, Zap } from 'lucide-react';

function StatCard({ icon: Icon, label, value, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex-1 min-w-0 rounded-2xl p-4 relative overflow-hidden border"
      style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)' }}
    >
      <div className="absolute right-3 top-3 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: accent + '20' }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="text-xl font-black leading-none mb-1 pr-10" style={{ color: 'var(--color-warm-white)' }}>
        {value}
      </div>
      <div className="text-xs font-medium leading-tight" style={{ color: 'var(--color-muted)' }}>{label}</div>
    </motion.div>
  );
}

export default function StatsRow({ habits = [], userStats = null }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      <StatCard icon={Flame}        label="Streak"   value={`${userStats?.current_streak || 0}d`} accent="#e07a30" delay={0}    />
      <StatCard icon={CheckCircle2} label="Habits"   value={habits.length}                        accent="#52a873" delay={0.05} />
      <StatCard icon={Trophy}       label="Best"     value={`${userStats?.longest_streak || 0}d`} accent="#c9a43a" delay={0.1}  />
      <StatCard icon={Zap}          label="Level"    value={userStats?.level || 1}                accent="#c9813a" delay={0.15} />
    </div>
  );
}