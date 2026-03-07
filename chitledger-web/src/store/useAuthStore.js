import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: null,
    loading: false,

    initAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                set({
                    user: {
                        id: payload.sub,
                        username: payload.email,
                        fullName: payload.FullName,
                        role: payload.role
                    }
                });
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
    },

    login: async (username, password) => {
        set({ loading: true });
        try {
            const response = await api.post('/Auth/login', { username, password });
            const token = response.data.data || response.data.token || response.data;
            if (!token || typeof token !== 'string') {
                throw new Error("Invalid token received from server");
            }

            localStorage.setItem('token', token);

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userData = {
                id: payload.sub,
                username: payload.email,
                fullName: payload.FullName,
                role: payload.role
            };

            set({ user: userData, loading: false });
            return { success: true, user: userData };
        } catch (error) {
            set({ loading: false });
            return { success: false, message: error.response?.data?.message || 'Invalid credentials' };
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null });
    }
}));

export default useAuthStore;
