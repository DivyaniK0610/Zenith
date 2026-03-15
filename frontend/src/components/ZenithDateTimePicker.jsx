import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const HOURS  = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINS   = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ─────────────────────────────────────────────────────────────────────────────
// Drum roller — a single scrollable column of values
// ─────────────────────────────────────────────────────────────────────────────
const ITEM_H = 36;
const VISIBLE = 5;

function DrumRoller({ values, selected, onChange, width = 64 }) {
  const idx         = values.indexOf(selected);
  const [offset, setOffset] = useState(-idx * ITEM_H);
  const startY      = useRef(null);
  const startOffset = useRef(null);
  const containerH  = ITEM_H * VISIBLE;
  const centerY     = Math.floor(VISIBLE / 2) * ITEM_H;

  const snap = useCallback((raw) => {
    const clamped = Math.min(0, Math.max(-(values.length - 1) * ITEM_H, raw));
    const snapped = -Math.round(-clamped / ITEM_H) * ITEM_H;
    return snapped;
  }, [values.length]);

  const commitOffset = useCallback((raw) => {
    const s = snap(raw);
    setOffset(s);
    const newIdx = Math.round(-s / ITEM_H);
    onChange(values[Math.max(0, Math.min(values.length - 1, newIdx))]);
  }, [snap, onChange, values]);

  // Sync when selected changes externally
  useEffect(() => {
    const i = values.indexOf(selected);
    if (i !== -1) setOffset(-i * ITEM_H);
  }, [selected, values]);

  const onPointerDown = (e) => {
    startY.current      = e.clientY;
    startOffset.current = offset;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (startY.current === null) return;
    const delta = e.clientY - startY.current;
    setOffset(Math.min(0, Math.max(-(values.length - 1) * ITEM_H, startOffset.current + delta)));
  };

  const onPointerUp = () => {
    commitOffset(offset);
    startY.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    commitOffset(offset - Math.sign(e.deltaY) * ITEM_H);
  };

  const currentIdx = Math.round(-offset / ITEM_H);

  return (
    <div
      style={{
        width, height: containerH, position: 'relative',
        overflow: 'hidden', cursor: 'grab', userSelect: 'none', flexShrink: 0,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      {/* Top fade */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '40%', background: 'linear-gradient(to bottom, var(--color-surface-2), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Bottom fade */}
      <div style={{ position: 'absolute', inset: 'auto 0 0 0', height: '40%', background: 'linear-gradient(to top, var(--color-surface-2), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      {/* Selection highlight */}
      <div style={{
        position: 'absolute', left: '4px', right: '4px',
        top: centerY, height: ITEM_H,
        borderRadius: '8px',
        background: 'rgba(184,115,51,0.12)',
        border: '1px solid rgba(184,115,51,0.25)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Items */}
      <motion.div
        style={{ position: 'absolute', top: centerY, left: 0, right: 0 }}
        animate={{ y: offset }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
      >
        {values.map((v, i) => {
          const dist    = Math.abs(i - currentIdx);
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : 0.2;
          const scale   = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76;
          return (
            <div
              key={v}
              onClick={() => { setOffset(-i * ITEM_H); onChange(v); }}
              style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: dist === 0 ? 700 : 400,
                color: dist === 0 ? 'var(--color-primary)' : 'var(--color-text-2)',
                opacity, transform: `scale(${scale})`,
                transition: 'opacity 0.15s, transform 0.15s',
                cursor: 'pointer',
              }}
            >
              {v}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time picker — hour / minute / AM/PM drum rollers
// ─────────────────────────────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const [h, setH]       = useState(value?.h   || '08');
  const [m, setM]       = useState(value?.m   || '00');
  const [ampm, setAmpm] = useState(value?.ampm || 'AM');

  const emit = (nh, nm, na) => onChange({ h: nh, m: nm, ampm: na });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '4px', padding: '8px 0',
    }}>
      <DrumRoller values={HOURS} selected={h}    onChange={v => { setH(v);    emit(v, m, ampm); }} width={56} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px' }}>:</span>
      <DrumRoller values={MINS}  selected={m}    onChange={v => { setM(v);    emit(h, v, ampm); }} width={56} />
      <DrumRoller values={['AM','PM']} selected={ampm} onChange={v => { setAmpm(v); emit(h, m, v); }} width={52} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar — mini month grid
// ─────────────────────────────────────────────────────────────────────────────
function Calendar({ value, onChange }) {
  const today        = new Date();
  const [viewYear,  setViewYear]  = useState(value?.year  || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.month || today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) => d && value?.day === d && value?.month === viewMonth && value?.year === viewYear;
  const isToday    = (d) => d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isPast     = (d) => {
    if (!d) return false;
    const cell = new Date(viewYear, viewMonth, d);
    const t    = new Date(); t.setHours(0,0,0,0);
    return cell < t;
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={prevMonth}
          style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
          <ChevronLeft size={13} />
        </motion.button>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.01em' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <motion.button whileTap={{ scale: 0.85 }} onClick={nextMonth}
          style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
          <ChevronRight size={13} />
        </motion.button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-3)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((d, i) => (
          <motion.button
            key={i}
            whileTap={d && !isPast(d) ? { scale: 0.85 } : {}}
            onClick={() => d && !isPast(d) && onChange({ day: d, month: viewMonth, year: viewYear })}
            style={{
              height: '32px', borderRadius: '8px', fontSize: '12px', fontWeight: isSelected(d) ? 700 : 400,
              fontFamily: 'var(--font-mono)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: d && !isPast(d) ? 'pointer' : 'default',
              background: isSelected(d)
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))'
                : isToday(d) ? 'rgba(184,115,51,0.1)' : 'transparent',
              color: isSelected(d) ? 'white'
                : isToday(d) ? 'var(--color-primary)'
                : isPast(d) ? 'var(--color-text-3)'
                : d ? 'var(--color-text-1)' : 'transparent',
              border: isSelected(d) ? '1px solid rgba(184,115,51,0.4)'
                : isToday(d) ? '1px solid rgba(184,115,51,0.2)' : '1px solid transparent',
              opacity: isPast(d) ? 0.3 : 1,
              boxShadow: isSelected(d) ? '0 2px 8px rgba(184,115,51,0.3)' : 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {d || ''}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — ZenithDateTimePicker
//
// Props:
//   onConfirm(displayString) — called with a formatted string like "Mar 17 · 08:00 AM"
//   onCancel()
// ─────────────────────────────────────────────────────────────────────────────
export default function ZenithDateTimePicker({ onConfirm, onCancel }) {
  const today = new Date();

  const [tab,      setTab]      = useState('date'); // 'date' | 'time'
  const [dateVal,  setDateVal]  = useState({ day: today.getDate(), month: today.getMonth(), year: today.getFullYear() });
  const [timeVal,  setTimeVal]  = useState({ h: '08', m: '00', ampm: 'AM' });

  const formatDisplay = () => {
    const month = MONTHS[dateVal.month].slice(0, 3);
    const day   = dateVal.day;
    const year  = dateVal.year !== today.getFullYear() ? ` ${dateVal.year}` : '';
    return `${month} ${day}${year} · ${timeVal.h}:${timeVal.m} ${timeVal.ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{
        borderRadius: '16px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-primary-border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top shimmer */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.5), transparent)', pointerEvents: 'none' }} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', padding: '10px 10px 0', gap: '4px' }}>
        {['date', 'time'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px', borderRadius: '10px', fontSize: '11px',
              fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer',
              transition: 'all 0.15s',
              background: tab === t ? 'rgba(184,115,51,0.15)' : 'transparent',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-3)',
              border: tab === t ? '1px solid rgba(184,115,51,0.3)' : '1px solid transparent',
            }}
          >
            {t === 'date' ? 'Date' : 'Time'}
          </button>
        ))}
      </div>

      {/* Selected summary */}
      <div style={{ padding: '8px 14px 4px', textAlign: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
          color: 'var(--color-primary)', letterSpacing: '0.02em',
        }}>
          {formatDisplay()}
        </span>
      </div>

      {/* Panel content */}
      <div style={{ padding: '8px 12px 12px' }}>
        <AnimatePresence mode="wait">
          {tab === 'date' ? (
            <motion.div key="date"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
              <Calendar value={dateVal} onChange={setDateVal} />
            </motion.div>
          ) : (
            <motion.div key="time"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', textAlign: 'center', marginBottom: '4px' }}>
                Scroll or drag to set time
              </div>
              <TimePicker value={timeVal} onChange={setTimeVal} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', padding: '0 12px 12px' }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onConfirm(formatDisplay())}
          style={{
            flex: 1, padding: '9px', borderRadius: '10px', fontSize: '12px',
            fontWeight: 600, color: 'white', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            border: '1px solid rgba(184,115,51,0.3)',
            boxShadow: '0 2px 12px rgba(184,115,51,0.25)',
          }}
        >
          Set Reminder
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onCancel}
          style={{
            padding: '9px 14px', borderRadius: '10px', fontSize: '12px',
            color: 'var(--color-text-3)', cursor: 'pointer',
            background: 'var(--color-stone)', border: '1px solid var(--color-border)',
          }}
        >
          Cancel
        </motion.button>
      </div>
    </motion.div>
  );
}