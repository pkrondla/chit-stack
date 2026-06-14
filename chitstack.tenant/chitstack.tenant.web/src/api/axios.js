import axios from 'axios';
import { apiBaseUrl } from '../config/apiConfig';

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach Token and Branch to every request
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

// Intercept 402 TrialExpired — redirect to trial-expired page
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 402 &&
            error.response?.data?.error === 'TrialExpired'
        ) {
            // Clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('activeBranch');
            localStorage.removeItem('authorizedBranches');
            // Navigate to the trial-expired page
            window.location.href = '/trial-expired';
        }
        return Promise.reject(error);
    }
);

export default api;
