import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5062/api').replace(/\/+$/, '');

const affiliateApi = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

affiliateApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('affiliate_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default affiliateApi;
