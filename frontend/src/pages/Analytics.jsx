import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Flame, TrendingUp, CheckCircle2,
  Trophy, Calendar, ChevronLeft, ChevronRight,
  Zap, RefreshCw,
} from 'lucide-react';
import { fetchHeatmapData, fetchDailyRates } from '../api/habits';
import { useHabitStore } from '../store/habitStore';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ── Heatmap ──────────────────────────────────────────────────────────────────
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getHeatLevel(rate) {
  if (rate === null || rate === undefined) return 0;
  if (rate === 0) return 0;
  if (rate <= 0.25) return 1;
  if (rate <= 0.5)  return 2;
  if (rate <= 0.75) return 3;
  return 4;
}

const HEAT_COLORS = [
  'var(--color-stone)',
  'rgba(184,115,51,0.2)',
  'rgba(184,115,51,0.42)',
  'rgba(184,115,51,0.68)',
  'var(--color-primary)',
];

function HeatCell({ date, level, completedCount, totalCount, isToday }) {
  const [hovered, setHovered] = useState(false);
  const label = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <motion.div
        whileHover={{ scale: 1.25 }}
        transition={{ duration: 0.12 }}
        style={{
          width: '11px', height: '11px', borderRadius: '3px',
          background: HEAT_COLORS[level] || HEAT_COLORS[0],
          boxShadow: isToday ? `0 0 0 1.5px var(--color-primary)` : level === 4 ? '0 0 6px rgba(184,115,51,0.4)' : 'none',
          cursor: level > 0 ? 'pointer' : 'default',
          border: isToday ? '1px solid rgba(184,115,51,0.6)' : '1px solid transparent',
          transition: 'background 0.2s',
        }}
      />
      <AnimatePresence>
        {hovered && date && (
          <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '5px 9px', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-warm-white)' }}>{label}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
              {completedCount}/{totalCount} completed
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContributionHeatmap({ data, loading }) {
  if (loading) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RefreshCw size={18} style={{ color: 'var(--color-text-3)' }} />
          </motion.div>
        </div>
      </div>
    );
  }

  if (!data || !data.date_range || data.date_range.length === 0) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <BarChart2 size={24} style={{ color: 'var(--color-text-3)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>No habit data yet</p>
      </div>
    );
  }

  const { date_range, matrix, habits } = data;
  const today = new Date().toISOString().split('T')[0];

  // Build daily completion rates across all habits
  const dailyMap = {};
  date_range.forEach(d => {
    let completed = 0, total = habits.length;
    habits.forEach(h => {
      const row = matrix[h.id]?.find(r => r.date === d);
      if (row?.completed === true) completed++;
    });
    dailyMap[d] = { completed, total };
  });

  // Pad to start on Sunday
  const firstDate = new Date(date_range[0] + 'T00:00:00');
  const startPad  = firstDate.getDay(); // 0 = Sun

  const cells = [
    ...Array(startPad).fill(null),
    ...date_range.map(d => ({
      date: d,
      ...dailyMap[d],
      level: dailyMap[d].total > 0 ? getHeatLevel(dailyMap[d].completed / dailyMap[d].total) : 0,
      isToday: d === today,
    })),
  ];

  // Group into weeks (cols of 7)
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.2), transparent)' }} />

      {/* Day labels */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px', paddingLeft: '28px' }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ width: '11px', fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-3)', textAlign: 'center' }}>{d[0]}</div>
        ))}
      </div>

      {/* Grid: weeks as columns */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-start', overflowX: 'auto' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((cell, di) =>
              cell ? (
                <HeatCell key={di}
                  date={cell.date}
                  level={cell.level}
                  completedCount={cell.completed}
                  totalCount={cell.total}
                  isToday={cell.isToday}
                />
              ) : (
                <div key={di} style={{ width: '11px', height: '11px' }} />
              )
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '10px', color: 'var(--color-text-3)', marginRight: '2px' }}>Less</span>
        {HEAT_COLORS.map((c, i) => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '3px', background: c, border: '1px solid rgba(255,255,255,0.04)' }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--color-text-3)', marginLeft: '2px' }}>More</span>
      </div>
    </div>
  );
}

// ── Daily completion rate bar chart ─────────────────────────────────────────
function DailyRateChart({ data, loading, days }) {
  if (loading) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw size={18} style={{ color: 'var(--color-text-3)' }} />
        </motion.div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', textAlign: 'center', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <TrendingUp size={24} style={{ color: 'var(--color-text-3)', marginBottom: '8px' }} />
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>No data yet</p>
      </div>
    );
  }

  const maxRate = 1;
  const chartHeight = 120;
  const slice = data.slice(-days);

  return (
    <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.2), transparent)' }} />

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${chartHeight}px`, position: 'relative' }}>
        {/* Y-axis guides */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct * chartHeight}px`, borderTop: '1px dashed rgba(255,255,255,0.05)', pointerEvents: 'none' }}>
            <span style={{ position: 'absolute', right: 0, top: '-8px', fontSize: '9px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{Math.round(pct * 100)}%</span>
          </div>
        ))}

        {slice.map((entry, i) => {
          const rate = entry.completion_rate || 0;
          const barH = Math.max(2, rate * chartHeight);
          const isToday = entry.date === new Date().toISOString().split('T')[0];
          const color = rate === 1 ? '#6fcf8a' : rate >= 0.5 ? 'var(--color-primary)' : rate > 0 ? 'var(--color-primary-dim)' : 'var(--color-stone-light)';

          return (
            <motion.div key={entry.date}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.012, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, minWidth: 0, borderRadius: '3px 3px 0 0', background: color, transformOrigin: 'bottom', position: 'relative', boxShadow: rate === 1 ? '0 0 8px rgba(82,168,115,0.35)' : isToday ? '0 0 6px rgba(184,115,51,0.4)' : 'none', height: `${barH}px`, outline: isToday ? '1px solid rgba(184,115,51,0.6)' : 'none', cursor: 'pointer' }}
              title={`${entry.date}: ${Math.round(rate * 100)}% (${entry.completed}/${entry.total})`}
            />
          );
        })}
      </div>

      {/* X-axis labels (sparse) */}
      <div style={{ display: 'flex', marginTop: '6px' }}>
        {slice.map((entry, i) => {
          const showLabel = i === 0 || i === Math.floor(slice.length / 2) || i === slice.length - 1;
          const d = new Date(entry.date + 'T00:00:00');
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              {showLabel && (
                <span style={{ fontSize: '9px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Per-habit streak table ────────────────────────────────────────────────────
function HabitTable({ habits }) {
  if (!habits || habits.length === 0) return null;
  const sorted = [...habits].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0));
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Trophy size={13} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>Per-habit streaks</span>
      </div>
      {sorted.map((habit, i) => {
        const streak = habit.current_streak || 0;
        const maxStreak = sorted[0]?.current_streak || 1;
        const pct = maxStreak > 0 ? (streak / maxStreak) * 100 : 0;
        return (
          <motion.div key={habit.id}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderBottom: i < sorted.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <span style={{ width: '18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-3)', flexShrink: 0 }}>#{i + 1}</span>
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.title}</span>
            <div style={{ width: '80px', height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.04 + 0.2 }}
                style={{ height: '100%', borderRadius: '99px', background: streak >= 7 ? 'linear-gradient(90deg, #e07830, #ff9940)' : 'var(--color-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '40px', justifyContent: 'flex-end', flexShrink: 0 }}>
              {streak >= 3 && <Flame size={10} style={{ color: streak >= 7 ? '#e07830' : 'var(--color-text-3)' }} />}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: streak >= 7 ? '#e07830' : 'var(--color-text-2)' }}>{streak}d</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Weekly summary row ────────────────────────────────────────────────────────
function WeeklySummary({ summary }) {
  if (!summary || summary.length === 0) return null;
  const recent = summary.slice(-4);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${recent.length}, 1fr)`, gap: '8px' }}>
      {recent.map((week, i) => {
        const pct = Math.round((week.completion_rate || 0) * 100);
        const isLast = i === recent.length - 1;
        const accent = pct === 100 ? '#6fcf8a' : pct >= 70 ? 'var(--color-primary)' : pct >= 40 ? '#e07830' : 'var(--color-text-3)';
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ borderRadius: '12px', padding: '12px', background: isLast ? 'var(--color-surface-2)' : 'var(--color-stone)', border: `1px solid ${isLast ? 'var(--color-primary-border)' : 'var(--color-border)'}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {isLast && <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.35), transparent)' }} />}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: accent, lineHeight: 1, marginBottom: '4px' }}>{pct}%</div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)' }}>
              {isLast ? 'This week' : `Wk -${recent.length - 1 - i}`}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, accent, iconFill = false, delay = 0 }) {
  const bg = `${accent}14`;
  const border = `${accent}26`;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: '16px', background: 'var(--color-surface-2)', border: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
      <div style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', background: bg, border: `1px solid ${border}` }}>
        <Icon size={13} style={{ color: accent }} fill={iconFill ? accent : 'none'} strokeWidth={iconFill ? 0 : 2} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>{label}</div>
    </motion.div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
export default function Analytics() {
  const { habits, userStats, loadHabits } = useHabitStore();
  const [heatmapData,  setHeatmapData]  = useState(null);
  const [dailyRates,   setDailyRates]   = useState(null);
  const [heatLoading,  setHeatLoading]  = useState(true);
  const [rateLoading,  setRateLoading]  = useState(true);
  const [rateWindow,   setRateWindow]   = useState(30);

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  useEffect(() => {
    (async () => {
      setHeatLoading(true);
      try { setHeatmapData(await fetchHeatmapData(USER_ID, 12)); }
      catch (_) {}
      finally { setHeatLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setRateLoading(true);
      try { setDailyRates(await fetchDailyRates(USER_ID, 60)); }
      catch (_) {}
      finally { setRateLoading(false); }
    })();
  }, []);

  // Derived stats from daily rates
  const stats = useMemo(() => {
    if (!dailyRates || dailyRates.length === 0) return { avg: 0, best: 0, perfectDays: 0 };
    const slice = dailyRates.slice(-30);
    const avg   = slice.reduce((s, d) => s + d.completion_rate, 0) / slice.length;
    const best  = Math.max(...slice.map(d => d.completion_rate));
    const perfectDays = slice.filter(d => d.completion_rate === 1).length;
    return { avg: Math.round(avg * 100), best: Math.round(best * 100), perfectDays };
  }, [dailyRates]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ paddingBottom: '40px' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <motion.h1 className="text-display"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          Analytics
        </motion.h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
          Track your performance · last 12 weeks
        </p>
      </div>

      {/* ── Stat chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatChip icon={CheckCircle2} label="Avg completion" value={`${stats.avg}%`}    accent="#52a873" delay={0}    />
        <StatChip icon={Trophy}       label="Best day"        value={`${stats.best}%`}   accent="#c9a43a" delay={0.05} />
        <StatChip icon={Calendar}     label="Perfect days"    value={stats.perfectDays}  accent="#b07030" delay={0.1}  />
        <StatChip icon={Flame}        label="Best streak"     value={`${userStats?.longest_streak || 0}d`} accent="#e07830" iconFill delay={0.15} />
      </div>

      {/* ── Heatmap section ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
          <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
            Contribution history
          </span>
        </div>
        <ContributionHeatmap data={heatmapData} loading={heatLoading} />
      </div>

      {/* ── Weekly summary ── */}
      {heatmapData?.weekly_summary && heatmapData.weekly_summary.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <TrendingUp size={13} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
              Weekly breakdown
            </span>
          </div>
          <WeeklySummary summary={heatmapData.weekly_summary} />
        </div>
      )}

      {/* ── Daily rate chart ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <BarChart2 size={13} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
              Daily completion rate
            </span>
          </div>
          {/* Day range toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[7, 14, 30, 60].map(d => (
              <button key={d} onClick={() => setRateWindow(d)}
                style={{ padding: '4px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: rateWindow === d ? 'rgba(184,115,51,0.15)' : 'transparent', color: rateWindow === d ? 'var(--color-primary)' : 'var(--color-text-3)', border: `1px solid ${rateWindow === d ? 'rgba(184,115,51,0.35)' : 'transparent'}` }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        <DailyRateChart data={dailyRates} loading={rateLoading} days={rateWindow} />
      </div>

      {/* ── Per-habit streaks ── */}
      <HabitTable habits={habits} />
    </motion.div>
  );
}