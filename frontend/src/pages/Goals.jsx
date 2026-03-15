import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore } from '../store/habitStore';
import { Plus, Trash2, Target, ChevronDown, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

const EMOJI_OPTIONS = ['🎯','💪','📚','🏃','🧘','💤','🥗','💻','🎨','🎵','✍️','🌿'];

function AddGoalModal({ isOpen, onClose }) {
  const { addGoal } = useHabitStore();
  const [form, setForm] = useState({ title: '', description: '', emoji: '🎯', target_date: '' });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await addGoal({ ...form, user_id: USER_ID, target_date: form.target_date || null });
      setForm({ title: '', description: '', emoji: '🎯', target_date: '' });
      onClose();
    } catch (_) {}
    finally { setBusy(false); }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%', background: 'var(--color-stone)', border: '1px solid var(--color-border)',
    borderRadius: '10px', padding: '10px 14px', color: 'var(--color-text-1)',
    fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', lineHeight: '1.5',
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.3), transparent)' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-warm-white)', margin: 0 }}>New goal</h2>
                <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px', marginBottom: 0 }}>Group habits under a bigger objective</p>
              </div>
              <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>

            <div style={{ height: '1px', background: 'var(--color-border)' }} />

            <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Emoji picker */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOJI_OPTIONS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setForm({ ...form, emoji })}
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px', fontSize: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        background: form.emoji === emoji ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)',
                        border: `1px solid ${form.emoji === emoji ? 'rgba(184,115,51,0.4)' : 'var(--color-border)'}`,
                        transition: 'all 0.15s',
                      }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>Goal name</label>
                <input autoFocus required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Get fit, Read more, Build a routine"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                  Description <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(optional)</span>
                </label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What does achieving this mean to you?"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Target date */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                  Target date <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.7 }}>(optional)</span>
                </label>
                <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', color: 'white', fontWeight: 500,
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
                  opacity: busy ? 0.6 : 1, boxShadow: '0 4px 16px rgba(184,115,51,0.2)',
                  border: '1px solid rgba(184,115,51,0.3)', cursor: busy ? 'not-allowed' : 'pointer',
                }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Create goal'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function GoalCard({ goal, habits, completedToday }) {
  const { removeGoal, unassignHabit } = useHabitStore();
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const goalHabits    = habits.filter(h => h.macro_goal_id === goal.id);
  const activeHabits  = goalHabits.filter(h => h.status !== 'paused');
  const doneCount     = activeHabits.filter(h => completedToday.has(h.id)).length;
  const totalActive   = activeHabits.length;
  const pct           = totalActive > 0 ? Math.round((doneCount / totalActive) * 100) : 0;
  const allDone       = totalActive > 0 && doneCount === totalActive;

  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date) - new Date()) / 86400000)
    : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="relative rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-surface-2)', border: `1px solid ${allDone ? 'rgba(82,168,115,0.2)' : 'var(--color-border)'}` }}>

      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${allDone ? 'rgba(82,168,115,0.3)' : 'rgba(184,115,51,0.2)'}, transparent)` }} />

      {/* Goal header */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Emoji */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
          {goal.emoji || '🎯'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-warm-white)', letterSpacing: '-0.01em' }}>
              {goal.title}
            </span>
            {allDone && totalActive > 0 && (
              <span style={{ fontSize: '10px', color: '#6fcf8a', background: 'rgba(82,168,115,0.1)', border: '1px solid rgba(82,168,115,0.2)', padding: '2px 6px', borderRadius: '99px', fontWeight: 600 }}>
                ✦ Today done
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div style={{ flex: 1, height: '3px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: allDone ? '#6fcf8a' : 'var(--color-primary)', borderRadius: '99px' }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: allDone ? '#6fcf8a' : 'var(--color-text-3)', flexShrink: 0 }}>
              {doneCount}/{totalActive}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {goal.description && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>{goal.description}</span>
            )}
            {daysLeft !== null && (
              <span style={{ fontSize: '10px', color: daysLeft < 7 ? '#f87171' : 'var(--color-text-3)', fontWeight: 500 }}>
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-text-3)', background: 'transparent', border: '1px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)'; }}>
              <Trash2 size={12} />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button onClick={() => removeGoal(goal.id)}
                style={{ fontSize: '10px', fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ fontSize: '10px', color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          <button onClick={() => setExpanded(o => !o)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--color-text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Habits under this goal */}
      <AnimatePresence>
        {expanded && goalHabits.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {goalHabits.map(habit => {
                const done = completedToday.has(habit.id);
                return (
                  <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--color-stone)', border: `1px solid ${done ? 'rgba(82,168,115,0.15)' : 'var(--color-border)'}` }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: done ? 'rgba(52,138,85,0.15)' : 'var(--color-stone-mid)', border: `1px solid ${done ? 'rgba(82,168,115,0.3)' : 'var(--color-stone-light)'}` }}>
                      {done && <CheckCircle2 size={11} color="#6fcf8a" />}
                    </div>
                    <span style={{ flex: 1, fontSize: '12px', color: done ? 'rgba(111,207,138,0.6)' : 'var(--color-text-2)', textDecorationLine: done ? 'line-through' : 'none' }}>
                      {habit.title}
                    </span>
                    {habit.status === 'paused' && (
                      <span style={{ fontSize: '9px', color: 'var(--color-text-3)', background: 'var(--color-stone-mid)', border: '1px solid var(--color-border)', padding: '1px 5px', borderRadius: '4px' }}>
                        Paused
                      </span>
                    )}
                    <button onClick={() => unassignHabit(habit.id)}
                      style={{ color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-3)'; }}
                      title="Remove from goal">
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        {expanded && goalHabits.length === 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-3)' }}>
              No habits linked yet — assign habits from the Dashboard
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Goals() {
  const { habits, goals, loadGoals, completedToday, loadHabits } = useHabitStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadGoals(USER_ID);
    loadHabits(USER_ID);
  }, [loadGoals, loadHabits]);

  const ungroupedHabits = habits.filter(h => !h.macro_goal_id && h.status !== 'paused');
  const totalHabits     = habits.filter(h => h.status !== 'paused').length;
  const totalDone       = habits.filter(h => h.status !== 'paused' && completedToday.has(h.id)).length;
  const overallPct      = totalHabits > 0 ? Math.round((totalDone / totalHabits) * 100) : 0;

  return (
    <motion.div className="space-y-5 pb-8"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display">Goals</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
            Big objectives broken into daily habits
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-sm mt-1"
          style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)', letterSpacing: '-0.01em', flexShrink: 0 }}>
          <Plus size={13} />
          New goal
        </motion.button>
      </div>

      {/* Overall progress bar */}
      {totalHabits > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
              Today's overall progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: overallPct === 100 ? '#6fcf8a' : 'var(--color-primary)' }}>
              {totalDone}/{totalHabits} habits
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: overallPct === 100 ? '#6fcf8a' : 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))', borderRadius: '99px' }}
              initial={{ width: 0 }} animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '6px' }}>
            {overallPct === 100 ? '✦ Perfect day — all habits complete' : `${overallPct}% complete`}
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl"
            style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
            🎯
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-1)', marginBottom: '6px' }}>No goals yet</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', maxWidth: '260px', lineHeight: 1.6 }}>
            Create a goal like "Get fit" or "Read more" and group your habits under it.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} habits={habits} completedToday={completedToday} />
            ))}
          </AnimatePresence>

          {/* Ungrouped habits */}
          {ungroupedHabits.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', opacity: 0.7 }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                  Ungrouped habits
                </span>
              </div>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ungroupedHabits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
                    <span style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-2)' }}>{habit.title}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>Not assigned</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <AddGoalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}