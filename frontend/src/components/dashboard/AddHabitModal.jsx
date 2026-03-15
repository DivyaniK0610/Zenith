import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, CheckSquare, Hash, Sparkles, ChevronRight,
  ChevronDown, Target, Plus, Check
} from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { parseHabitDescription } from '../../api/habits';
import { useZenithSounds } from '../../hooks/useSound';
import apiClient from '../../api/client';

const UNITS = ['mins', 'hours', 'km', 'pages', 'reps', 'glasses'];
const EMOJI_OPTIONS = ['🎯','💪','📚','🏃','🧘','💤','🥗','💻','🎨','🎵','✍️','🌿'];
const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ── Inline goal creator (appears inside dropdown) ─────────────────────
function CreateGoalInline({ onCreated, onCancel }) {
  const [title, setTitle]         = useState('');
  const [emoji, setEmoji]         = useState('🎯');
  const [busy, setBusy]           = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef                  = useRef(null);

  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const handleCreate = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const res = await apiClient.post('/api/v1/goals/', { user_id: USER_ID, title: title.trim(), emoji });
      onCreated(res.data.data);
    } catch (_) { setBusy(false); }
  };

  return (
    <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', marginBottom: '8px' }}>
        New goal
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {/* Emoji button */}
        <div style={{ position: 'relative' }} ref={emojiRef}>
          <button type="button" onClick={() => setShowEmoji(o => !o)}
            style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer', flexShrink: 0 }}>
            {emoji}
          </button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                style={{ position: 'absolute', bottom: '38px', left: 0, zIndex: 200, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px', width: '164px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} type="button" onClick={() => { setEmoji(e); setShowEmoji(false); }}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: emoji === e ? 'rgba(184,115,51,0.2)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } if (e.key === 'Escape') onCancel(); }}
          placeholder="Goal name…"
          style={{ flex: 1, background: 'var(--color-stone)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '7px 10px', color: 'var(--color-text-1)', fontSize: '12px', fontFamily: 'var(--font-sans)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" onClick={handleCreate} disabled={!title.trim() || busy}
          style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', border: 'none', cursor: title.trim() && !busy ? 'pointer' : 'not-allowed', background: title.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone)', color: title.trim() ? 'white' : 'var(--color-text-3)', opacity: busy ? 0.7 : 1 }}>
          {busy ? <Loader2 size={11} className="animate-spin" /> : <><Check size={11} /> Create</>}
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Custom Goal Dropdown ──────────────────────────────────────────────
function GoalDropdown({ goals, value, onChange, onGoalCreated }) {
  const [open, setOpen]         = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef            = useRef(null);

  const selected = goals.find(g => g.id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) { setOpen(false); setCreating(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (id) => { onChange(id); setOpen(false); setCreating(false); };

  const handleGoalCreated = (g) => { onGoalCreated(g); onChange(g.id); setCreating(false); setOpen(false); };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button type="button" onClick={() => { setOpen(o => !o); setCreating(false); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
          background: 'var(--color-stone)', border: `1px solid ${open ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
          color: 'var(--color-text-1)', fontSize: '13px', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
        }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selected ? (
            <>
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(184,115,51,0.12)', fontSize: '13px' }}>{selected.emoji}</span>
              <span style={{ color: 'var(--color-text-1)' }}>{selected.title}</span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-3)' }}>No goal — standalone habit</span>
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={13} style={{ color: 'var(--color-text-3)' }} />
        </motion.div>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
              borderRadius: '12px', background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
              overflow: 'hidden',
            }}>

            {/* No goal */}
            <button type="button" onClick={() => pick('')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '13px', textAlign: 'left', cursor: 'pointer', background: !value ? 'rgba(184,115,51,0.08)' : 'transparent', color: !value ? 'var(--color-text-1)' : 'var(--color-text-3)', borderBottom: '1px solid var(--color-border)', border: 'none', fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}
              onMouseEnter={e => { if (value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', fontSize: '12px', flexShrink: 0, color: 'var(--color-text-3)' }}>—</div>
              <span style={{ flex: 1 }}>No goal — standalone habit</span>
              {!value && <Check size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
            </button>

            {/* Goal list */}
            {goals.length > 0 && (
              <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {goals.map((goal, i) => (
                  <button key={goal.id} type="button" onClick={() => pick(goal.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '13px', textAlign: 'left', cursor: 'pointer', background: value === goal.id ? 'rgba(184,115,51,0.08)' : 'transparent', color: 'var(--color-text-1)', borderBottom: i < goals.length - 1 ? '1px solid var(--color-border)' : 'none', border: 'none', fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}
                    onMouseEnter={e => { if (value !== goal.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (value !== goal.id) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(184,115,51,0.1)', fontSize: '13px', flexShrink: 0 }}>
                      {goal.emoji}
                    </div>
                    <span style={{ flex: 1 }}>{goal.title}</span>
                    {value === goal.id && <Check size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            )}

            {/* Create new goal row / inline form */}
            {!creating ? (
              <button type="button" onClick={() => setCreating(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none', borderTop: goals.length > 0 ? '1px solid var(--color-border)' : 'none', color: 'var(--color-primary)', fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,115,51,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(184,115,51,0.12)', flexShrink: 0 }}>
                  <Plus size={12} style={{ color: 'var(--color-primary)' }} />
                </div>
                Create a new goal
              </button>
            ) : (
              <CreateGoalInline onCreated={handleGoalCreated} onCancel={() => setCreating(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────
export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit, goals, loadGoals } = useHabitStore();
  const { playModalClose }             = useZenithSounds();

  const emptyForm = { title: '', description: '', metric_type: 'boolean', target_value: '', unit: 'mins', macro_goal_id: '' };

  const [form, setForm]           = useState(emptyForm);
  const [busy, setBusy]           = useState(false);
  const [aiInput, setAiInput]     = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode]       = useState(true);
  const [aiError, setAiError]     = useState('');
  const [aiUsed, setAiUsed]       = useState(false);
  const [localGoals, setLocalGoals] = useState([]);

  useEffect(() => { if (isOpen) loadGoals(userId || USER_ID); }, [isOpen, userId, loadGoals]);
  useEffect(() => { setLocalGoals(goals); }, [goals]);

  const reset = () => { setForm(emptyForm); setAiInput(''); setAiError(''); setAiUsed(false); setAiMode(true); };
  const handleClose = () => { playModalClose(); reset(); onClose(); };

  const handleAiParse = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true); setAiError('');
    try {
      const result = await parseHabitDescription(aiInput.trim());
      const d = result.data;
      setForm(prev => ({ ...prev, title: d.title || '', description: d.description || '', metric_type: d.metric_type || 'boolean', target_value: d.target_value != null ? String(d.target_value) : '', unit: d.unit || 'mins' }));
      setAiUsed(true); setAiMode(false);
    } catch { setAiError('Could not parse — try being more specific.'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const payload = { user_id: userId || USER_ID, title: form.title, description: form.description || null, metric_type: form.metric_type, macro_goal_id: form.macro_goal_id || null };
      if (form.metric_type === 'numeric') { payload.target_value = parseFloat(form.target_value); payload.unit = form.unit || 'units'; }
      await addHabit(payload);
      reset(); onClose();
    } catch (err) { console.error(err); }
    finally { setBusy(false); }
  };

  const handleGoalCreated = (newGoal) => {
    setLocalGoals(prev => [...prev, newGoal]);
    setForm(f => ({ ...f, macro_goal_id: newGoal.id }));
  };

  const inputStyle = { width: '100%', background: 'var(--color-stone)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--color-text-1)', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', transition: 'border-color 0.15s', lineHeight: '1.5' };
  const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
          />

          {/* Outer scroll container — fills viewport, centers content */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{ width: '100%', maxWidth: '440px', margin: 'auto' }}
            >
              <div style={{ position: 'relative', borderRadius: '16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                {/* Top shimmer */}
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.3), transparent)', zIndex: 1, pointerEvents: 'none' }} />

                {/* Header — NOT sticky, just normal flow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-warm-white)', margin: 0 }}>New habit</h2>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px', marginBottom: 0 }}>Build consistency, earn XP</p>
                  </div>
                  <button onClick={handleClose}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={12} />
                  </button>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                {/* Body — no fixed height, just natural flow so it expands & the outer shell scrolls */}
                <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Mode tabs */}
                  <div style={{ display: 'flex', gap: '6px', padding: '3px', background: 'var(--color-stone)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    {[{ id: true, label: 'AI assist', icon: Sparkles }, { id: false, label: 'Manual', icon: null }].map(({ id, label, icon: Icon }) => (
                      <button key={String(id)} type="button" onClick={() => setAiMode(id)}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer', transition: 'all 0.15s', background: aiMode === id ? 'var(--color-surface-2)' : 'transparent', color: aiMode === id ? 'var(--color-primary)' : 'var(--color-text-3)', border: aiMode === id ? '1px solid var(--color-primary-border)' : '1px solid transparent', boxShadow: aiMode === id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none' }}>
                        {Icon && <Icon size={10} />}{label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">

                    {/* ── AI panel ── */}
                    {aiMode && (
                      <motion.div key="ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'rgba(184,115,51,0.05)', border: '1px solid rgba(184,115,51,0.15)', padding: '12px' }}>
                          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.25), transparent)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>Describe your habit</span>
                          </div>
                          <textarea autoFocus rows={2} value={aiInput}
                            onChange={e => { setAiInput(e.target.value); setAiError(''); }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiParse(); } }}
                            placeholder="e.g. I want to read for 1 hour every day, or run 5km each morning"
                            style={{ ...inputStyle, background: 'var(--color-stone)', resize: 'none', marginBottom: '8px' }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                          <motion.button type="button" onClick={handleAiParse} disabled={!aiInput.trim() || aiLoading} whileTap={{ scale: 0.97 }}
                            style={{ width: '100%', padding: '9px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: aiInput.trim() ? 'pointer' : 'not-allowed', background: aiInput.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone)', color: aiInput.trim() ? 'white' : 'var(--color-text-3)', border: '1px solid rgba(184,115,51,0.3)', opacity: aiLoading ? 0.7 : 1, transition: 'all 0.15s' }}>
                            {aiLoading ? <><Loader2 size={12} className="animate-spin" /> Parsing…</> : <><Sparkles size={12} /> Build habit with AI</>}
                          </motion.button>
                          {aiError && <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px', textAlign: 'center' }}>{aiError}</p>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                          <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>or switch to manual</span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                        </div>

                        <button type="button" onClick={() => setAiMode(false)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '9px', fontSize: '11px', color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                          Fill form manually <ChevronRight size={10} />
                        </button>
                      </motion.div>
                    )}

                    {/* ── Manual form ── */}
                    {!aiMode && (
                      <motion.form key="form" onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {aiUsed && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '9px', background: 'rgba(184,115,51,0.08)', border: '1px solid rgba(184,115,51,0.2)' }}>
                            <Sparkles size={10} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>AI pre-filled — review and adjust before saving</span>
                          </motion.div>
                        )}

                        {/* Name */}
                        <div>
                          <label style={labelStyle}>Habit name</label>
                          <input autoFocus required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Read for 30 mins" style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label style={labelStyle}>Description <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, opacity: 0.7 }}>(optional)</span></label>
                          <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Why does this habit matter?" style={{ ...inputStyle, resize: 'none' }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>

                        {/* Goal dropdown — custom, with inline create */}
                        <div>
                          <label style={labelStyle}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Target size={10} style={{ color: 'var(--color-primary)' }} />
                              Assign to goal <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, opacity: 0.7 }}>(optional)</span>
                            </span>
                          </label>
                          <GoalDropdown
                            goals={localGoals}
                            value={form.macro_goal_id}
                            onChange={id => setForm(f => ({ ...f, macro_goal_id: id }))}
                            onGoalCreated={handleGoalCreated}
                          />
                        </div>

                        {/* Tracking type */}
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '8px' }}>Tracking type</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                              { value: 'boolean', label: 'Yes / No', icon: CheckSquare, desc: 'Did you do it?' },
                              { value: 'numeric', label: 'Measure',  icon: Hash,        desc: 'Track a quantity' },
                            ].map(({ value, label, icon: Icon, desc }) => {
                              const active = form.metric_type === value;
                              return (
                                <button key={value} type="button" onClick={() => setForm({ ...form, metric_type: value })}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 12px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', background: active ? 'rgba(184,115,51,0.1)' : 'var(--color-stone)', border: `1px solid ${active ? 'rgba(184,115,51,0.3)' : 'var(--color-border)'}`, color: active ? 'var(--color-text-1)' : 'var(--color-text-3)' }}>
                                  <Icon size={13} style={{ color: active ? 'var(--color-primary)' : 'inherit', flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{label}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-3)', marginTop: '1px' }}>{desc}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Numeric fields */}
                        <AnimatePresence>
                          {form.metric_type === 'numeric' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}>
                              <div style={{ flex: '0 0 110px' }}>
                                <label style={labelStyle}>Daily goal</label>
                                <input type="number" required min="0" step="any" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} placeholder="1" style={inputStyle}
                                  onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Unit</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {UNITS.map(unit => {
                                    const active = form.unit === unit;
                                    return (
                                      <button key={unit} type="button" onClick={() => setForm({ ...form, unit })}
                                        style={{ padding: '5px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', background: active ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)', color: active ? 'var(--color-primary)' : 'var(--color-text-3)', border: `1px solid ${active ? 'rgba(184,115,51,0.35)' : 'var(--color-border)'}` }}>
                                        {unit}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.97 }}
                          style={{ width: '100%', padding: '12px', borderRadius: '12px', color: 'white', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))', opacity: busy ? 0.6 : 1, boxShadow: '0 4px 16px rgba(184,115,51,0.2)', border: '1px solid rgba(184,115,51,0.3)', letterSpacing: '-0.01em', cursor: busy ? 'not-allowed' : 'pointer' }}>
                          {busy ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : 'Create habit'}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}