import axios from 'axios';
import { apiBaseUrl } from '../config/apiConfig';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Interceptor to attach Token and Branch
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const activeBranchStr = localStorage.getItem('activeBranch');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeBranchStr) {
        try {
            const activeBranch = JSON.parse(activeBranchStr);
            if (activeBranch && activeBranch.id) {
                config.headers['X-Branch-Id'] = activeBranch.id.toString();
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
