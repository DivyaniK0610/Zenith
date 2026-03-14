import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckSquare, Hash } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit } = useHabitStore();
  const [form, setForm] = useState({ title: '', description: '', metric_type: 'boolean', target_value: '', unit: '' });
  const [busy, setBusy] = useState(false);

  const reset = () => setForm({ title: '', description: '', metric_type: 'boolean', target_value: '', unit: '' });

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { user_id: userId, title: form.title, description: form.description || null, metric_type: form.metric_type };
      if (form.metric_type === 'numeric') { payload.target_value = parseFloat(form.target_value); payload.unit = form.unit; }
      await addHabit(payload);
      reset(); onClose();
    } catch (err) { console.error(err); }
    finally { setBusy(false); }
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--color-stone)',
    border: '1px solid rgba(58,52,46,0.9)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--color-warm-white)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border"
              style={{ background: 'var(--color-surface)', borderColor: 'rgba(58,52,46,0.8)' }}>
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(201,129,58,0.2), transparent)' }} />

              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--color-warm-white)' }}>New Habit</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Build consistency, earn XP</p>
                </div>
                <button onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors"
                  style={{ background: 'var(--color-stone)', borderColor: 'rgba(58,52,46,0.9)', color: 'var(--color-muted)' }}>
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: 'var(--color-muted)' }}>Habit name</label>
                  <input autoFocus required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Read for 30 mins" style={inputStyle} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: 'var(--color-muted)' }}>Description <span style={{ color: 'var(--color-stone-light)', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Why does this habit matter?" style={{ ...inputStyle, resize: 'none' }} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: 'var(--color-muted)' }}>Tracking type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'boolean', label: 'Yes / No',    icon: CheckSquare, desc: 'Did you do it?' },
                      { value: 'numeric', label: 'Target',      icon: Hash,        desc: 'Track a number' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button key={value} type="button"
                        onClick={() => setForm({ ...form, metric_type: value })}
                        className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background: form.metric_type === value ? 'rgba(201,129,58,0.1)' : 'var(--color-stone)',
                          borderColor: form.metric_type === value ? 'rgba(201,129,58,0.4)' : 'rgba(58,52,46,0.9)',
                          color: form.metric_type === value ? 'var(--color-warm-white)' : 'var(--color-muted)',
                        }}>
                        <Icon size={15} style={{ color: form.metric_type === value ? 'var(--color-primary)' : 'inherit' }} />
                        <div>
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {form.metric_type === 'numeric' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="flex gap-3 overflow-hidden">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                          style={{ color: 'var(--color-muted)' }}>Target</label>
                        <input type="number" required min="0" step="any" value={form.target_value}
                          onChange={e => setForm({ ...form, target_value: e.target.value })}
                          placeholder="8" style={inputStyle} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                          style={{ color: 'var(--color-muted)' }}>Unit</label>
                        <input type="text" required value={form.unit}
                          onChange={e => setForm({ ...form, unit: e.target.value })}
                          placeholder="hours" style={inputStyle} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #c9813a, #9a5f25)', opacity: busy ? 0.6 : 1,
                    boxShadow: '0 8px 24px rgba(201,129,58,0.2)' }}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Habit'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}