import { create } from 'zustand';
import api from '../api/axios';

const STORAGE_KEY = 'affiliate_token';

const useAffiliateAuthStore = create((set) => ({
    affiliate: null,
    loading: false,

    initAuth: () => {
        const token = localStorage.getItem(STORAGE_KEY);
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.Scope !== 'Affiliate') {
                    localStorage.removeItem(STORAGE_KEY);
                    return;
                }
                set({
                    affiliate: {
                        id: parseInt(payload.AffiliateId ?? payload.sub),
                        name: payload.FullName,
                        email: payload.email,
                        code: payload.AffiliateCode
                    }
                });
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    },

    login: async (email, password) => {
        set({ loading: true });
        try {
            const res = await api.post('/Affiliates/login', { email, password });
            const data = res.data.data;
            const token = data?.token;
            if (!token) throw new Error('Invalid response from server');

            localStorage.setItem(STORAGE_KEY, token);

            const affiliateData = {
                id: data.id,
                name: data.name,
                email: data.email,
                code: data.code,
                companyName: data.companyName
            };
            set({ affiliate: affiliateData, loading: false });
            return { success: true, affiliate: affiliateData };
        } catch (error) {
            set({ loading: false });
            const msg = error.response?.data?.errors?.[0] || error.response?.data?.message || 'Invalid credentials';
            return { success: false, message: msg };
        }
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ affiliate: null });
    },

    getToken: () => localStorage.getItem(STORAGE_KEY)
}));

export default useAffiliateAuthStore;
