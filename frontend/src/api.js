import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const authApi = {
    login: async (credentials) => {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials);
        return response.data;
    }
};

export const dashboardApi = {
    getStats: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },
    getCharts: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/charts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard charts:', error);
            throw error;
        }
    }
};

export const membersApi = {
    getAll: async () => {
        const res = await axios.get(`${API_BASE_URL}/members`);
        return res.data;
    }
};
// Add others as needed
