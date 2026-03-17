import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../store/habitStore';
import {
  Plus, Trash2, ChevronDown, X, Loader2, CheckCircle2,
  Link, Target, Flame, Zap, Trophy, TrendingUp, Calendar,
  MoreHorizontal, Check, Sparkles
} from 'lucide-react';
import apiClient from '../api/client';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';
const EMOJI_OPTIONS = ['🎯','💪','📚','🏃','🧘','💤','🥗','💻','🎨','🎵','✍️','🌿','🏋️','🚴','🎓','💡','🔥','⚡','🌟','🎪'];
const GOAL_ACCENTS  = ['#b07030','#52a873','#c9a43a','#7b6fd4','#e07060','#40a0c0','#d4768a','#60b080'];

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

// ── Circular SVG progress ─────────────────────────────────────────────
function Ring({ pct, size, stroke, color, done }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const c    = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-stone)" strokeWidth={stroke} />
      <motion.circle cx={c} cy={c} r={r} fill="none"
        stroke={done ? '#6fcf8a' : color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ filter: done ? 'drop-shadow(0 0 5px rgba(111,207,138,0.6))' : `drop-shadow(0 0 4px ${color}70)` }}
      />
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size < 52 ? '9px' : '11px', fontWeight: 700, fill: done ? '#6fcf8a' : color, fontFamily: 'var(--font-mono)' }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Stat chip — mobile-first ──────────────────────────────────────────
function Chip({ icon: Icon, value, label, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 10px', borderRadius: '14px',
        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />
      <div style={{
        width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${accent}16`, border: `1px solid ${accent}28`,
      }}>
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '16px', fontWeight: 700, color: 'var(--color-warm-white)',
          fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', lineHeight: 1,
        }}>{value}</div>
        <div style={{
          fontSize: '9px', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{label}</div>
      </div>
    </motion.div>
  );
}

// ── Add Goal Modal — bottom sheet on mobile ───────────────────────────
function AddGoalModal({ onClose }) {
  const { addGoal } = useHabitStore();
  const [form, setForm] = useState({ title: '', description: '', emoji: '🎯', target_date: '' });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await addGoal({ ...form, user_id: USER_ID, target_date: form.target_date || null });
      onClose();
    } catch (_) {}
    finally { setBusy(false); }
  };

  const inp = {
    width: '100%', background: 'var(--color-stone)', border: '1px solid var(--color-border)',
    borderRadius: '10px', padding: '10px 14px', color: 'var(--color-text-1)',
    fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none',
    boxSizing: 'border-box', lineHeight: 1.5,
  };
  const lbl = {
    display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)',
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          style={{ width: '100%', maxWidth: '540px' }}
        >
          <div style={{
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            borderBottom: 'none', boxShadow: '0 -16px 48px rgba(0,0,0,0.5)',
            maxHeight: '92dvh', overflowY: 'auto',
          }}>
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '2px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--color-stone-light)' }} />
            </div>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', padding: '10px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-warm-white)', margin: 0, letterSpacing: '-0.02em' }}>New goal</h2>
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)', margin: '2px 0 0' }}>Define what you're working towards</p>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer', flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>

            {/* Emoji grid */}
            <div style={{ padding: '14px 18px 8px' }}>
              <label style={lbl}>Icon</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                {EMOJI_OPTIONS.map(e => (
                  <motion.button key={e} type="button" whileTap={{ scale: 0.82 }}
                    onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    style={{
                      height: '32px', borderRadius: '8px', fontSize: '15px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.12s',
                      background: form.emoji === e ? 'rgba(184,115,51,0.2)' : 'var(--color-stone)',
                      border: `1px solid ${form.emoji === e ? 'rgba(184,115,51,0.5)' : 'transparent'}`,
                    }}>
                    {e}
                  </motion.button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '8px 18px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={lbl}>Goal name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', pointerEvents: 'none' }}>{form.emoji}</span>
                  <input autoFocus required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Get fit, Read more…"
                    style={{ ...inp, paddingLeft: '40px' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>
              </div>
              <div>
                <label style={lbl}>Why this matters <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Your motivation…" style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
              <div>
                <label style={lbl}>Target date <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
                <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                  style={{ ...inp, colorScheme: 'dark', color: form.target_date ? 'var(--color-text-1)' : 'var(--color-text-3)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
              <motion.button type="submit" disabled={busy || !form.title.trim()} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px', color: 'white',
                  fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  background: form.title.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone)',
                  border: '1px solid rgba(184,115,51,0.3)',
                  cursor: form.title.trim() && !busy ? 'pointer' : 'not-allowed',
                  boxShadow: form.title.trim() ? '0 4px 20px rgba(184,115,51,0.25)' : 'none',
                  opacity: busy ? 0.7 : 1, transition: 'all 0.2s',
                }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} />Create goal</>}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Assign Habits Modal — bottom sheet ───────────────────────────────
function AssignModal({ goal, habits, onClose }) {
  const { assignHabitToGoal, unassignHabit } = useHabitStore();
  const [busy, setBusy] = useState(null);

  const available   = habits.filter(h => h.status !== 'archived');
  const assignedSet = new Set(habits.filter(h => h.macro_goal_id === goal.id).map(h => h.id));

  const toggle = async (habit) => {
    setBusy(habit.id);
    try {
      if (assignedSet.has(habit.id)) await unassignHabit(habit.id);
      else await assignHabitToGoal(habit.id, goal.id);
    } finally { setBusy(null); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          style={{ width: '100%', maxWidth: '540px' }}
        >
          <div style={{
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            borderBottom: 'none', boxShadow: '0 -16px 48px rgba(0,0,0,0.5)',
            maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '2px', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--color-stone-light)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', background: 'rgba(184,115,51,0.12)', border: '1px solid rgba(184,115,51,0.2)', flexShrink: 0 }}>
                  {goal.emoji || '🎯'}
                </div>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', margin: 0 }}>{goal.title}</h2>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-3)', margin: '2px 0 0' }}>Toggle to assign or remove habits</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer', flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {available.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: '12px' }}>No habits yet — create some from the Dashboard first.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {available.map(habit => {
                    const isAssigned  = assignedSet.has(habit.id);
                    const isOtherGoal = habit.macro_goal_id && habit.macro_goal_id !== goal.id;
                    const isLoading   = busy === habit.id;
                    return (
                      <motion.button key={habit.id} whileTap={{ scale: 0.98 }}
                        onClick={() => !isOtherGoal && toggle(habit)}
                        disabled={!!isLoading || !!isOtherGoal}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                          cursor: isOtherGoal ? 'not-allowed' : 'pointer',
                          background: isAssigned ? 'rgba(184,115,51,0.08)' : 'var(--color-stone)',
                          border: `1px solid ${isAssigned ? 'rgba(184,115,51,0.3)' : 'var(--color-border)'}`,
                          opacity: isOtherGoal ? 0.4 : 1, transition: 'all 0.15s',
                        }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isAssigned ? 'rgba(184,115,51,0.25)' : 'var(--color-stone-mid)',
                          border: `1px solid ${isAssigned ? 'rgba(184,115,51,0.5)' : 'var(--color-stone-light)'}`,
                          transition: 'all 0.15s',
                        }}>
                          {isLoading ? <Loader2 size={11} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} /> : isAssigned ? <Check size={12} style={{ color: 'var(--color-primary)' }} /> : null}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: isAssigned ? 'var(--color-text-1)' : 'var(--color-text-2)', marginBottom: '2px' }}>{habit.title}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-3)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ textTransform: 'capitalize' }}>{habit.metric_type}</span>
                            {habit.current_streak > 0 && <span style={{ color: 'var(--color-primary)' }}>🔥 {habit.current_streak}d</span>}
                            {isOtherGoal && <span>· In another goal</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, flexShrink: 0, padding: '3px 8px', borderRadius: '6px', background: isAssigned ? 'rgba(184,115,51,0.15)' : 'transparent', color: isAssigned ? 'var(--color-primary)' : 'var(--color-text-3)' }}>
                          {isAssigned ? 'Assigned' : 'Add'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 16px 32px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-2)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Done</button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Goal Card — mobile-optimised ─────────────────────────────────────
function GoalCard({ goal, habits, completedToday, index }) {
  const { removeGoal, unassignHabit } = useHabitStore();
  const [expanded, setExpanded]           = useState(true);
  const [assignOpen, setAssignOpen]       = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) { setMenuOpen(false); setConfirmDelete(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const accent     = GOAL_ACCENTS[index % GOAL_ACCENTS.length];
  const goalHabits = habits.filter(h => h.macro_goal_id === goal.id);
  const active     = goalHabits.filter(h => h.status !== 'paused' && h.status !== 'archived');
  const done       = active.filter(h => completedToday.has(h.id)).length;
  const total      = active.length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone    = total > 0 && done === total;
  const dl         = daysLeft(goal.target_date);

  return (
    <>
      <motion.div layout
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', borderRadius: '16px', overflow: 'hidden',
          background: 'var(--color-surface-2)',
          border: `1px solid ${allDone ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`,
          boxShadow: allDone ? '0 0 0 1px rgba(82,168,115,0.1), 0 4px 16px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>

        {/* Left accent bar */}
        <div style={{ position: 'absolute', left: 0, top: '10px', bottom: '10px', width: '3px', background: `linear-gradient(to bottom, ${accent}, ${accent}50)`, borderRadius: '0 3px 3px 0', boxShadow: `0 0 6px ${accent}60` }} />
        {/* Top shimmer */}
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: 0, left: '3px', width: '100px', height: '100%', background: `radial-gradient(ellipse at 0% 40%, ${accent}06 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* ── Card header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 12px 10px 16px' }}>

          {/* Emoji */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px',
            background: `${accent}16`, border: `1px solid ${accent}28`,
          }}>
            {goal.emoji || '🎯'}
          </div>

          {/* Title + progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '5px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.01em' }}>
                    {goal.title}
                  </span>
                  {allDone && total > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ fontSize: '9px', fontWeight: 700, color: '#6fcf8a', background: 'rgba(82,168,115,0.12)', border: '1px solid rgba(82,168,115,0.3)', padding: '1px 6px', borderRadius: '99px' }}>
                      ✦ Done
                    </motion.span>
                  )}
                </div>
                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                  {dl !== null && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '2px',
                      fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '99px',
                      background: dl < 0 ? 'rgba(248,113,113,0.12)' : dl < 7 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                      color: dl < 0 ? '#f87171' : dl < 7 ? '#fbbf24' : 'var(--color-text-3)',
                      border: `1px solid ${dl < 0 ? 'rgba(248,113,113,0.2)' : dl < 7 ? 'rgba(251,191,36,0.15)' : 'var(--color-border)'}`,
                    }}>
                      <Calendar size={8} />
                      {dl > 0 ? `${dl}d` : dl === 0 ? 'Today' : `${Math.abs(dl)}d over`}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '2px',
                    fontSize: '10px', color: 'var(--color-text-3)', padding: '1px 6px',
                    borderRadius: '99px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  }}>
                    <Target size={8} />
                    {total} habit{total !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Ring — compact on mobile */}
              <Ring pct={pct} size={40} stroke={3.5} color={accent} done={allDone} />
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{ flex: 1, height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div
                  style={{
                    height: '100%', borderRadius: '99px',
                    background: allDone ? 'linear-gradient(90deg, #52a873, #6fcf8a)' : `linear-gradient(90deg, ${accent}90, ${accent})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0, color: allDone ? '#6fcf8a' : 'var(--color-text-3)' }}>
                {done}/{total}
              </span>
            </div>
          </div>
        </div>

        {/* ── Action row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px 10px 16px',
        }}>
          {/* Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {goal.description && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {goal.description}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0, marginLeft: '8px' }}>
            {/* Assign */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setAssignOpen(true)} title="Assign habits"
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${accent}16`, border: `1px solid ${accent}28`,
                color: accent, cursor: 'pointer',
              }}>
              <Link size={12} />
            </motion.button>

            {/* More */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => { setMenuOpen(o => !o); setConfirmDelete(false); }}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: menuOpen ? 'var(--color-stone-light)' : 'var(--color-stone)',
                  border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer',
                }}>
                <MoreHorizontal size={12} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.13 }}
                    style={{
                      position: 'absolute', top: '32px', right: 0, zIndex: 50,
                      borderRadius: '12px', background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
                      overflow: 'hidden', minWidth: '148px',
                    }}>
                    <button
                      onClick={() => { setExpanded(o => !o); setMenuOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-2)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      <ChevronDown size={12} style={{ transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                      {expanded ? 'Collapse' : 'Expand'}
                    </button>
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '12px', color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        <Trash2 size={12} /> Delete goal
                      </button>
                    ) : (
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginBottom: '8px' }}>Delete "{goal.title}"?</p>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { removeGoal(goal.id); setMenuOpen(false); }}
                            style={{ flex: 1, padding: '6px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setConfirmDelete(false)}
                            style={{ flex: 1, padding: '6px', borderRadius: '7px', fontSize: '11px', color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(o => !o)}
              style={{
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-stone)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-3)', cursor: 'pointer',
              }}>
              <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.18 }}>
                <ChevronDown size={12} />
              </motion.div>
            </button>
          </div>
        </div>

        {/* ── Habit rows ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}>

              {goalHabits.length === 0 ? (
                <div style={{ padding: '18px 14px', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '10px' }}>No habits linked yet</p>
                  <button onClick={() => setAssignOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, color: accent, background: `${accent}12`, border: `1px solid ${accent}28`, cursor: 'pointer' }}>
                    <Link size={12} /> Assign habits
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 10px 10px' }}>
                  {goalHabits.map((habit, hi) => {
                    const isDone = completedToday.has(habit.id);
                    return (
                      <motion.div key={habit.id} layout
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hi * 0.04 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 10px', borderRadius: '10px',
                          background: isDone ? 'rgba(52,138,85,0.07)' : 'var(--color-stone)',
                          border: `1px solid ${isDone ? 'rgba(82,168,115,0.15)' : 'var(--color-border)'}`,
                          marginBottom: hi < goalHabits.length - 1 ? '4px' : 0, transition: 'all 0.2s',
                        }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? 'rgba(52,138,85,0.2)' : 'var(--color-stone-mid)',
                          border: `1px solid ${isDone ? 'rgba(82,168,115,0.35)' : 'var(--color-stone-light)'}`,
                        }}>
                          {isDone && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={10} color="#6fcf8a" /></motion.div>}
                        </div>
                        <span style={{
                          flex: 1, fontSize: '12px', fontWeight: 500,
                          color: isDone ? 'rgba(111,207,138,0.58)' : 'var(--color-text-2)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{habit.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {habit.current_streak > 0 && <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>🔥{habit.current_streak}d</span>}
                        </div>
                        <button onClick={() => unassignHabit(habit.id)}
                          style={{ width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                          <X size={9} />
                        </button>
                      </motion.div>
                    );
                  })}
                  {/* Add row */}
                  <button onClick={() => setAssignOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', marginTop: '5px', padding: '7px 10px', borderRadius: '9px', fontSize: '11px', color: 'var(--color-text-3)', background: 'transparent', border: '1px dashed var(--color-border)', cursor: 'pointer' }}>
                    <Plus size={11} /> Add or remove habits
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {assignOpen && <AssignModal goal={goal} habits={habits} onClose={() => setAssignOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function Goals() {
  const { habits, goals, loadGoals, completedToday, loadHabits } = useHabitStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [showUngrouped, setShowUngrouped] = useState(false);

  useEffect(() => { loadGoals(USER_ID); loadHabits(USER_ID); }, [loadGoals, loadHabits]);

  const active     = habits.filter(h => h.status !== 'paused' && h.status !== 'archived');
  const totalH     = active.length;
  const totalDone  = active.filter(h => completedToday.has(h.id)).length;
  const overallPct = totalH > 0 ? Math.round((totalDone / totalH) * 100) : 0;
  const ungrouped  = active.filter(h => !h.macro_goal_id);
  const goalsDone  = goals.filter(g => {
    const gh = active.filter(h => h.macro_goal_id === g.id);
    return gh.length > 0 && gh.every(h => completedToday.has(h.id));
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{ paddingBottom: '40px' }}
    >

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <motion.h1 className="text-display"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 'clamp(22px, 6vw, 38px)' }}>
            Goals
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.07 }}
            style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
            {goals.length > 0
              ? `${goals.length} goal${goals.length !== 1 ? 's' : ''} · ${overallPct}% done today`
              : 'Group habits under bigger objectives'}
          </motion.p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }} onClick={() => setModalOpen(true)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 13px', borderRadius: '11px', fontWeight: 600, fontSize: '13px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            color: 'white', border: '1px solid rgba(184,115,51,0.3)',
            cursor: 'pointer', flexShrink: 0, letterSpacing: '-0.01em',
            boxShadow: '0 4px 14px rgba(184,115,51,0.22)', whiteSpace: 'nowrap', marginTop: '4px',
          }}>
          <Plus size={14} /> New goal
        </motion.button>
      </div>

      {/* ── Stats strip — 2×2 grid on mobile ── */}
      {totalH > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '7px',
          marginBottom: '14px',
        }}>
          <Chip icon={Target}       value={goals.length}             label="Goals"      accent="#b07030" delay={0}    />
          <Chip icon={CheckCircle2} value={`${totalDone}/${totalH}`} label="Done today" accent="#52a873" delay={0.04} />
          <Chip icon={Trophy}       value={goalsDone}                label="Completed"  accent="#c9a43a" delay={0.08} />
          <Chip icon={TrendingUp}   value={`${overallPct}%`}        label="Progress"   accent="#7b6fd4" delay={0.12} />
        </div>
      )}

      {/* ── Overall progress card ── */}
      {totalH > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            position: 'relative', borderRadius: '16px', padding: '14px 16px',
            marginBottom: '16px', background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)', overflow: 'hidden',
          }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(184,115,51,0.05) 0%, transparent 55%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.35), transparent)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Ring pct={overallPct} size={52} stroke={5} color="var(--color-primary)" done={overallPct === 100} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)' }}>Today's overall</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: overallPct === 100 ? '#6fcf8a' : 'var(--color-primary)' }}>{totalDone}/{totalH}</span>
              </div>
              <div style={{ height: '5px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: '99px', background: overallPct === 100 ? 'linear-gradient(90deg, #52a873, #6fcf8a)' : 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))' }}
                  initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '4px' }}>
                {overallPct === 100 ? '✦ Perfect day — every habit done'
                  : overallPct >= 50 ? 'Past halfway — keep pushing'
                  : overallPct > 0 ? 'Good start — more to go'
                  : 'Log habits on the Dashboard'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {goals.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 16px', textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>🎯</div>
            <div style={{ position: 'absolute', inset: '-8px', borderRadius: '28px', border: '1px solid rgba(184,115,51,0.15)', pointerEvents: 'none' }} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-warm-white)', marginBottom: '8px', letterSpacing: '-0.02em' }}>No goals yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-3)', maxWidth: '260px', lineHeight: 1.7, marginBottom: '20px' }}>
            Create goals like <span style={{ color: 'var(--color-text-2)' }}>"Get fit"</span> and group your daily habits under them to track big-picture progress.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: 'white', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))', border: '1px solid rgba(184,115,51,0.3)', cursor: 'pointer', boxShadow: '0 8px 24px rgba(184,115,51,0.22)' }}>
            <Plus size={15} /> Create your first goal
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {goals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} habits={habits} completedToday={completedToday} index={i} />
            ))}
          </AnimatePresence>

          {/* Ungrouped */}
          {ungrouped.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: goals.length * 0.04 + 0.08 }}
              style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', opacity: 0.8 }}>
              <div onClick={() => setShowUngrouped(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', fontSize: '15px' }}>📋</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-2)' }}>Ungrouped</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '1px' }}>{ungrouped.length} habit{ungrouped.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <motion.div animate={{ rotate: showUngrouped ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <ChevronDown size={13} style={{ color: 'var(--color-text-3)' }} />
                </motion.div>
              </div>
              <AnimatePresence>
                {showUngrouped && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {ungrouped.map(habit => {
                        const isDone = completedToday.has(habit.id);
                        return (
                          <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'rgba(52,138,85,0.2)' : 'var(--color-stone-mid)', border: `1px solid ${isDone ? 'rgba(82,168,115,0.3)' : 'var(--color-stone-light)'}` }}>
                              {isDone && <CheckCircle2 size={10} color="#6fcf8a" />}
                            </div>
                            <span style={{ flex: 1, fontSize: '12px', color: isDone ? 'rgba(111,207,138,0.55)' : 'var(--color-text-3)', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.title}</span>
                            {habit.current_streak > 0 && <span style={{ fontSize: '10px', color: 'var(--color-primary)', flexShrink: 0 }}>🔥{habit.current_streak}d</span>}
                            <span style={{ fontSize: '10px', color: 'var(--color-text-3)', background: 'var(--color-stone-mid)', padding: '2px 6px', borderRadius: '5px', border: '1px solid var(--color-border)', flexShrink: 0 }}>Ungrouped</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <AddGoalModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}