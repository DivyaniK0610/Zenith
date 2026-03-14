import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

export default function AddHabitModal({ isOpen, onClose, userId }) {
  const { addHabit } = useHabitStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    metric_type: 'boolean',
    target_value: '',
    unit: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setFormData({ title: '', description: '', metric_type: 'boolean', target_value: '', unit: '' });
      onClose();
    } catch (error) {
      console.error("Failed to add habit", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-slate-700 p-6 rounded-3xl shadow-2xl shadow-black/50 z-50"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Create New Habit</h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g., Read for 30 mins"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description <span className="text-slate-600">(Optional)</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24"
                  placeholder="Why do you want to build this habit?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Tracking Method</label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-background rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metric_type: 'boolean' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.metric_type === 'boolean'
                        ? 'bg-surface text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Yes / No
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, metric_type: 'numeric' })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.metric_type === 'numeric'
                        ? 'bg-surface text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Target Value
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {formData.metric_type === 'numeric' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex gap-4 overflow-hidden"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Target</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                        className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g., 8"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Unit</label>
                      <input
                        type="text"
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g., hours"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl mt-8 transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Habit"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}