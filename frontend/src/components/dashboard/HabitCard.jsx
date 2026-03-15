import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Clock, MoreHorizontal, Trash2, Archive, PauseCircle, PlayCircle, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { useZenithSounds } from '../../hooks/useSound';
import { createPortal } from 'react-dom';

function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null;
  const isLegendary = streak >= 30;
  const isHot       = streak >= 7;
  const isMild      = streak >= 3;
  const flameSize   = isLegendary ? 12 : isHot ? 11 : 10;
  const glowColor   = isLegendary ? '#ff6020' : isHot ? '#e08040' : 'var(--color-primary)';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isLegendary ? 'rgba(255,96,32,0.15)' : isHot ? 'rgba(224,120,48,0.14)' : isMild ? 'rgba(184,115,51,0.1)' : 'rgba(58,50,40,0.6)',
        color: glowColor,
        border: `1px solid ${isLegendary ? 'rgba(255,96,32,0.3)' : isHot ? 'rgba(224,120,48,0.25)' : 'rgba(184,115,51,0.15)'}`,
        letterSpacing: '0.01em',
      }}
    >
      <Flame size={flameSize} fill={isHot ? 'currentColor' : 'none'} strokeWidth={isHot ? 0 : 2}
        style={{ filter: isLegendary ? 'drop-shadow(0 0 4px rgba(255,96,32,0.8))' : isHot ? 'drop-shadow(0 0 2px rgba(224,120,48,0.6))' : 'none' }}
      />
      {streak}d
    </span>
  );
}

function MetricBadge({ habit }) {
  if (habit.metric_type !== 'numeric') return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(184,115,51,0.08)', color: 'var(--color-primary)', border: '1px solid rgba(184,115,51,0.15)' }}
    >
      <Clock size={9} />
      {habit.target_value} {habit.unit}
    </span>
  );
}

const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const PAUSE_OPTIONS = [
  { label: 'Tomorrow only', days: 1   },
  { label: '3 days',        days: 3   },
  { label: '1 week',        days: 7   },
  { label: '2 weeks',       days: 14  },
  { label: 'Indefinitely',  days: null },
];

export default function HabitCard({ habit, onAchievement }) {
  const { logHabit, loadHabits, completedToday, removeHabit, archiveHabit, pauseHabit, resumeHabit } = useHabitStore();
  const isCompleted = completedToday.has(habit.id);
  const isPaused    = habit.status === 'paused';

  const [isAnimating, setIsAnimating]     = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [subMenu, setSubMenu]             = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPause, setConfirmPause]   = useState(null); // stores { days, label }
  const [deleting, setDeleting]           = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const { playSuccess, playDelete, playArchive, playPause, playResume, playMenuOpen } = useZenithSounds();
  const menuBtnRef = useRef(null);
  const isTouch = isTouchDevice();

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (isCompleted || isAnimating || isPaused) return;
    setIsAnimating(true);
    setJustCompleted(true);
    playSuccess();
    try {
      const response = await logHabit(habit.id, true, null);
      if (response) {
        if (response.leveled_up) {
          onAchievement?.({ type: 'level_up', level: response.level, old_level: response.old_level, total_xp: response.total_xp, message: response.message });
        } else if (response.milestone_bonus > 0 || (response.current_streak > 0 && response.current_streak % 7 === 0)) {
          onAchievement?.({ type: 'streak', current_streak: response.current_streak, xp_gained: response.xp_gained, milestone_bonus: response.milestone_bonus || 0, message: response.message });
        }
        if (habit.user_id) await loadHabits(habit.user_id);
      }
    } catch (_) {
      setJustCompleted(false);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    playDelete();
    try { await removeHabit(habit.id); }
    catch (_) { setDeleting(false); setConfirmDelete(false); }
  };

  const handleArchive = async () => {
    setMenuOpen(false);
    playArchive();
    await archiveHabit(habit.id);
  };

  const handlePauseOption = (days) => {
    const label = days === 1 ? 'tomorrow only' : days ? `${days} days` : 'indefinitely';
    setSubMenu(null);
    setConfirmPause({ days, label });
  };

  const executePause = async () => {
    if (!confirmPause) return;
    const pauseUntil = confirmPause.days
      ? new Date(Date.now() + confirmPause.days * 86400000).toISOString().split('T')[0]
      : null;
    setMenuOpen(false);
    setConfirmPause(null);
    playPause();
    await pauseHabit(habit.id, pauseUntil);
  };

  const handleResume = async () => {
    setMenuOpen(false);
    playResume();
    await resumeHabit(habit.id);
  };

  const openMenu = (e) => {
    e.stopPropagation();
    setConfirmDelete(false);
    setSubMenu(null);
    playMenuOpen();
    setMenuOpen(o => !o);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmDelete(false);
    setSubMenu(null);
  };

  const btnOpacity = isTouch ? 1 : (menuOpen || isCardHovered ? 1 : 0);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: deleting ? 0 : 1, x: deleting ? -20 : 0, scale: deleting ? 0.95 : 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="relative"
      onHoverStart={() => setIsCardHovered(true)}
      onHoverEnd={() => setIsCardHovered(false)}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 0.985, 1.005, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="relative rounded-2xl"
        style={{
          background: isPaused ? 'rgba(20,18,14,0.7)' : isCompleted ? 'rgba(18,24,18,0.9)' : 'var(--color-surface-2)',
          border: `1px solid ${
            isPaused ? 'rgba(255,255,255,0.04)'
            : isCardHovered && !isCompleted ? 'rgba(184,115,51,0.2)'
            : isCompleted ? 'rgba(82,168,115,0.18)'
            : 'var(--color-border)'
          }`,
          boxShadow: isCardHovered && !isCompleted && !isPaused ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.1)',
          opacity: isPaused ? 0.55 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s, background 0.3s, opacity 0.3s',
        }}
      >
        {/* Clipped decorative layer */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: isCompleted ? 'linear-gradient(90deg, transparent, rgba(82,168,115,0.12), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
          />
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
            style={{
              background: isPaused ? 'rgba(100,90,80,0.3)' : isCompleted
                ? 'linear-gradient(to bottom, rgba(82,168,115,0.6), rgba(52,138,85,0.2))'
                : 'linear-gradient(to bottom, rgba(184,115,51,0.5), rgba(184,115,51,0.1))',
              opacity: isCompleted ? 1 : isCardHovered ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          />
          <AnimatePresence>
            {isAnimating && (
              <motion.div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(82,168,115,0.07), transparent)' }}
                initial={{ x: '-100%' }} animate={{ x: '200%' }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">

          {/* Checkbox */}
          <motion.button
            whileTap={!isCompleted && !isPaused ? { scale: 0.78 } : {}}
            onClick={handleComplete}
            disabled={isCompleted || isPaused}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: isCompleted ? 'rgba(52,138,85,0.15)' : 'var(--color-stone)',
              border: `1px solid ${isCompleted ? 'rgba(82,168,115,0.3)' : 'var(--color-stone-light)'}`,
              cursor: isCompleted || isPaused ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div key="check"
                  initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
                  <Check size={15} color="#6fcf8a" strokeWidth={2.8} />
                </motion.div>
              ) : (
                <motion.div key="empty" exit={{ scale: 0, opacity: 0 }} className="relative w-3.5 h-3.5">
                  <div
                    className={`w-full h-full rounded-md border-2 ${isCardHovered ? '' : 'habit-checkbox-idle'}`}
                    style={{
                      borderColor: isCardHovered ? 'transparent' : 'var(--color-stone-light)',
                      transition: 'border-color 0.15s',
                    }}
                  />
                  {/* Ghost tick on hover */}
                  <motion.svg
                    viewBox="0 0 10 8" fill="none"
                    className="absolute inset-0 w-full h-full"
                    animate={{ opacity: isCardHovered ? 0.35 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="#6fcf8a"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: isCardHovered ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  </motion.svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-sm font-medium leading-tight"
                style={{
                  color: isPaused ? 'var(--color-text-3)' : isCompleted ? 'rgba(111,207,138,0.5)' : 'var(--color-text-1)',
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(111,207,138,0.35)',
                  transition: 'color 0.3s',
                }}
              >
                {habit.title}
              </span>
              {isPaused && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(100,90,80,0.15)', color: 'var(--color-text-3)', border: '1px solid rgba(100,90,80,0.2)' }}>
                  {habit.pause_until
                    ? `Paused until ${new Date(habit.pause_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'Paused'}
                </span>
              )}
              {!isPaused && <StreakBadge streak={habit.current_streak || 0} />}
              <MetricBadge habit={habit} />
            </div>
            {habit.description && (
              <p className="text-xs leading-snug line-clamp-1" style={{ color: 'var(--color-text-3)' }}>
                {habit.description}
              </p>
            )}
          </div>

          {/* Right side — XP flash or ⋯ menu */}
          <div className="flex-shrink-0 flex items-center" style={{ width: '28px', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              {justCompleted && isCompleted ? (
                <motion.span key="xp"
                  initial={{ opacity: 0, y: 4, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.9 }} transition={{ duration: 0.25 }}
                  className="text-xs font-bold"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  +10
                </motion.span>
              ) : (
                <motion.div key="menu">
                  <button
                    ref={menuBtnRef}
                    onClick={openMenu}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: menuOpen ? 'var(--color-stone-light)' : 'transparent',
                      color: menuOpen ? 'var(--color-text-2)' : isTouch ? 'var(--color-text-2)' : 'var(--color-text-3)',
                      border: `1px solid ${menuOpen ? 'var(--color-border)' : 'transparent'}`,
                      opacity: btnOpacity,
                      transition: 'opacity 0.15s, background 0.15s, border-color 0.15s',
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--color-stone)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                    onMouseLeave={e => {
                      if (!menuOpen) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <MoreHorizontal size={13} />
                  </button>

                  {/* Portal dropdown */}
                  {menuOpen && createPortal(
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={closeMenu} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ duration: 0.12 }}
                        style={{
                          position: 'fixed',
                          zIndex: 41,
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          minWidth: 190,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                        }}
                        ref={(el) => {
                          if (el && menuBtnRef.current) {
                            const rect = menuBtnRef.current.getBoundingClientRect();
                            el.style.top  = (rect.bottom + 6) + 'px';
                            el.style.left = Math.max(8, rect.right - 190) + 'px';
                          }
                        }}
                      >
                        {/* Main menu */}
                        {!confirmDelete && subMenu === null && !confirmPause && (
                          <>
                            {isPaused ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResume(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium"
                                style={{ color: '#6fcf8a', borderBottom: '1px solid var(--color-border)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(111,207,138,0.07)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <PlayCircle size={12} />
                                Resume habit
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSubMenu('pause'); }}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-medium"
                                style={{ color: 'var(--color-text-2)', borderBottom: '1px solid var(--color-border)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <span className="flex items-center gap-2.5">
                                  <PauseCircle size={12} style={{ color: 'var(--color-primary)' }} />
                                  Pause habit
                                </span>
                                <ChevronRight size={10} style={{ color: 'var(--color-text-3)' }} />
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleArchive(); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium"
                              style={{ color: 'var(--color-text-2)', borderBottom: '1px solid var(--color-border)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Archive size={12} style={{ color: 'var(--color-text-3)' }} />
                              Archive habit
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium"
                              style={{ color: '#f87171' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Trash2 size={12} />
                              Delete habit
                            </button>
                          </>
                        )}

                        {/* Pause duration submenu */}
                        {subMenu === 'pause' && (
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 border-b"
                              style={{ borderColor: 'var(--color-border)' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSubMenu(null); }}
                                style={{ color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <ChevronRight size={10} style={{ transform: 'rotate(180deg)' }} />
                              </button>
                              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                                Pause for
                              </span>
                            </div>
                            {PAUSE_OPTIONS.map(({ label, days }) => (
                              <button key={label}
                                onClick={(e) => { e.stopPropagation(); handlePauseOption(days); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium"
                                style={{ color: 'var(--color-text-2)', borderBottom: '1px solid var(--color-border)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.07)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                {label}
                              </button>
                            ))}
                          </>
                        )}

                        {/* Delete confirm */}
                        {confirmDelete && (
                          <div className="p-3">
                            <p className="text-xs mb-2.5" style={{ color: 'var(--color-text-2)' }}>
                              Delete <strong style={{ color: 'var(--color-text-1)' }}>{habit.title}</strong> and all its logs?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                disabled={deleting}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
                              >
                                {deleting ? '...' : 'Delete'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--color-stone)', color: 'var(--color-text-3)', border: '1px solid var(--color-border)' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {/* Pause confirmation */}
                      {confirmPause && (
                        <div style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(184,115,51,0.12)', border: '1px solid rgba(184,115,51,0.2)', flexShrink: 0 }}>
                              <PauseCircle size={13} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)' }}>
                                Pause {confirmPause.label}?
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '1px' }}>
                                Streak is safe — but use sparingly
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); executePause(); }}
                              style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', background: 'rgba(184,115,51,0.12)', border: '1px solid rgba(184,115,51,0.25)', cursor: 'pointer' }}
                            >
                              Yes, pause
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmPause(null); }}
                              style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      </motion.div>
                    </>,
                    document.body
                  )}
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}