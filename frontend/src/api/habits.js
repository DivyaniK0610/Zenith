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
        notes: 'Completed Pomodoro session',
    };

    const response = await apiClient.post('/api/v1/habits/log', payload);
    return response.data;
};

/**
 * Fetch heatmap data for a user.
 * Calls GET /api/v1/game/heatmap/{userId} — the canonical endpoint
 * in routes_game.py wired to the analytics service.
 *
 * Response shape:
 *   { habits, date_range, matrix, weekly_summary }
 *
 * @param {string} userId
 * @param {number} weeks  1–52, default 12
 */
export const fetchHeatmapData = async (userId, weeks = 12) => {
    const response = await apiClient.get(`/api/v1/game/heatmap/${userId}`, {
        params: { weeks },
    });
    return response.data.data; // { habits, date_range, matrix, weekly_summary }
};

/**
 * Fetch daily completion rates for a user.
 * Calls GET /api/v1/game/daily-rate/{userId}
 *
 * Response shape: [{ date, completed, total, completion_rate }]
 *
 * @param {string} userId
 * @param {number} days   1–365, default 30
 */
export const fetchDailyRates = async (userId, days = 30) => {
    const response = await apiClient.get(`/api/v1/game/daily-rate/${userId}`, {
        params: { days },
    });
    return response.data.data; // [{ date, completed, total, completion_rate }]
};