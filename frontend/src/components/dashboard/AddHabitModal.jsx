import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckSquare, Hash } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit } = useHabitStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    metric_type: 'boolean',
    target_value: '',
    unit: '',
  });
  const [busy, setBusy] = useState(false);

  const reset = () =>
    setForm({ title: '', description: '', metric_type: 'boolean', target_value: '', unit: '' });

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        user_id: userId,
        title: form.title,
        description: form.description || null,
        metric_type: form.metric_type,
      };
      if (form.metric_type === 'numeric') {
        payload.target_value = parseFloat(form.target_value);
        payload.unit = form.unit;
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(16px)',
            }}
          />

          {/* Centered overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{ width: '100%', maxWidth: '400px' }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              >
                {/* Top accent shimmer */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '0 0 auto 0',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.3), transparent)',
                  }}
                />

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
                  <button
                    onClick={handleClose}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-stone)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-3)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                      Habit name
                    </label>
                    <input
                      autoFocus
                      required
                      value={form.title}
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
                    <textarea
                      rows={2}
                      value={form.description}
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
                        { value: 'boolean', label: 'Yes / No', icon: CheckSquare, desc: 'Did you do it?' },
                        { value: 'numeric', label: 'Target',   icon: Hash,        desc: 'Track a number' },
                      ].map(({ value, label, icon: Icon, desc }) => {
                        const active = form.metric_type === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm({ ...form, metric_type: value })}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px',
                              borderRadius: '12px',
                              textAlign: 'left',
                              background: active ? 'rgba(184,115,51,0.1)' : 'var(--color-stone)',
                              border: `1px solid ${active ? 'rgba(184,115,51,0.3)' : 'var(--color-border)'}`,
                              color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', gap: '12px', overflow: 'hidden' }}
                      >
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                            Target
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={form.target_value}
                            onChange={e => setForm({ ...form, target_value: e.target.value })}
                            placeholder="8"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>
                            Unit
                          </label>
                          <input
                            type="text"
                            required
                            value={form.unit}
                            onChange={e => setForm({ ...form, unit: e.target.value })}
                            placeholder="hours"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={busy}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
                      opacity: busy ? 0.6 : 1,
                      boxShadow: '0 4px 16px rgba(184,115,51,0.2)',
                      border: '1px solid rgba(184,115,51,0.3)',
                      letterSpacing: '-0.01em',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                    }}
                  >
                    {busy ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : 'Create habit'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}