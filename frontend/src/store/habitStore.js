import { create } from 'zustand';
import { fetchHabits, createHabit as apiCreateHabit, logHabitEntry } from '../api/habits';

export const useHabitStore = create((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,

  loadHabits: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchHabits(userId);
      // The FastAPI backend wraps the array in a 'data' key based on routes_habits.py
      set({ habits: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch habits', isLoading: false });
    }
  },

  addHabit: async (habitData) => {
    try {
      const response = await apiCreateHabit(habitData);
      const newHabit = response.data;
      set((state) => ({ habits: [...state.habits, newHabit] }));
      return newHabit;
    } catch (error) {
      console.error("Failed to create habit:", error);
      throw error;
    }
  },

  logHabit: async (habitId, completed = true, metricValue = null) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logData = {
        habit_id: habitId,
        log_date: today,
      };
      
      if (metricValue !== null) {
          logData.metric_value = metricValue;
      } else {
          logData.completed = completed;
      }

      await logHabitEntry(logData);
    } catch (error) {
      console.error("Failed to log habit:", error);
      throw error;
    }
  }
}));