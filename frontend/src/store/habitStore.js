import { create } from 'zustand';
import { fetchHabits, createHabit as apiCreateHabit, logHabitEntry, deleteHabit } from '../api/habits';
import apiClient from '../api/client';
import { toast } from 'sonner';

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
    const today = new Date().toISOString().split('T')[0];

    const [habitsResponse, statsResponse] = await Promise.all([
      fetchHabits(userId),
      apiClient.get(`/api/v1/game/stats/${userId}`),
    ]);

    const habits = habitsResponse.data || [];
    const habitIds = habits.map(h => h.id);

    // Fetch today's logs to restore completed state after refresh
    let completedIds = new Set();
    if (habitIds.length > 0) {
      const logsResponse = await apiClient.get(`/api/v1/habits/logs/today`, {
        params: { user_id: userId, date: today }
      });
      const todayLogs = logsResponse.data?.data || [];
      todayLogs.forEach(log => {
        const isDone =
          log.completed === true ||
          (log.metric_value !== null && log.metric_value > 0) ||
          (log.duration_logged !== null && log.duration_logged > 0);
        if (isDone) completedIds.add(log.habit_id);
      });
    }

    set({
      habits,
      userStats: statsResponse.data.data,
      completedToday: completedIds,
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

  removeHabit: async (habitId) => {
  try {
    await deleteHabit(habitId);
    set((state) => ({
      habits: state.habits.filter(h => h.id !== habitId),
      completedToday: (() => {
        const next = new Set(state.completedToday);
        next.delete(habitId);
        return next;
      })(),
    }));
    toast('Habit deleted', { duration: 2000 });
  } catch (error) {
    toast.error('Failed to delete habit');
    throw error;
  }
},

  archiveHabit: async (habitId) => {
  try {
    await apiClient.patch(`/api/v1/habits/${habitId}`, { status: 'archived' });
    set((state) => ({
      habits: state.habits.filter(h => h.id !== habitId),
    }));
    toast('Habit archived', { duration: 2000 });
  } catch (error) {
    toast.error('Failed to archive habit');
    throw error;
  }
},

pauseHabit: async (habitId, pauseUntil = null) => {
  try {
    await apiClient.patch(`/api/v1/habits/${habitId}`, {
      status: 'paused',
      ...(pauseUntil && { pause_until: pauseUntil }),
    });
    set((state) => ({
      habits: state.habits.map(h =>
        h.id === habitId ? { ...h, status: 'paused', pause_until: pauseUntil } : h
      ),
    }));
    const msg = pauseUntil ? `Paused until ${new Date(pauseUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : "Habit paused";
    toast(msg, { duration: 2500 });
  } catch (error) {
    toast.error('Failed to pause habit');
    throw error;
  }
},

resumeHabit: async (habitId) => {
  try {
    await apiClient.patch(`/api/v1/habits/${habitId}`, { status: 'active', pause_until: null });
    set((state) => ({
      habits: state.habits.map(h =>
        h.id === habitId ? { ...h, status: 'active', pause_until: null } : h
      ),
    }));
    toast('Habit resumed', { duration: 2000 });
  } catch (error) {
    toast.error('Failed to resume habit');
    throw error;
  }
},

fetchArchivedHabits: async (userId) => {
  try {
    const response = await apiClient.get('/api/v1/habits/archived', { params: { user_id: userId } });
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
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

        const g = response.gamification;
        if (g.leveled_up) {
          toast(`⚡ Level ${g.level} unlocked — ${g.total_xp} XP total`, { duration: 4000 });
        } else if (g.milestone_bonus > 0) {
          toast(`🔥 ${g.current_streak}-day streak! +${g.xp_gained} XP`, { duration: 3500 });
        } else {
          toast(`✦ +${g.xp_gained} XP — ${g.message.replace(/^[^\w\s]+\s*/, '')}`, {
            duration: 2500,
            style: { color: 'var(--color-primary)' },
          });
        }

        return response.gamification;
      }

      return response;
    } catch (error) {
      if (error.response?.status === 409) {
        toast('Already logged today', {
          icon: '📅',
          duration: 2000,
          style: { color: 'var(--color-text-3)' },
        });
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