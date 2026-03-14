import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';
import { Check, Flame } from 'lucide-react';
import { useHabitStore } from '../../store/habitStore';

import successSound from '../../assets/sounds/celebration.wav';

export default function HabitCard({ habit }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const { logHabit, loadHabits } = useHabitStore();
  const [play] = useSound(successSound, { volume: 0.5 });

  const handleComplete = async () => {
    if (isCompleted) return;
    
    // Optimistic UI update & Audio
    play();
    setIsCompleted(true);
    
    try {
      await logHabit(habit.id, true, null);
      
      if (habit.user_id) {
          await loadHabits(habit.user_id);
      }
    } catch (error) {
      // Check if the error is our expected 409 Conflict
      if (error.response && error.response.status === 409) {
        console.log("Habit already logged for today.");
        // We do nothing else, leaving isCompleted as true!
      } else {
        // Only revert the UI if it was a real network/server error
        console.error("Logging failed", error);
        setIsCompleted(false); 
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-5 rounded-2xl border transition-all duration-300 ${
        isCompleted 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-surface border-slate-700 hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-semibold transition-all ${isCompleted ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>
              {habit.title}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs border border-orange-500/20 shadow-inner">
              <Flame size={12} className={habit.current_streak > 2 ? "animate-pulse" : ""} />
              <span className="font-bold">{habit.current_streak || 0}</span>
            </div>
          </div>
          {habit.description && (
            <p className="text-sm text-slate-400">{habit.description}</p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleComplete}
          disabled={isCompleted}
          className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
            isCompleted 
              ? 'bg-emerald-500 shadow-emerald-500/20 cursor-default' 
              : 'bg-primary hover:bg-blue-600 shadow-blue-500/20 active:scale-95'
          }`}
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.svg
                key="plus"
                exit={{ scale: 0, opacity: 0 }}
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}