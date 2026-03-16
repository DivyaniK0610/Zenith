import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Flame, TrendingUp, CheckCircle2,
  Trophy, Calendar, RefreshCw, ArrowUp, ArrowDown,
  Minus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchHeatmapData, fetchDailyRates } from '../api/habits';
import { useHabitStore } from '../store/habitStore';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';
const WEEK_DAYS = ['S','M','T','W','T','F','S'];
const HEATMAP_FILTERS = [
  { label: '3 mo', weeks: 12 },
  { label: '6 mo', weeks: 26 },
  { label: '1 yr', weeks: 52 },
];

function getHeatLevel(rate) {
  if (!rate) return 0;
  if (rate <= 0.25) return 1;
  if (rate <= 0.5)  return 2;
  if (rate <= 0.75) return 3;
  return 4;
}
const HEAT_COLORS = [
  'var(--color-stone)',
  'rgba(184,115,51,0.22)',
  'rgba(184,115,51,0.45)',
  'rgba(184,115,51,0.70)',
  'var(--color-primary)',
];

// ── Heat cell ──────────────────────────────────────────────────────────────
function HeatCell({ date, level, completed, total, isToday, isSelected, onSelect }) {
  return (
    <motion.div
      whileHover={{ scale: 1.35 }}
      transition={{ duration: 0.1 }}
      onClick={() => date && onSelect({ date, completed, total })}
      style={{
        width: '11px', height: '11px', borderRadius: '3px',
        background: HEAT_COLORS[level] || HEAT_COLORS[0],
        boxShadow: isSelected
          ? '0 0 0 2px var(--color-primary)'
          : isToday ? '0 0 0 1.5px var(--color-primary)' : 'none',
        border: isToday && !isSelected ? '1px solid rgba(184,115,51,0.6)' : '1px solid transparent',
        cursor: date ? 'pointer' : 'default',
        flexShrink: 0,
        transition: 'box-shadow 0.15s',
      }}
    />
  );
}

// ── Heatmap sidebar ───────────────────────────────────────────────────────
function HeatDetail({ selected }) {
  if (!selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', padding: '16px 0', textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--color-stone)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={14} style={{ color: 'var(--color-text-3)' }} />
        </div>
        <p style={{ fontSize: '10px', color: 'var(--color-text-3)', margin: 0, lineHeight: 1.5 }}>
          Tap a cell for details
        </p>
      </div>
    );
  }
  const d     = new Date(selected.date + 'T00:00:00');
  const pct   = selected.total > 0 ? Math.round((selected.completed / selected.total) * 100) : 0;
  const color = pct === 100 ? '#6fcf8a' : pct >= 70 ? 'var(--color-primary)' : pct >= 40 ? '#e07830' : 'var(--color-text-3)';
  return (
    <motion.div key={selected.date} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-warm-white)', marginBottom: '1px' }}>
        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.04em', margin: '10px 0 4px' }}>
        {pct}%
      </div>
      <div style={{ height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
          style={{ height: '100%', borderRadius: '99px', background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>Done</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-warm-white)' }}>
          {selected.completed}/{selected.total}
        </span>
      </div>
    </motion.div>
  );
}

// ── Contribution Heatmap ──────────────────────────────────────────────────
function ContributionHeatmap() {
  const [filterWeeks, setFilterWeeks] = useState(12);
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    fetchHeatmapData(USER_ID, filterWeeks + weekOffset)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [filterWeeks, weekOffset]);

  const today = new Date().toISOString().split('T')[0];

  const buildGrid = () => {
    if (!data?.date_range?.length || !data.habits?.length) return [];
    const { date_range, matrix, habits } = data;
    const dailyMap = {};
    date_range.forEach(d => {
      let completed = 0;
      habits.forEach(h => {
        const row = matrix[h.id]?.find(r => r.date === d);
        if (row?.completed === true) completed++;
      });
      dailyMap[d] = { completed, total: habits.length };
    });

    // Only show the last filterWeeks worth of dates
    const visibleDates = date_range.slice(-filterWeeks * 7);
    const firstDate = new Date(visibleDates[0] + 'T00:00:00');
    const startPad  = firstDate.getDay();
    const cells = [
      ...Array(startPad).fill(null),
      ...visibleDates.map(d => ({
        date: d, ...dailyMap[d],
        level: dailyMap[d].total > 0 ? getHeatLevel(dailyMap[d].completed / dailyMap[d].total) : 0,
        isToday: d === today,
      })),
    ];
    const weekCols = [];
    for (let i = 0; i < cells.length; i += 7) weekCols.push(cells.slice(i, i + 7));
    return weekCols;
  };

  const weekCols = buildGrid();

  return (
    <div style={{ borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.25), transparent)', pointerEvents: 'none' }} />

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '3px', background: 'var(--color-stone)', borderRadius: '9px', padding: '3px', border: '1px solid var(--color-border)' }}>
          {HEATMAP_FILTERS.map(f => (
            <button key={f.weeks} onClick={() => { setFilterWeeks(f.weeks); setWeekOffset(0); }}
              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filterWeeks === f.weeks ? 'var(--color-surface-2)' : 'transparent', color: filterWeeks === f.weeks ? 'var(--color-primary)' : 'var(--color-text-3)', border: filterWeeks === f.weeks ? '1px solid var(--color-primary-border)' : '1px solid transparent' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setWeekOffset(o => o + filterWeeks)}
            style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
            <ChevronLeft size={12} />
          </button>
          <span style={{ fontSize: '10px', color: 'var(--color-text-3)', minWidth: '50px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            {weekOffset === 0 ? 'Now' : `−${weekOffset}w`}
          </span>
          <button onClick={() => setWeekOffset(o => Math.max(0, o - filterWeeks))}
            disabled={weekOffset === 0}
            style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: weekOffset > 0 ? 'var(--color-text-3)' : 'var(--color-stone-light)', cursor: weekOffset > 0 ? 'pointer' : 'default', opacity: weekOffset > 0 ? 1 : 0.4 }}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex' }}>
        {/* Grid */}
        <div style={{ flex: 1, padding: '12px 14px', overflowX: 'auto', minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
              <Spinner />
            </div>
          ) : !weekCols.length ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>No data for this period</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
                {WEEK_DAYS.map((d, i) => (
                  <div key={i} style={{ width: '11px', fontSize: '7px', fontWeight: 600, color: 'var(--color-text-3)', textAlign: 'center' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '3px', width: 'max-content' }}>
                {weekCols.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {week.map((cell, di) =>
                      cell ? (
                        <HeatCell key={di} date={cell.date} level={cell.level} completed={cell.completed} total={cell.total} isToday={cell.isToday} isSelected={selected?.date === cell.date} onSelect={setSelected} />
                      ) : (
                        <div key={di} style={{ width: '11px', height: '11px' }} />
                      )
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <span style={{ fontSize: '8px', color: 'var(--color-text-3)', marginRight: '2px' }}>Less</span>
                {HEAT_COLORS.map((c, i) => (
                  <div key={i} style={{ width: '9px', height: '9px', borderRadius: '2px', background: c }} />
                ))}
                <span style={{ fontSize: '8px', color: 'var(--color-text-3)', marginLeft: '2px' }}>More</span>
              </div>
            </>
          )}
        </div>

        {/* Sidebar detail */}
        <div style={{ width: '130px', flexShrink: 0, borderLeft: '1px solid var(--color-border)', padding: '12px 12px', background: 'rgba(0,0,0,0.15)' }}>
          <HeatDetail selected={selected} />
        </div>
      </div>
    </div>
  );
}

// ── Daily Rate Chart ──────────────────────────────────────────────────────
function DailyRateChart({ data, loading, days }) {
  const [selected, setSelected] = useState(null);
  const slice = data?.slice(-days) || [];
  const chartH = 110;

  useEffect(() => {
    if (!slice.length) return;
    const today = new Date().toISOString().split('T')[0];
    const t = slice.find(e => e.date === today);
    setSelected(t || slice[slice.length - 1]);
  }, [days, data]);

  if (loading) return <div style={{ ...cardStyle, height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (!slice.length) return <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}><p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>No data yet</p></div>;

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        {/* Chart */}
        <div style={{ flex: 1, padding: '14px 14px 10px', minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
            {[0, 0.5, 1].map(pct => (
              <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct * chartH}px`, borderTop: '1px dashed rgba(255,255,255,0.05)', pointerEvents: 'none' }}>
                <span style={{ position: 'absolute', right: 0, top: '-8px', fontSize: '8px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>{Math.round(pct * 100)}%</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${chartH}px`, paddingRight: '22px', position: 'relative' }}>
              {slice.map((entry, i) => {
                const rate  = entry.completion_rate || 0;
                const barH  = Math.max(2, rate * chartH);
                const isSel = selected?.date === entry.date;
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                const color = rate === 1 ? '#6fcf8a' : rate >= 0.5 ? 'var(--color-primary)' : rate > 0 ? 'rgba(184,115,51,0.5)' : 'var(--color-stone-light)';
                return (
                  <div key={entry.date} onClick={() => setSelected(entry)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', cursor: 'pointer' }}>
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.006, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        height: `${barH}px`, borderRadius: '3px 3px 0 0',
                        background: isSel ? (rate === 1 ? '#7de09a' : '#d4954a') : color,
                        transformOrigin: 'bottom',
                        outline: isSel ? '2px solid var(--color-primary)' : isToday ? '1px solid rgba(184,115,51,0.5)' : 'none',
                        outlineOffset: '1px',
                        transition: 'background 0.15s',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', marginTop: '5px', paddingRight: '22px' }}>
              {slice.map((entry, i) => {
                const show = i === 0 || i === Math.floor(slice.length / 2) || i === slice.length - 1;
                const d = new Date(entry.date + 'T00:00:00');
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    {show && <span style={{ fontSize: '8px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: '130px', flexShrink: 0, borderLeft: '1px solid var(--color-border)', padding: '14px 12px', background: 'rgba(0,0,0,0.15)' }}>
          {selected ? (() => {
            const rate  = selected.completion_rate || 0;
            const pct   = Math.round(rate * 100);
            const color = rate === 1 ? '#6fcf8a' : rate >= 0.5 ? 'var(--color-primary)' : rate > 0 ? '#e07830' : 'var(--color-text-3)';
            const d     = new Date(selected.date + 'T00:00:00');
            return (
              <motion.div key={selected.date} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginBottom: '8px' }}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '34px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                  {pct}%
                </div>
                <div style={{ height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
                    style={{ height: '100%', borderRadius: '99px', background: color }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[['Done', selected.completed], ['Total', selected.total]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>{l}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-warm-white)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })() : <p style={{ fontSize: '10px', color: 'var(--color-text-3)', margin: 0, lineHeight: 1.6 }}>Click a bar for details</p>}
        </div>
      </div>
    </div>
  );
}

// ── Weekly Summary ────────────────────────────────────────────────────────
function WeeklySummary({ summary }) {
  if (!summary?.length) return null;
  const recent = summary.slice(-4);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${recent.length}, 1fr)`, gap: '8px' }}>
      {recent.map((week, i) => {
        const pct    = Math.round((week.completion_rate || 0) * 100);
        const isLast = i === recent.length - 1;
        const color  = pct === 100 ? '#6fcf8a' : pct >= 70 ? 'var(--color-primary)' : pct >= 40 ? '#e07830' : 'var(--color-text-3)';
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ borderRadius: '14px', padding: '14px 12px', background: isLast ? 'var(--color-surface-2)' : 'var(--color-stone)', border: `1px solid ${isLast ? 'var(--color-primary-border)' : 'var(--color-border)'}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {isLast && <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)' }} />}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color, lineHeight: 1, marginBottom: '4px' }}>{pct}%</div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginBottom: '8px' }}>
              {isLast ? 'This week' : `Wk −${recent.length - 1 - i}`}
            </div>
            <div style={{ height: '3px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.07 + 0.2 }}
                style={{ height: '100%', borderRadius: '99px', background: color }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Per-habit Streaks ─────────────────────────────────────────────────────
function HabitTable({ habits }) {
  if (!habits?.length) return null;
  const sorted    = [...habits].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0));
  const maxStreak = sorted[0]?.current_streak || 1;
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Trophy size={13} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>Per-habit streaks</span>
      </div>
      {sorted.map((habit, i) => {
        const streak = habit.current_streak || 0;
        const pct    = maxStreak > 0 ? (streak / maxStreak) * 100 : 0;
        const hot    = streak >= 7;
        const color  = hot ? '#e07830' : 'var(--color-primary)';
        return (
          <motion.div key={habit.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 18px', borderBottom: i < sorted.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ width: '20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-3)', flexShrink: 0 }}>#{i + 1}</span>
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.title}</span>
            <div style={{ width: '72px', height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden', flexShrink: 0 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.04 + 0.2 }}
                style={{ height: '100%', borderRadius: '99px', background: hot ? 'linear-gradient(90deg, #e07830, #ff9940)' : 'var(--color-primary)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '40px', justifyContent: 'flex-end', flexShrink: 0 }}>
              {streak >= 3 && <Flame size={10} fill={hot ? 'currentColor' : 'none'} style={{ color }} />}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}>{streak}d</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sub, trend, delay = 0 }) {
  const bg = `${accent}14`, border = `${accent}26`;
  const TrendIcon  = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;
  const trendColor = trend > 0 ? '#6fcf8a' : trend < 0 ? '#f87171' : 'var(--color-text-3)';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ flex: 1, minWidth: 0, padding: '16px', borderRadius: '16px', background: 'var(--color-surface-2)', border: `1px solid ${border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle at 100% 0%, ${accent}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border: `1px solid ${border}` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '6px', background: `${trendColor}14`, border: `1px solid ${trendColor}28` }}>
            <TrendIcon size={9} style={{ color: trendColor }} />
            <span style={{ fontSize: '9px', fontWeight: 700, color: trendColor, fontFamily: 'var(--font-mono)' }}>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '4px' }}>{sub}</div>}
    </motion.div>
  );
}

const cardStyle = { padding: '16px 18px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', position: 'relative' };

function SectionHeader({ icon: Icon, label, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Icon size={13} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

function Spinner() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <RefreshCw size={18} style={{ color: 'var(--color-text-3)' }} />
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Analytics() {
  const { habits, userStats, loadHabits } = useHabitStore();
  const [dailyRates,  setDailyRates]  = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateWindow,  setRateWindow]  = useState(30);
  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);
  useEffect(() => {
    setRateLoading(true);
    fetchDailyRates(USER_ID, 60).then(setDailyRates).catch(() => setDailyRates(null)).finally(() => setRateLoading(false));
    fetchHeatmapData(USER_ID, 12).then(setHeatmapData).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    if (!dailyRates?.length) return { avg: 0, best: 0, perfectDays: 0, trend: 0 };
    const slice   = dailyRates.slice(-30);
    const prev    = dailyRates.slice(-60, -30);
    const avg     = slice.reduce((s, d) => s + d.completion_rate, 0) / slice.length;
    const prevAvg = prev.length ? prev.reduce((s, d) => s + d.completion_rate, 0) / prev.length : avg;
    const best    = Math.max(...slice.map(d => d.completion_rate));
    return {
      avg: Math.round(avg * 100),
      best: Math.round(best * 100),
      perfectDays: slice.filter(d => d.completion_rate === 1).length,
      trend: Math.round((avg - prevAvg) * 100),
    };
  }, [dailyRates]);

  const dayToggles = (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[7, 14, 30, 60].map(d => (
        <button key={d} onClick={() => setRateWindow(d)}
          style={{ padding: '4px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: rateWindow === d ? 'rgba(184,115,51,0.15)' : 'transparent', color: rateWindow === d ? 'var(--color-primary)' : 'var(--color-text-3)', border: `1px solid ${rateWindow === d ? 'rgba(184,115,51,0.35)' : 'transparent'}` }}>
          {d}d
        </button>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ paddingBottom: '40px' }}>

      <div style={{ marginBottom: '24px' }}>
        <motion.h1 className="text-display" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>Analytics</motion.h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>All habits · tap any cell or bar for details</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={CheckCircle2} label="Avg completion" value={`${stats.avg}%`}   accent="#52a873" trend={stats.trend} delay={0}    />
        <StatCard icon={Trophy}       label="Best day"        value={`${stats.best}%`}  accent="#c9a43a"                     delay={0.05} />
        <StatCard icon={Calendar}     label="Perfect days"    value={stats.perfectDays} accent="#b07030" sub="last 30 days"  delay={0.1}  />
        <StatCard icon={Flame}        label="Longest streak"  value={`${userStats?.longest_streak || 0}d`} accent="#e07830" delay={0.15} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SectionHeader icon={Calendar} label="Contribution history" />
        <ContributionHeatmap />
      </div>

      {heatmapData?.weekly_summary?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeader icon={TrendingUp} label="Weekly breakdown" />
          <WeeklySummary summary={heatmapData.weekly_summary} />
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <SectionHeader icon={BarChart2} label="Daily completion rate" right={dayToggles} />
        <DailyRateChart data={dailyRates} loading={rateLoading} days={rateWindow} />
      </div>

      <HabitTable habits={habits} />
    </motion.div>
  );
}