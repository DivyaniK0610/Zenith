import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Calendar, Trophy } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex-1 bg-surface border border-slate-700/80 rounded-2xl p-4 relative overflow-hidden"
    >
      <div className={`absolute right-3 top-3 w-8 h-8 rounded-xl ${color.bg} flex items-center justify-center`}>
        <Icon size={15} className={color.text} />
      </div>

      <div className="text-2xl font-black text-white tracking-tight mb-0.5">{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </motion.div>
  );
}

export default function StatsRow({ habits = [], userStats = null }) {
  const totalHabits = habits.length;
  const longestStreak = userStats?.longest_streak || 0;
  const currentStreak = userStats?.current_streak || 0;
  const level = userStats?.level || 1;

  return (
    <div className="flex gap-3">
      <StatCard
        icon={Flame}
        label="Current Streak"
        value={`${currentStreak}d`}
        color={{ bg: 'bg-orange-500/15', text: 'text-orange-400' }}
        delay={0}
      />
      <StatCard
        icon={CheckCircle2}
        label="Habits Tracked"
        value={totalHabits}
        color={{ bg: 'bg-emerald-500/15', text: 'text-emerald-400' }}
        delay={0.05}
      />
      <StatCard
        icon={Trophy}
        label="Best Streak"
        value={`${longestStreak}d`}
        color={{ bg: 'bg-amber-500/15', text: 'text-amber-400' }}
        delay={0.1}
      />
      <StatCard
        icon={Calendar}
        label="Level"
        value={level}
        color={{ bg: 'bg-violet-500/15', text: 'text-violet-400' }}
        delay={0.15}
      />
    </div>
  );
}