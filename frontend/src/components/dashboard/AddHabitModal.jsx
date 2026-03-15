import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckSquare, Hash, Sparkles, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';
import { parseHabitDescription } from '../../api/habits';
import { useZenithSounds } from '../../hooks/useSound';

const UNITS = ['mins', 'hours', 'km', 'pages', 'reps', 'glasses'];

export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit } = useHabitStore();
  const { playModalClose } = useZenithSounds();

  const emptyForm = { title: '', description: '', metric_type: 'boolean', target_value: '', unit: 'mins' };
  const [form, setForm]           = useState(emptyForm);
  const [busy, setBusy]           = useState(false);
  const [aiInput, setAiInput]     = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode]       = useState(true); // start in AI mode
  const [aiError, setAiError]     = useState('');
  const [aiUsed, setAiUsed]       = useState(false); // did AI pre-fill?

  const reset = () => {
    setForm(emptyForm);
    setAiInput('');
    setAiError('');
    setAiUsed(false);
    setAiMode(true);
  };

  const handleClose = () => {
    playModalClose();
    reset();
    onClose();
  };

  const handleAiParse = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await parseHabitDescription(aiInput.trim());
      const data = result.data;
      setForm({
        title:       data.title       || '',
        description: data.description || '',
        metric_type: data.metric_type || 'boolean',
        target_value: data.target_value != null ? String(data.target_value) : '',
        unit:        data.unit        || 'mins',
      });
      setAiUsed(true);
      setAiMode(false); // switch to form view after parse
    } catch (err) {
      setAiError('Could not parse — try being more specific.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        user_id:     userId,
        title:       form.title,
        description: form.description || null,
        metric_type: form.metric_type,
      };
      if (form.metric_type === 'numeric') {
        payload.target_value = parseFloat(form.target_value);
        payload.unit = form.unit || 'units';
      }
      await addHabit(payload);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--color-stone)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: 'var(--color-text-1)',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.15s',
    lineHeight: '1.5',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
          />

          {/* Modal */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{ width: '100%', maxWidth: '420px' }}
            >
              <div style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.3), transparent)' }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-warm-white)', margin: 0 }}>
                      New habit
                    </h2>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px', marginBottom: 0 }}>
                      Build consistency, earn XP
                    </p>
                  </div>
                  <button onClick={handleClose}
                    style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={12} />
                  </button>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* ── AI mode toggle tabs ── */}
                  <div style={{ display: 'flex', gap: '6px', padding: '3px', background: 'var(--color-stone)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    {[
                      { id: true,  label: 'AI assist', icon: Sparkles },
                      { id: false, label: 'Manual',    icon: null      },
                    ].map(({ id, label, icon: Icon }) => (
                      <button key={String(id)} type="button"
                        onClick={() => setAiMode(id)}
                        style={{
                          flex: 1, padding: '6px 10px', borderRadius: '7px', fontSize: '11px', fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: aiMode === id ? 'var(--color-surface-2)' : 'transparent',
                          color: aiMode === id ? 'var(--color-primary)' : 'var(--color-text-3)',
                          border: aiMode === id ? '1px solid var(--color-primary-border)' : '1px solid transparent',
                          boxShadow: aiMode === id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                        }}
                      >
                        {Icon && <Icon size={10} />}
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── AI input panel ── */}
                  <AnimatePresence mode="wait">
                    {aiMode ? (
                      <motion.div key="ai"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                      >
                        {/* Ambient glow card */}
                        <div style={{
                          position: 'relative', borderRadius: '12px', overflow: 'hidden',
                          background: 'rgba(184,115,51,0.05)', border: '1px solid rgba(184,115,51,0.15)',
                          padding: '12px',
                        }}>
                          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.25), transparent)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                              Describe your habit
                            </span>
                          </div>
                          <textarea
                            autoFocus
                            rows={2}
                            value={aiInput}
                            onChange={e => { setAiInput(e.target.value); setAiError(''); }}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiParse(); } }}
                            placeholder="e.g. I want to read for 1 hour every day, or run 5km each morning"
                            style={{ ...inputStyle, background: 'var(--color-stone)', resize: 'none', marginBottom: '8px' }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                          <motion.button
                            type="button"
                            onClick={handleAiParse}
                            disabled={!aiInput.trim() || aiLoading}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              width: '100%', padding: '9px', borderRadius: '9px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              fontSize: '12px', fontWeight: 600, cursor: aiInput.trim() ? 'pointer' : 'not-allowed',
                              background: aiInput.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone)',
                              color: aiInput.trim() ? 'white' : 'var(--color-text-3)',
                              border: '1px solid rgba(184,115,51,0.3)',
                              opacity: aiLoading ? 0.7 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            {aiLoading
                              ? <><Loader2 size={12} className="animate-spin" /> Parsing…</>
                              : <><Sparkles size={12} /> Build habit with AI</>
                            }
                          </motion.button>
                          {aiError && (
                            <p style={{ fontSize: '11px', color: '#f87171', marginTop: '6px', textAlign: 'center' }}>{aiError}</p>
                          )}
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
                    ) : (

                      // ── Manual form ──
                      <motion.form key="form" onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                      >
                        {/* AI pre-fill banner */}
                        {aiUsed && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '9px', background: 'rgba(184,115,51,0.08)', border: '1px solid rgba(184,115,51,0.2)' }}>
                            <Sparkles size={10} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>
                              AI pre-filled — review and adjust before saving
                            </span>
                          </motion.div>
                        )}

                        {/* Title */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                            Habit name
                          </label>
                          <input autoFocus required value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Read for 30 mins"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                            Description <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, opacity: 0.7 }}>(optional)</span>
                          </label>
                          <textarea rows={2} value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Why does this habit matter?"
                            style={{ ...inputStyle, resize: 'none' }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>

                        {/* Tracking type */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                            Tracking type
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                              { value: 'boolean', label: 'Yes / No',  icon: CheckSquare, desc: 'Did you do it?' },
                              { value: 'numeric', label: 'Measure',   icon: Hash,        desc: 'Track a quantity' },
                            ].map(({ value, label, icon: Icon, desc }) => {
                              const active = form.metric_type === value;
                              return (
                                <button key={value} type="button"
                                  onClick={() => setForm({ ...form, metric_type: value })}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px',
                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                                    background: active ? 'rgba(184,115,51,0.1)' : 'var(--color-stone)',
                                    border: `1px solid ${active ? 'rgba(184,115,51,0.3)' : 'var(--color-border)'}`,
                                    color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
                                  }}
                                >
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
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}
                            >
                              {/* Daily goal */}
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                                  Daily goal
                                </label>
                                <div className="relative">
                                  <input type="number" required min="0" step="any"
                                    value={form.target_value}
                                    onChange={e => setForm({ ...form, target_value: e.target.value })}
                                    placeholder="1"
                                    style={{ ...inputStyle, paddingRight: '32px' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                                  />
                                  <div className="absolute right-0 top-0 bottom-0 flex flex-col"
                                    style={{ width: '28px', borderLeft: '1px solid var(--color-border)' }}>
                                    <button type="button"
                                      onClick={() => setForm({ ...form, target_value: String(Math.max(0, (parseFloat(form.target_value) || 0) + 1)) })}
                                      className="flex-1 flex items-center justify-center transition-colors"
                                      style={{ color: 'var(--color-text-3)', borderBottom: '1px solid var(--color-border)', borderRadius: '0 10px 0 0', background: 'transparent' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-stone-light)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)'; }}
                                    >
                                      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                                        <path d="M1 4L4 1L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <button type="button"
                                      onClick={() => setForm({ ...form, target_value: String(Math.max(0, (parseFloat(form.target_value) || 0) - 1)) })}
                                      className="flex-1 flex items-center justify-center transition-colors"
                                      style={{ color: 'var(--color-text-3)', borderRadius: '0 0 10px 0', background: 'transparent' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-stone-light)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)'; }}
                                    >
                                      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                                        <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Measured in */}
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                                  Measured in
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {UNITS.map(unit => {
                                    const active = form.unit === unit;
                                    return (
                                      <button key={unit} type="button"
                                        onClick={() => setForm({ ...form, unit })}
                                        style={{
                                          padding: '5px 9px', borderRadius: '7px', fontSize: '11px', fontWeight: 500,
                                          cursor: 'pointer', transition: 'all 0.15s',
                                          background: active ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)',
                                          color: active ? 'var(--color-primary)' : 'var(--color-text-3)',
                                          border: `1px solid ${active ? 'rgba(184,115,51,0.35)' : 'var(--color-border)'}`,
                                        }}
                                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-stone-light)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}}
                                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'var(--color-stone)'; e.currentTarget.style.color = 'var(--color-text-3)'; }}}
                                      >
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
                          style={{
                            width: '100%', padding: '12px', borderRadius: '12px', color: 'white',
                            fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '8px', marginTop: '4px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
                            opacity: busy ? 0.6 : 1, boxShadow: '0 4px 16px rgba(184,115,51,0.2)',
                            border: '1px solid rgba(184,115,51,0.3)', letterSpacing: '-0.01em',
                            cursor: busy ? 'not-allowed' : 'pointer',
                          }}
                        >
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