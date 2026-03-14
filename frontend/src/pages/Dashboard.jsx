import React from 'react';
import { useHabits } from '../hooks/useHabits';

export default function Dashboard() {
  // Replace with actual logic to get logged-in user ID later
  const userId = "your-user-uuid-here"; 
  const { habits, loading, error, completeHabit } = useHabits(userId);

  if (loading) return <div className="p-6 text-slate-400">Loading your progress...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="w-full h-full space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold">Zenith Dashboard</h1>
        <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Current Level</p>
            <p className="text-2xl font-mono text-primary">XP: 1,250</p>
        </div>
      </div>

      {/* Habits List */}
      <div className="grid gap-4">
        {habits.length === 0 ? (
          <div className="p-10 bg-surface rounded-2xl border border-dashed border-slate-700 text-center">
            <p className="text-slate-400">No habits tracked yet. Create a Macro Goal to begin.</p>
          </div>
        ) : (
          habits.map((habit) => (
            <div 
              key={habit.id} 
              className="p-5 bg-surface rounded-2xl border border-slate-700 flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{habit.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                        {habit.current_streak || 0} Day Streak
                    </span>
                </div>
                <p className="text-sm text-slate-400">{habit.description}</p>
              </div>

              <button
                onClick={() => completeHabit(habit.id)}
                className="h-12 w-12 rounded-xl bg-primary hover:bg-blue-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                title="Mark as completed"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}