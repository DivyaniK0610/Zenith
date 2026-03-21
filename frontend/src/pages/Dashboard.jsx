import React, { useEffect, useState, useCallback } from 'react';
import { useHabitStore } from '../store/habitStore';
import HabitCard from '../components/dashboard/HabitCard';
import AddHabitModal from '../components/dashboard/AddHabitModal';
import AchievementOverlay from '../components/gamification/AchievementOverlay';
import XPBar from '../components/gamification/XPBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Sparkles, ChevronDown, Flame, CheckCircle2,
  Trophy, Zap, Archive, Target, Check, Bell, BellOff,
  ListTodo, Trash2, AlarmClock,
} from 'lucide-react';
import apiClient from '../api/client';
import { toast } from 'sonner';
import { useZenithSounds } from '../hooks/useSound';
import ZenithDateTimePicker from '../components/ZenithDateTimePicker';
import { demoTriggerCallbacks } from '../App';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// Default reminders — pure UI state, no backend needed for demo
const DEFAULT_REMINDERS = [
  { id: 'r1', label: 'Morning check-in',  time: '08:00 AM', enabled: true  },
  { id: 'r2', label: 'Log habits',        time: '09:00 PM', enabled: true  },
  { id: 'r3', label: 'Weekly review',     time: 'Sun 7:00 PM', enabled: false },
];

// Test achievement panel (demo only)
const TEST_ACHIEVEMENTS = [
  { label: '⚡ Level Up overlay',    data: { type: 'level_up', level: 5, old_level: 4, total_xp: 450, message: 'You reached Level 5!' } },
  { label: '🔥 7-day streak reward', data: { type: 'streak', current_streak: 7,  xp_gained: 60,  milestone_bonus: 50,  message: 'Consistency is the only cheat code.' } },
  { label: '🔥 30-day streak reward',data: { type: 'streak', current_streak: 30, xp_gained: 210, milestone_bonus: 200, message: 'On fire. 30 days straight.' } },
];

function TestPanel({ onTrigger }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative md:block hidden">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{ background: open ? 'rgba(184,115,51,0.15)' : 'rgba(184,115,51,0.08)', color: 'var(--color-primary)', borderColor: open ? 'rgba(184,115,51,0.4)' : 'var(--color-primary-border)' }}
      >
        <Sparkles size={11} />
        Demo
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={10} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }} transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden z-30"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-primary-border)', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-3)' }}>Feature demos</span>
              </div>
              {TEST_ACHIEVEMENTS.map(({ label, data }, i) => (
                <motion.button key={label} onClick={() => { onTrigger(data); setOpen(false); }}
                  whileHover={{ x: 3 }} transition={{ duration: 0.1 }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2.5"
                  style={{ color: 'var(--color-text-2)', fontSize: '12px', borderBottom: i < TEST_ACHIEVEMENTS.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '13px' }}>{label.split(' ')[0]}</span>
                  <span>{label.split(' ').slice(1).join(' ')}</span>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
        <Sparkles size={18} style={{ color: 'var(--color-text-3)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-1)', letterSpacing: '-0.01em' }}>No habits yet</h3>
      <p className="text-xs max-w-xs mb-6 leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
        Start tracking your first habit to build streaks, earn XP, and level up.
      </p>
      <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))', boxShadow: '0 4px 16px rgba(184,115,51,0.2)', border: '1px solid rgba(184,115,51,0.3)' }}>
        <Plus size={14} />
        Create your first habit
      </motion.button>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }} />;
}

// Section divider with collapsible toggle
function SectionToggle({ icon: Icon, label, count, open, onToggle, accent = 'var(--color-text-3)' }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2"
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }} />
      <div className="flex items-center gap-1.5 px-2">
        <Icon size={11} style={{ color: accent }} />
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>
          {label}
        </span>
        {count > 0 && (
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: accent, opacity: 0.7 }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ height: '1px', flex: 1, background: 'var(--color-border)' }} />
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
        style={{ display: 'flex', color: 'var(--color-text-3)', marginLeft: '4px' }}>
        <ChevronDown size={11} />
      </motion.span>
    </button>
  );
}

// Tasks section
function TasksSection({ onSetReminder }) {
  const [tasks, setTasks] = useState(() => {
      try { return JSON.parse(localStorage.getItem('zenith_tasks')) || []; }
      catch { return []; }
    });

    useEffect(() => {
      localStorage.setItem('zenith_tasks', JSON.stringify(tasks));
    }, [tasks]);
  const [input, setInput]     = useState('');
  const [focused, setFocused] = useState(false);

  const { playSuccess } = useZenithSounds();
  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    playSuccess();
    setTasks(prev => [...prev, { id: Date.now(), text, done: false }]);
    setInput('');
  };

  const toggleTask = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const pending   = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

      {/* Inline add input */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 12px',
          borderRadius: '12px',
          background: focused ? 'var(--color-surface-2)' : 'var(--color-stone)',
          border: `1px solid ${focused ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
          transition: 'all 0.15s',
        }}
      >
        <Plus size={12} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Add a task…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '13px', color: 'var(--color-text-1)',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <AnimatePresence>
          {input.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={addTask} whileTap={{ scale: 0.9 }}
              style={{
                width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-primary)', border: 'none', cursor: 'pointer',
              }}
            >
              <Check size={11} color="white" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Pending tasks */}
      <AnimatePresence mode="popLayout">
        {pending.map((task, i) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10, scale: 0.97 }}
            transition={{ duration: 0.18, delay: i * 0.03 }}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleTask(task.id)}
              style={{
                width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-stone)', border: '1px solid var(--color-stone-light)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(82,168,115,0.5)'; e.currentTarget.style.background = 'rgba(82,168,115,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-stone-light)'; e.currentTarget.style.background = 'var(--color-stone)'; }}
            />
            <span style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-1)' }}>
              {task.text}
            </span>
            <motion.button
              initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: '2px', display: 'flex', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
            >
              <Trash2 size={11} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Completed tasks */}
      <AnimatePresence>
        {completed.map(task => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'transparent', border: '1px solid var(--color-border)', opacity: 0.5 }}
          >
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleTask(task.id)}
              style={{
                width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(82,168,115,0.15)', border: '1px solid rgba(82,168,115,0.3)',
                cursor: 'pointer',
              }}
            >
              <Check size={10} color="#6fcf8a" strokeWidth={2.5} />
            </motion.button>
            <span style={{
              flex: 1, fontSize: '13px', color: 'var(--color-text-3)',
              textDecoration: 'line-through', textDecorationColor: 'rgba(111,207,138,0.35)',
            }}>
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: '2px', display: 'flex' }}
            >
              <Trash2 size={11} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {tasks.length === 0 && (
        <p style={{ fontSize: '11px', color: 'var(--color-text-3)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
          No tasks for today
        </p>
      )}
    </div>
  );
}

// Reminders section
function RemindersSection() {
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zenith_reminders')) || DEFAULT_REMINDERS; }
    catch { return DEFAULT_REMINDERS; }
  });
  const [adding, setAdding]   = useState(false);
  const [label, setLabel]     = useState('');

  useEffect(() => {
    localStorage.setItem('zenith_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const { playToggleOn, playToggleOff } = useZenithSounds();

  const toggle = (id) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      r.enabled ? playToggleOff() : playToggleOn();
      return { ...r, enabled: !r.enabled };
    }));
  };

  const deleteReminder = (id) =>
    setReminders(prev => prev.filter(r => r.id !== id));

  const handlePickerConfirm = (displayTime) => {
    if (!label.trim()) return;
    playToggleOn();
    setReminders(prev => [...prev, {
      id: `r${Date.now()}`, label: label.trim(),
      time: displayTime, enabled: true,
    }]);
    setLabel('');
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {reminders.map((r, i) => (
        <motion.div
          key={r.id}
          layout
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{
            background: r.enabled ? 'var(--color-surface-2)' : 'transparent',
            border: `1px solid var(--color-border)`,
            opacity: r.enabled ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: r.enabled ? 'rgba(184,115,51,0.1)' : 'var(--color-stone)',
            border: `1px solid ${r.enabled ? 'rgba(184,115,51,0.2)' : 'var(--color-border)'}`,
            transition: 'all 0.2s',
          }}>
            <AlarmClock size={12} style={{ color: r.enabled ? 'var(--color-primary)' : 'var(--color-text-3)' }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-1)' }}>{r.label}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>{r.time}</div>
          </div>

          {/* Delete on hover */}
          <button
            onClick={() => deleteReminder(r.id)}
            className="opacity-0 group-hover:opacity-100"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: '2px', display: 'flex', transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
          >
            <Trash2 size={11} />
          </button>

          {/* Toggle pill */}
          <motion.button onClick={() => toggle(r.id)} whileTap={{ scale: 0.92 }}
            style={{
              width: '36px', height: '20px', borderRadius: '99px', flexShrink: 0,
              position: 'relative', cursor: 'pointer', border: 'none',
              background: r.enabled ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone-mid)',
              transition: 'background 0.2s',
              boxShadow: r.enabled ? '0 0 8px rgba(184,115,51,0.3)' : 'none',
            }}
          >
            <motion.div animate={{ x: r.enabled ? 18 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '99px', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </motion.button>
        </motion.div>
      ))}

      {/* Add reminder flow */}
      <AnimatePresence mode="wait">
        {!adding ? (
          <motion.button key="add-btn"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              width: '100%', padding: '8px', borderRadius: '10px',
              fontSize: '11px', color: 'var(--color-text-3)', background: 'transparent',
              border: '1px dashed var(--color-border)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary-border)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-3)'; }}
          >
            <Bell size={11} /> Add reminder
          </motion.button>
        ) : (
          <motion.div key="picker"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            {/* Label input first */}
            <input
              autoFocus value={label} onChange={e => setLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setLabel(''); } }}
              placeholder="Reminder label…"
              style={{
                background: 'var(--color-stone)', border: '1px solid var(--color-border)',
                borderRadius: '10px', padding: '9px 12px', color: 'var(--color-text-1)',
                fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            {/* Custom date/time picker */}
            <ZenithDateTimePicker
              onConfirm={handlePickerConfirm}
              onCancel={() => { setAdding(false); setLabel(''); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textAlign: 'center', padding: '4px 0', opacity: 0.6 }}>
        Browser notifications — enable in settings
      </p>
    </div>
  );
}

// Right panel stat block
function StatBlock({ icon: Icon, label, value, accent, accentBg, accentBorder, iconFill }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'var(--color-stone)', border: `1px solid ${accentBorder}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
        <Icon size={14} style={{ color: accent }} fill={iconFill ? accent : 'none'} strokeWidth={iconFill ? 0 : 2} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '3px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// Right panel
function RightPanel({ habits, userStats, completedToday, allDone, completedCount }) {
  const activeCount   = habits.filter(h => h.status !== 'paused').length;
  const completionPct = activeCount > 0 ? Math.round((completedCount / activeCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress + XP — unified card */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.25), transparent)' }} />

        {/* Ring row */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="var(--color-stone)" strokeWidth="5" />
              <motion.circle
                cx="36" cy="36" r="28" fill="none"
                stroke={allDone ? '#6fcf8a' : 'var(--color-primary)'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - completionPct / 100) }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                transform="rotate(-90 36 36)"
                style={{ filter: allDone ? 'drop-shadow(0 0 5px rgba(111,207,138,0.5))' : 'drop-shadow(0 0 4px rgba(184,115,51,0.35))' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: allDone ? '#6fcf8a' : 'var(--color-warm-white)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {completionPct}%
              </span>
            </div>
          </div>

          {/* Right of ring */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
                Today's Progress
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: allDone ? '#6fcf8a' : 'var(--color-primary)' }}>
                {completedCount}/{activeCount}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-3)', lineHeight: 1.5, marginBottom: '10px' }}>
              {allDone ? '🌿 Every habit done today' : completedCount === 0 ? 'Start with your easiest habit' : `${activeCount - completedCount} habit${activeCount - completedCount !== 1 ? 's' : ''} left`}
            </p>
            {allDone && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '99px', background: 'rgba(82,168,115,0.1)', border: '1px solid rgba(82,168,115,0.2)' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6fcf8a' }}>✦ Perfect day</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* XP bar — inset at bottom of same card */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 18px 14px' }}>
          <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} compact />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatBlock icon={Flame}        label="Streak" value={`${userStats?.current_streak || 0}d`} accent="#e07830" accentBg="rgba(224,120,48,0.1)"  accentBorder="rgba(224,120,48,0.18)"  iconFill />
        <StatBlock icon={CheckCircle2} label="Habits" value={habits.length}                         accent="#52a873" accentBg="rgba(82,168,115,0.1)"  accentBorder="rgba(82,168,115,0.18)"  iconFill={false} />
        <StatBlock icon={Trophy}       label="Best"   value={`${userStats?.longest_streak || 0}d`} accent="#c9a43a" accentBg="rgba(201,164,58,0.1)"  accentBorder="rgba(201,164,58,0.18)"  iconFill={false} />
        <StatBlock icon={Zap}          label="Level"  value={userStats?.level || 1}                accent="#b87333" accentBg="rgba(184,115,51,0.1)"  accentBorder="rgba(184,115,51,0.18)"  iconFill />
      </div>

      {/* Quick tip */}
      <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'var(--color-stone)', border: '1px solid rgba(184,115,51,0.18)' }}>
        <div style={{ position: 'absolute', left: 0, top: '10px', bottom: '10px', width: '3px', borderRadius: '0 3px 3px 0', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dim))', opacity: 0.7 }} />
        <div className="flex items-center gap-2 mb-2">
          <Target size={11} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
            Daily tip
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          {completedCount === 0
            ? 'Start with your easiest habit to build momentum.'
            : completedCount < habits.length / 2
            ? "You're building momentum. Keep the chain going."
            : allDone
            ? "Every habit done. You've earned your streak today."
            : "Past halfway. Don't break the chain now."}
        </p>
      </div>
    </div>
  );
}

// Main Dashboard
export default function Dashboard() {
  const { habits, isLoading, error, loadHabits, userStats, completedToday, fetchArchivedHabits } = useHabitStore();

  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [achievement,     setAchievement]     = useState(null);
  const [showArchived,    setShowArchived]     = useState(false);
  const [archivedHabits,  setArchivedHabits]  = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showTasks,       setShowTasks]       = useState(true);
  const [showReminders,   setShowReminders]   = useState(true);
  const [showCompleted,   setShowCompleted]   = useState(false);

  const activeHabits    = habits.filter(h => h.status !== 'paused');
  const pausedHabits    = habits.filter(h => h.status === 'paused');
  const pendingHabits   = activeHabits.filter(h => !completedToday.has(h.id));
  const completedHabits = activeHabits.filter(h => completedToday.has(h.id));
  const completedCount  = completedHabits.length;
  const today           = new Date();
  const allDone         = activeHabits.length > 0 && completedCount === activeHabits.length;
  const [showAllPending, setShowAllPending] = useState(false);

  const { playModalOpen } = useZenithSounds();

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAchievement  = useCallback((data) => setAchievement(data), []);
  const dismissAchievement = useCallback(() => setAchievement(null), []);

  // Register with the global callback so the Demo button in the
  // mobile top bar (App.jsx) can trigger overlays from any route.
  useEffect(() => {
    demoTriggerCallbacks.current = handleAchievement;
    return () => { demoTriggerCallbacks.current = null; };
  }, [handleAchievement]);

  const greeting = (() => {
    const h = today.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <motion.h1 className="text-display"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </motion.h1>
          <motion.p style={{ color: 'var(--color-text-3)', fontSize: '12px', marginTop: '2px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
            {greeting} · {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <TestPanel onTrigger={handleAchievement} />
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => { playModalOpen(); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-sm"
            style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)', letterSpacing: '-0.01em' }}
          >
            <Plus size={13} />
            Add Habit
            <span style={{ fontSize: '9px', opacity: 0.5, background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)', marginLeft: '2px' }}>N</span>
          </motion.button>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT: Main content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Mobile-only XP + stats */}
          <div className="md:hidden space-y-3">
            <XPBar xp={userStats?.xp || 0} level={userStats?.level || 1} />
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Flame,        label: 'Streak', value: `${userStats?.current_streak || 0}d`, accent: '#e07830', accentBg: 'rgba(224,120,48,0.1)', accentBorder: 'rgba(224,120,48,0.18)', iconFill: true  },
                { icon: CheckCircle2, label: 'Habits', value: habits.length,                         accent: '#52a873', accentBg: 'rgba(82,168,115,0.1)', accentBorder: 'rgba(82,168,115,0.18)', iconFill: false },
                { icon: Trophy,       label: 'Best',   value: `${userStats?.longest_streak || 0}d`, accent: '#c9a43a', accentBg: 'rgba(201,164,58,0.1)', accentBorder: 'rgba(201,164,58,0.18)', iconFill: false },
                { icon: Zap,          label: 'Level',  value: userStats?.level || 1,                accent: '#b87333', accentBg: 'rgba(184,115,51,0.1)', accentBorder: 'rgba(184,115,51,0.18)', iconFill: true  },
              ].map(({ icon: Icon, label, value, accent, accentBg, accentBorder, iconFill }) => (
                <div key={label} className="flex-1 relative rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-surface-2)', border: `1px solid ${accentBorder}` }}>
                  <div className="flex items-center gap-2 px-2.5 py-2.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
                      <Icon size={10} style={{ color: accent }} fill={iconFill ? accent : 'none'} strokeWidth={iconFill ? 0 : 2} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
                      <div style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '2px' }}>{label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Habits section header ── */}
          <div className="flex items-center justify-between">
            <span className="text-subheading">Today's Habits</span>
            {habits.length > 0 && !isLoading && (
              <motion.div key={completedCount} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5">
                {allDone && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, rgba(82,168,115,0.15), rgba(52,138,85,0.08))', color: '#6fcf8a', border: '1px solid rgba(82,168,115,0.25)', boxShadow: '0 0 12px rgba(82,168,115,0.1)' }}>
                    <span style={{ fontSize: '10px' }}>✦</span>
                    Perfect day
                  </motion.span>
                )}
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: allDone ? '#6fcf8a' : 'var(--color-text-3)' }}>
                  {completedCount}/{activeHabits.length}
                </span>
              </motion.div>
            )}
          </div>

          {/* ── Habit list ── */}
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
          ) : error ? (
            <div className="p-4 rounded-2xl text-xs"
              style={{ background: 'rgba(220,60,60,0.06)', border: '1px solid rgba(220,60,60,0.15)', color: '#f87171' }}>
              {error}
            </div>
          ) : habits.length === 0 ? (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence mode="popLayout">
                  {(showAllPending ? pendingHabits : pendingHabits.slice(0, 4)).map((habit, i) => (
                    <motion.div key={habit.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                      <HabitCard habit={habit} onAchievement={handleAchievement} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {pendingHabits.length > 4 && (
                  <button
                    onClick={() => setShowAllPending(o => !o)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', padding: '8px', borderRadius: '12px', cursor: 'pointer',
                      background: 'transparent',
                      color: 'var(--color-text-3)', fontSize: '11px', fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {  e.currentTarget.style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => {  e.currentTarget.style.color = 'var(--color-text-3)'; }}
                  >
                    <motion.div animate={{ rotate: showAllPending ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown size={12} />
                    </motion.div>
                    {showAllPending ? 'Show less' : `${pendingHabits.length - 4} more habits`}
                  </button>
                )}
              {pausedHabits.length > 0 && (
                <div className="space-y-2">
                  {pausedHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} onAchievement={handleAchievement} />
                  ))}
                </div>
              )}

              {completedHabits.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  {/* Collapsed by default — keeps Tasks & Reminders in viewport */}
                  <button
                    onClick={() => setShowCompleted(o => !o)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', marginTop: '20px',
                      borderRadius: '12px', cursor: 'pointer',
                      background: showCompleted ? 'rgba(82,168,115,0.05)' : 'transparent',
                      border: `1px solid ${showCompleted ? 'rgba(82,168,115,0.15)' : 'var(--color-border)'}`,
                      transition: 'all 0.18s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(82,168,115,0.15)', border: '1px solid rgba(82,168,115,0.2)',
                      }}>
                        <CheckCircle2 size={11} style={{ color: '#6fcf8a' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#6fcf8a' }}>
                        {completedHabits.length} completed
                      </span>
                      {allDone && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, color: '#6fcf8a',
                          background: 'rgba(82,168,115,0.12)', border: '1px solid rgba(82,168,115,0.2)',
                          padding: '1px 7px', borderRadius: '99px',
                        }}>
                          ✦ Perfect day
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: showCompleted ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ color: 'var(--color-text-3)', display: 'flex', flexShrink: 0 }}
                    >
                      <ChevronDown size={13} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showCompleted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
>
  <div className="space-y-2" style={{ paddingTop: '2px', paddingBottom: '12px' }}>
                          <AnimatePresence mode="popLayout">
                            {completedHabits.map(habit => (
                              <HabitCard key={habit.id} habit={habit} onAchievement={handleAchievement} />
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Tasks section ── */}
          <div>
            <SectionToggle
              icon={ListTodo}
              label="Tasks"
              count={0}
              open={showTasks}
              onToggle={() => setShowTasks(o => !o)}
              accent="var(--color-text-3)"
            />
            <AnimatePresence>
              {showTasks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '8px' }}>
                    <TasksSection onSetReminder={() => setShowReminders(true)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Reminders section ── */}
          <div>
            <SectionToggle
              icon={Bell}
              label="Reminders"
              count={DEFAULT_REMINDERS.filter(r => r.enabled).length}
              open={showReminders}
              onToggle={() => setShowReminders(o => !o)}
              accent="var(--color-text-3)"
            />
            <AnimatePresence>
              {showReminders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '8px' }}>
                    <RemindersSection />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Archived habits ── */}
          <div>
            <SectionToggle
              icon={Archive}
              label="Archived"
              count={0}
              open={showArchived}
              onToggle={async () => {
                if (!showArchived) {
                  setLoadingArchived(true);
                  const data = await fetchArchivedHabits(USER_ID);
                  setArchivedHabits(data);
                  setLoadingArchived(false);
                }
                setShowArchived(o => !o);
              }}
              accent="var(--color-text-3)"
            />
            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '8px' }}>
                    {loadingArchived ? (
                      <div className="py-4 text-center" style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>Loading...</div>
                    ) : archivedHabits.length === 0 ? (
                      <div className="py-4 text-center" style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>No archived habits</div>
                    ) : (
                      <div className="space-y-2">
                        {archivedHabits.map(habit => (
                          <div key={habit.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                            style={{ background: 'var(--color-stone)', border: '1px solid var(--color-border)', opacity: 0.6 }}>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{habit.title}</span>
                            <button
                              onClick={async () => {
                                await apiClient.patch(`/api/v1/habits/${habit.id}`, { status: 'active' });
                                setArchivedHabits(prev => prev.filter(h => h.id !== habit.id));
                                loadHabits(USER_ID);
                                toast('Habit restored', { duration: 2000 });
                              }}
                              style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>{/* end LEFT */}

        {/* ── RIGHT: Stats panel (desktop only) ── */}
        <div className="hidden md:block flex-shrink-0 sticky top-6" style={{ width: '260px' }}>
          <RightPanel
            habits={habits}
            userStats={userStats}
            completedToday={completedToday}
            allDone={allDone}
            completedCount={completedCount}
          />
        </div>

      </div>{/* end two-column */}

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={USER_ID} />
      <AchievementOverlay achievement={achievement} onClose={dismissAchievement} />
    </motion.div>
  );
}
