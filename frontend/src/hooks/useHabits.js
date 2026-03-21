import { useState, useEffect, useCallback } from 'react';
import { fetchHabits, logHabitEntry } from '../api/habits';

export const useHabits = (userId) => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await fetchHabits(userId);
            setHabits(data);
        } catch (err) {
            setError("Failed to load habits");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const completeHabit = async (habitId) => {
        try {
            await logHabitEntry({
                habit_id: habitId,
                log_date: new Date().toISOString().split('T')[0],
                completed: true,
                value: 1
            });
            // Refresh data to update streaks/stats
            await loadData();
        } catch (err) {
            console.error("Error logging habit:", err);
        }
    };

    return { habits, loading, error, completeHabit, refresh: loadData };
};
