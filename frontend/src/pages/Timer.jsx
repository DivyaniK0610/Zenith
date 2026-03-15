import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, Timer as TimerIcon,
  Zap, Check, ChevronDown, Plus, Loader2, BrainCircuit,
} from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { logPomodoroSession } from '../api/habits';
import { useZenithSounds } from '../hooks/useSound';
import { toast } from 'sonner';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ── Timer modes ──────────────────────────────────────────────────────────────
const MODES = {
  focus:       { label: 'Focus',       duration: 25 * 60, color: 'var(--color-primary)',    bg: 'rgba(184,115,51,0.08)' },
  short_break: { label: 'Short Break', duration:  5 * 60, color: '#52a873',                bg: 'rgba(82,168,115,0.08)'  },
  long_break:  { label: 'Long Break',  duration: 15 * 60, color: '#7b9fd4',                bg: 'rgba(123,159,212,0.08)' },
};

// ── Format mm:ss ────────────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Circular SVG progress ring ────────────────────────────────────────────────
function ProgressRing({ progress, color, size, stroke }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-stone)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: 'linear' }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

// ── Session dot ───────────────────────────────────────────────────────────────
function SessionDot({ filled, color }) {
  return (
    <motion.div
      animate={{ scale: filled ? 1 : 0.6, opacity: filled ? 1 : 0.3 }}
      transition={{ duration: 0.2 }}
      style={{ width: '8px', height: '8px', borderRadius: '99px', background: filled ? color : 'var(--color-stone-light)', border: `1px solid ${filled ? color : 'transparent'}`, boxShadow: filled ? `0 0 6px ${color}80` : 'none' }}
    />
  );
}

// ── Habit selector ────────────────────────────────────────────────────────────
function HabitSelector({ habits, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const timerHabits = habits.filter(h => h.status !== 'archived' && h.status !== 'paused');
  const selectedHabit = timerHabits.find(h => h.id === selected);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', background: open ? 'var(--color-surface-2)' : 'var(--color-stone)', border: `1px solid ${open ? 'var(--color-primary-border)' : 'var(--color-border)'}`, color: 'var(--color-text-1)', fontSize: '13px', fontFamily: 'var(--font-sans)', transition: 'all 0.15s', minWidth: '200px', justifyContent: 'space-between' }}>
        <span style={{ color: selectedHabit ? 'var(--color-text-1)' : 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {selectedHabit ? selectedHabit.title : 'Log session to a habit…'}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={13} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.14 }}
            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40, borderRadius: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>

            <button onClick={() => { onSelect(null); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', fontSize: '12px', textAlign: 'left', cursor: 'pointer', background: !selected ? 'rgba(184,115,51,0.06)' : 'transparent', color: !selected ? 'var(--color-primary)' : 'var(--color-text-3)', borderBottom: '1px solid var(--color-border)', border: 'none', fontFamily: 'var(--font-sans)' }}
              onMouseEnter={e => { if (selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (selected) e.currentTarget.style.background = 'transparent'; }}>
              No habit — freestyle session
            </button>

            {timerHabits.map((h, i) => (
              <button key={h.id} onClick={() => { onSelect(h.id); setOpen(false); }}
                style={{ width: '100%', padding: '10px 14px', fontSize: '12px', textAlign: 'left', cursor: 'pointer', background: selected === h.id ? 'rgba(184,115,51,0.08)' : 'transparent', color: 'var(--color-text-2)', borderBottom: i < timerHabits.length - 1 ? '1px solid var(--color-border)' : 'none', border: 'none', fontFamily: 'var(--font-sans)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => { if (selected !== h.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (selected !== h.id) e.currentTarget.style.background = 'transparent'; }}>
                <span>{h.title}</span>
                {selected === h.id && <Check size={11} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Session log row ───────────────────────────────────────────────────────────
function SessionRow({ session, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderRadius: '10px', background: 'var(--color-stone)', border: '1px solid var(--color-border)', marginBottom: '6px' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(82,168,115,0.12)', border: '1px solid rgba(82,168,115,0.25)', flexShrink: 0 }}>
        <Check size={12} color="#6fcf8a" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.habitTitle || 'Freestyle session'}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
          {session.duration} min · {session.time}
        </div>
      </div>
      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
        +XP
      </span>
    </motion.div>
  );
}

// ── Main Timer Page ───────────────────────────────────────────────────────────
export default function Timer() {
  const { habits, loadHabits } = useHabitStore();
  const { playSuccess, playStreak } = useZenithSounds();

  const [mode,      setMode]      = useState('focus');
  const [timeLeft,  setTimeLeft]  = useState(MODES.focus.duration);
  const [running,   setRunning]   = useState(false);
  const [sessions,  setSessions]  = useState([]); // today's sessions
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [logging,   setLogging]   = useState(false);

  const timerRef  = useRef(null);
  const m         = MODES[mode];
  const progress  = 1 - timeLeft / m.duration;
  const SIZE      = 280;
  const STROKE    = 10;
  const sessionsToday = sessions.length;
  const focusSessions = sessions.filter(s => s.mode === 'focus');

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  // Switch mode resets timer
  const switchMode = (newMode) => {
    if (running) { clearInterval(timerRef.current); setRunning(false); }
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  // Tick
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          handleSessionComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, mode]);

  const handleSessionComplete = useCallback(async () => {
    const duration = Math.round(MODES[mode].duration / 60);
    playSuccess();

    if (mode === 'focus') {
      const habitTitle = habits.find(h => h.id === selectedHabit)?.title || null;
      const now = new Date();
      const newSession = {
        id: Date.now(), mode, duration,
        habitId: selectedHabit, habitTitle,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions(prev => [newSession, ...prev]);

      if (selectedHabit) {
        setLogging(true);
        try {
          await logPomodoroSession(selectedHabit, duration);
          toast(`✦ ${duration} min logged to "${habitTitle}"`, { duration: 3000 });
        } catch (_) {
          toast.error('Could not log session');
        } finally { setLogging(false); }
      } else {
        toast(`✦ ${duration} min focus session complete!`, { duration: 3000 });
      }
    } else {
      toast(`Break over — time to focus`, { duration: 2000 });
    }
  }, [mode, selectedHabit, habits, playSuccess]);

  const toggle = () => {
    if (timeLeft === 0) { setTimeLeft(m.duration); return; }
    setRunning(r => !r);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setTimeLeft(m.duration);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ paddingBottom: '40px' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <motion.h1 className="text-display"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          Focus Timer
        </motion.h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
          Pomodoro sessions that log directly to your habits
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── LEFT: Timer ── */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

          {/* Mode selector */}
          <div style={{ display: 'flex', gap: '6px', padding: '4px', background: 'var(--color-stone)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            {Object.entries(MODES).map(([key, mod]) => (
              <motion.button key={key} onClick={() => switchMode(key)} whileTap={{ scale: 0.96 }}
                style={{ padding: '7px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', background: mode === key ? 'var(--color-surface-2)' : 'transparent', color: mode === key ? mod.color : 'var(--color-text-3)', border: mode === key ? `1px solid ${mod.color}44` : '1px solid transparent', boxShadow: mode === key ? `0 2px 8px ${mod.color}20` : 'none', whiteSpace: 'nowrap' }}>
                {mod.label}
              </motion.button>
            ))}
          </div>

          {/* Ring + timer display */}
          <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', inset: '20px', borderRadius: '50%', background: `radial-gradient(circle, ${m.color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

            <ProgressRing progress={progress} color={m.color} size={SIZE} stroke={STROKE} />

            {/* Center content */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
              {/* Mode indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                {mode === 'focus' ? <BrainCircuit size={11} style={{ color: m.color }} /> : <Coffee size={11} style={{ color: m.color }} />}
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: m.color }}>{m.label}</span>
              </div>

              {/* Time */}
              <motion.div
                key={`${mode}-${Math.floor(timeLeft / 60)}`}
                initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '56px', fontWeight: 700, letterSpacing: '-0.04em', color: timeLeft === 0 ? m.color : 'var(--color-warm-white)', lineHeight: 1, textShadow: timeLeft === 0 ? `0 0 30px ${m.color}60` : 'none', transition: 'color 0.3s, text-shadow 0.3s' }}>
                {fmt(timeLeft)}
              </motion.div>

              {/* Progress label */}
              <span style={{ fontSize: '11px', color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Reset */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
              style={{ width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-stone-light)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-stone)'; e.currentTarget.style.color = 'var(--color-text-3)'; }}>
              <RotateCcw size={16} />
            </motion.button>

            {/* Play / Pause */}
            <motion.button
              whileTap={{ scale: 0.94 }} onClick={toggle}
              animate={{ scale: running ? [1, 0.97, 1] : 1 }}
              transition={{ duration: 0.3, repeat: running ? Infinity : 0, repeatDelay: 1.5 }}
              style={{ width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`, border: `1px solid ${m.color}66`, cursor: 'pointer', boxShadow: `0 8px 24px ${m.color}35`, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
              <AnimatePresence mode="wait">
                {running ? (
                  <motion.div key="pause" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Pause size={26} color="#fff" fill="#fff" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Play size={26} color="#fff" fill="#fff" style={{ marginLeft: '2px' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Session counter */}
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', gap: '1px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--color-warm-white)', lineHeight: 1 }}>{focusSessions.length}</span>
              <span style={{ fontSize: '8px', color: 'var(--color-text-3)', fontWeight: 600, letterSpacing: '0.05em' }}>TODAY</span>
            </div>
          </div>

          {/* Session dots (4 = one cycle) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[0, 1, 2, 3].map(i => (
              <SessionDot key={i} filled={i < focusSessions.length % 4 || (focusSessions.length > 0 && focusSessions.length % 4 === 0)} color={m.color} />
            ))}
            <span style={{ fontSize: '10px', color: 'var(--color-text-3)', marginLeft: '4px' }}>
              {focusSessions.length % 4 === 0 && focusSessions.length > 0 ? 'Long break earned!' : `${4 - (focusSessions.length % 4)} until long break`}
            </span>
          </div>

          {/* Habit selector */}
          <div style={{ width: '100%', maxWidth: '320px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={10} style={{ color: 'var(--color-primary)' }} />
              Log session to habit
            </div>
            <HabitSelector habits={habits} selected={selectedHabit} onSelect={setSelectedHabit} />
            {logging && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: 'var(--color-primary)' }}>
                <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                Logging session…
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Session log ── */}
        <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
            <TimerIcon size={13} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
              Today's sessions
            </span>
            {sessionsToday > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-primary)', background: 'rgba(184,115,51,0.1)', border: '1px solid rgba(184,115,51,0.2)', padding: '1px 7px', borderRadius: '99px' }}>
                {sessionsToday}
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: '32px 20px', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <TimerIcon size={24} style={{ color: 'var(--color-text-3)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0, lineHeight: 1.6 }}>
                Complete a focus session to see it logged here
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {sessions.map((s, i) => <SessionRow key={s.id} session={s} i={i} />)}
              </AnimatePresence>

              {/* Summary */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ marginTop: '12px', padding: '14px', borderRadius: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-primary-border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>Daily summary</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Focus time', value: `${focusSessions.reduce((s, sess) => s + sess.duration, 0)} min` },
                    { label: 'Sessions',   value: focusSessions.length },
                    { label: 'Habits hit', value: [...new Set(focusSessions.filter(s => s.habitId).map(s => s.habitId))].length },
                    { label: 'Cycles',     value: Math.floor(focusSessions.length / 4) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--color-stone)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--color-warm-white)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginTop: '4px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Tips */}
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '14px', background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <BrainCircuit size={11} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>Pomodoro technique</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { n: '1', t: '25 min deep work, no distractions' },
                { n: '2', t: '5 min short break — stand, stretch' },
                { n: '3', t: 'After 4 sessions: 15 min long break' },
              ].map(({ n, t }) => (
                <div key={n} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-primary)', opacity: 0.7, flexShrink: 0, paddingTop: '2px' }}>{n}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-3)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}