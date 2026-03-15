import axios from 'axios';

// This is the local address where your FastAPI server runs
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Health Check Function
 * This hits the /health endpoint that Rutwik (your backend partner) set up.
 */
export const checkBackendHealth = async () => {
    try {
        const response = await apiClient.get('/health');
        console.log("🚀 Zenith Frontend connected to Backend!");
        console.log("Backend says:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Connection to Backend failed. Is the FastAPI server running?");
        console.error("Error details:", error.message);
        throw error;
    }
};

export default apiClient;