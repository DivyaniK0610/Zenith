import { create } from 'zustand';
import { fetchHabits, createHabit as apiCreateHabit, logHabitEntry } from '../api/habits';
import apiClient from '../api/client';

export const useHabitStore = create((set, get) => ({
  habits: [],
  isLoading: false,
  error: null,
  userStats: null,
  // Set of habit IDs completed today (persists across re-renders)
  completedToday: new Set(),

  loadHabits: async (userId) => {
  set({ isLoading: true, error: null });
  try {
    const [habitsResponse, statsResponse] = await Promise.all([
      fetchHabits(userId),
      apiClient.get(`/api/v1/game/stats/${userId}`),
    ]);
    set({
      habits: habitsResponse.data || [],
      userStats: statsResponse.data.data,
      isLoading: false,
    });
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
      console.error('Failed to create habit:', error);
      throw error;
    }
  },

  markCompletedLocally: (habitId) => {
    set((state) => {
      const next = new Set(state.completedToday);
      next.add(habitId);
      return { completedToday: next };
    });
  },

  logHabit: async (habitId, completed = true, metricValue = null) => {
    // Optimistically mark as complete immediately
    get().markCompletedLocally(habitId);

    try {
      const today = new Date().toISOString().split('T')[0];
      const logData = { habit_id: habitId, log_date: today };

      if (metricValue !== null) {
        logData.metric_value = metricValue;
      } else {
        logData.completed = completed;
      }

      const response = await logHabitEntry(logData);

      // Update userStats if gamification data is returned
      if (response?.gamification) {
        set({
          userStats: {
            xp: response.gamification.total_xp,
            level: response.gamification.level,
            current_streak: response.gamification.current_streak,
            longest_streak: response.gamification.longest_streak,
          },
        });
        return response.gamification;
      }

      return response;
    } catch (error) {
      if (error.response?.status === 409) {
        // Already logged today — keep it marked complete, return null quietly
        return null;
      }
      // Real error: undo the optimistic update
      set((state) => {
        const next = new Set(state.completedToday);
        next.delete(habitId);
        return { completedToday: next };
      });
      console.error('Failed to log habit:', error);
      throw error;
    }
  },

  setUserStats: (stats) => set({ userStats: stats }),
}));