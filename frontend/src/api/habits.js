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