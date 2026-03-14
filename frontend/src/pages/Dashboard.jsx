import React, { useEffect, useState } from 'react';
import { useHabitStore } from '../store/habitStore';
import HabitCard from '../components/dashboard/HabitCard';
import AddHabitModal from '../components/dashboard/AddHabitModal';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// Replace with a valid UUID from your Supabase database 
const USER_ID = "741601ad-1b7c-477e-8be0-c76363f6ebda"; 

export default function Dashboard() {
  const { habits, isLoading, error, loadHabits } = useHabitStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHabits(USER_ID);
  }, [loadHabits]);

  return (
    <div className="w-full h-full space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Track your daily progress and build momentum.</p>
        </div>
        <div className="text-right bg-surface px-6 py-3 rounded-2xl border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Current Level</p>
            <p className="text-2xl font-mono text-primary font-bold">XP: 1,250</p>
        </div>
      </div>

      {/* Habits Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">Today's Habits</h2>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl font-medium transition-colors border border-primary/20 hover:border-primary"
        >
          <Plus size={18} />
          <span>Add Habit</span>
        </motion.button>
      </div>

      {/* Habits Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-28 bg-surface rounded-2xl border border-slate-700 animate-pulse"></div>
           ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
          Error: {error}
        </div>
      ) : habits.length === 0 ? (
        <div className="p-12 bg-surface rounded-3xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Plus className="text-slate-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No habits tracked yet</h3>
          <p className="text-slate-400 max-w-sm mb-6">Create your first habit to start building your streak and earning XP.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
          >
            Create Habit
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </motion.div>
      )}

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userId={USER_ID}
      />
    </div>
  );
}