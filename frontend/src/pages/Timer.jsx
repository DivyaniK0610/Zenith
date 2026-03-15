import React, { useState, useEffect } from 'react';
import { logPomodoroSession } from '../api/habits';
import { toast } from 'sonner'; // Using the toaster you just installed

const DEFAULT_TIME = 25 * 60; // 25 minutes in seconds

export default function Timer({ selectedHabitId = "YOUR_HABIT_ID_HERE" }) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished!
      clearInterval(interval);
      setIsActive(false);
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionComplete = async () => {
    if (!selectedHabitId) {
      toast.error("No habit selected for this session!");
      return;
    }
    
    setIsSaving(true);
    try {
      // Log 25 minutes to the backend
      await logPomodoroSession(selectedHabitId, 25);
      toast.success("Pomodoro completed! XP awarded. 🎉");
      // Reset timer for the next session
      setTimeLeft(DEFAULT_TIME); 
    } catch (error) {
      console.error("Failed to save session", error);
      toast.error("Failed to save your session. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_TIME);
  };

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 page-enter">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Focus Mode</h1>
        <p className="text-gray-500">Stay locked in. Earn XP.</p>
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center w-64 h-64 rounded-full bg-white shadow-xl border-4 border-indigo-500">
        <span className="text-6xl font-mono font-bold text-slate-800">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <button 
          onClick={toggleTimer}
          disabled={isSaving}
          className={`px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isActive ? 'Pause' : 'Start Focus'}
        </button>
        
        <button 
          onClick={resetTimer}
          disabled={isSaving}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
        >
          Reset
        </button>
      </div>

      {isSaving && <p className="text-sm text-indigo-500 animate-pulse">Syncing with Zenith...</p>}
      
      {/* Manual trigger for testing without waiting 25 mins */}
      <button 
        onClick={handleSessionComplete}
        className="text-xs text-gray-400 underline hover:text-gray-600 mt-10"
      >
        [Dev] Simulate Timer End
      </button>
    </div>
  );
}