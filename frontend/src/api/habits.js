import apiClient from './client';

// Fetch all habits for a user
export const fetchHabits = async (userId) => {
    const response = await apiClient.get('/api/v1/habits/', {
        params: { user_id: userId }
    });
    return response.data;
};

// Log a daily completion (Daily Logs)
export const logHabitEntry = async (logData) => {
    const response = await apiClient.post('/api/v1/habits/log', logData);
    return response.data;
};

// Create a new Habit
export const createHabit = async (habitData) => {
    const response = await apiClient.post('/api/v1/habits/', habitData);
    return response.data;
};

export const deleteHabit = async (habitId) => {
    const response = await apiClient.delete(`/api/v1/habits/${habitId}`);
    return response.data;
};

export const parseHabitDescription = async (description) => {
    const response = await apiClient.post('/api/v1/habits/parse', { description });
    return response.data;
};
/**
 * Saves a completed Pomodoro session as a habit log.
 * @param {string} habitId - The UUID of the habit.
 * @param {number} duration - Minutes spent focusing.
 */
export const logPomodoroSession = async (habitId, duration) => {
  const today = new Date().toISOString().split('T')[0];
  
  const payload = {
    habit_id: habitId,
    log_date: today,
    duration_logged: duration, 
    notes: "Completed Pomodoro session"
  };

  // Fixed: changed 'api' to 'apiClient' to match your import
  const response = await apiClient.post('/api/v1/habits/log', payload); 
  return response.data;
};

// Fetch Heatmap Data
export const fetchHeatmapData = async (userId, weeks = 12) => {
  const response = await apiClient.get('/api/v1/analytics/heatmap', {
    params: { user_id: userId, weeks: weeks }
  });
  return response.data.data;
};