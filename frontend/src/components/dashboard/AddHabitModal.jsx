import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckSquare, Hash } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit } = useHabitStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metric_type: 'boolean',
    target_value: '',
    unit: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setFormData({ title: '', description: '', metric_type: 'boolean', target_value: '', unit: '' });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        metric_type: formData.metric_type,
      };

      if (formData.metric_type === 'numeric') {
        payload.target_value = parseFloat(formData.target_value);
        payload.unit = formData.unit;
      }

      await addHabit(payload);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to add habit', error);
    } finally {
      setIsSubmitting(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Top shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">New Habit</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Build consistency, earn XP</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Habit name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                    placeholder="e.g., Read for 30 mins"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-slate-600 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                    placeholder="Why does this habit matter?"
                  />
                </div>

                {/* Metric type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Tracking type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'boolean', label: 'Yes / No', icon: CheckSquare, desc: 'Did you do it?' },
                      { value: 'numeric', label: 'Target', icon: Hash, desc: 'Track a number' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, metric_type: value })}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          formData.metric_type === value
                            ? 'border-primary/60 bg-primary/8 text-white'
                            : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <Icon size={16} className={formData.metric_type === value ? 'text-primary' : ''} />
                        <div>
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="text-xs text-slate-600">{desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numeric fields */}
                <AnimatePresence>
                  {formData.metric_type === 'numeric' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-3 overflow-hidden"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                          Target
                        </label>
                        <input
                          type="number"
                          required={formData.metric_type === 'numeric'}
                          min="0"
                          step="any"
                          value={formData.target_value}
                          onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary/60 transition-all"
                          placeholder="8"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                          Unit
                        </label>
                        <input
                          type="text"
                          required={formData.metric_type === 'numeric'}
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-primary/60 transition-all"
                          placeholder="hours"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Habit'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}