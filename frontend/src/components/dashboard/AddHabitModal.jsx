import React, { useState } from 'react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 px-4"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {/* Top accent shimmer */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.3), transparent)',
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div>
                  <h2
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-warm-white)',
                    }}
                  >
                    New habit
                  </h2>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px' }}>
                    Build consistency, earn XP
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors"
                  style={{
                    background: 'var(--color-stone)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-stone-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '1px' }} />

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {/* Title */}
                <div>
                  <label
                    className="block mb-1.5"
                    style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}
                  >
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
                  <label
                    className="block mb-1.5"
                    style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}
                  >
                    Description{' '}
                    <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--color-text-3)', opacity: 0.7 }}>
                      (optional)
                    </span>
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
                  <label
                    className="block mb-2"
                    style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}
                  >
                    Tracking type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'boolean', label: 'Yes / No',  icon: CheckSquare, desc: 'Did you do it?' },
                      { value: 'numeric', label: 'Target',    icon: Hash,        desc: 'Track a number' },
                    ].map(({ value, label, icon: Icon, desc }) => {
                      const active = form.metric_type === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm({ ...form, metric_type: value })}
                          className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                          style={{
                            background: active ? 'rgba(184,115,51,0.1)' : 'var(--color-stone)',
                            border: `1px solid ${active ? 'rgba(184,115,51,0.3)' : 'var(--color-border)'}`,
                            color: active ? 'var(--color-text-1)' : 'var(--color-text-3)',
                          }}
                        >
                          <Icon
                            size={13}
                            style={{ color: active ? 'var(--color-primary)' : 'inherit', flexShrink: 0 }}
                          />
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
                      className="flex gap-3 overflow-hidden"
                    >
                      <div className="flex-1">
                        <label
                          className="block mb-1.5"
                          style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}
                        >
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
                      <div className="flex-1">
                        <label
                          className="block mb-1.5"
                          style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}
                        >
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
                  className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
                    opacity: busy ? 0.6 : 1,
                    boxShadow: '0 4px 16px rgba(184,115,51,0.2), 0 1px 0 rgba(255,255,255,0.06) inset',
                    border: '1px solid rgba(184,115,51,0.3)',
                    letterSpacing: '-0.01em',
                    marginTop: '4px',
                  }}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create habit'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}