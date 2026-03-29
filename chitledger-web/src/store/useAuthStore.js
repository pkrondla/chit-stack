import { create } from 'zustand';
import api from '../api/axios';

const getInitialState = () => {
    const token = localStorage.getItem('token');
    const activeBranchStr = localStorage.getItem('activeBranch');
    const authBranchesStr = localStorage.getItem('authorizedBranches');

    let user = null;
    let activeBranch = null;
    let authorizedBranches = [];

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            user = {
                id: payload.sub || payload.nameid,
                username: payload.email,
                fullName: payload.FullName,
                role: payload.role,
                memberId: payload.MemberId ? parseInt(payload.MemberId) : null
            };
            activeBranch = activeBranchStr ? JSON.parse(activeBranchStr) : null;
            authorizedBranches = authBranchesStr ? JSON.parse(authBranchesStr) : [];
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('activeBranch');
            localStorage.removeItem('authorizedBranches');
        }
    }

    return { token, user, activeBranch, authorizedBranches };
};

const useAuthStore = create((set) => ({
    ...getInitialState(),
    loading: false,

    login: async (username, password, loginMode = 'Password', otp = '') => {
        set({ loading: true });
        try {
            const response = await api.post('/Auth/login', { username, password, loginMode, otp });
            const data = response.data.data || response.data;
            const token = data.token;

            if (!token || typeof token !== 'string') {
                throw new Error("Invalid token received from server");
            }

            localStorage.setItem('token', token);

            const branches = data.authorizedBranches || [];
            localStorage.setItem('authorizedBranches', JSON.stringify(branches));

            const defaultBranch = branches.length > 0 ? branches[0] : null;
            if (defaultBranch) {
                localStorage.setItem('activeBranch', JSON.stringify(defaultBranch));
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userData = {
                id: payload.sub || payload.nameid,
                username: payload.email,
                fullName: payload.FullName,
                role: payload.role,
                memberId: payload.MemberId ? parseInt(payload.MemberId) : null
            };

            set({
                token: token,
                user: userData,
                authorizedBranches: branches,
                activeBranch: defaultBranch,
                loading: false
            });

            return { success: true, user: userData };
        } catch (error) {
            set({ loading: false });
            return { success: false, message: error.response?.data?.message || 'Invalid credentials' };
        }
    },

    setActiveBranch: (branch) => {
        localStorage.setItem('activeBranch', JSON.stringify(branch));
        set({ activeBranch: branch });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeBranch');
        localStorage.removeItem('authorizedBranches');
        set({ token: null, user: null, activeBranch: null, authorizedBranches: [] });
    }
}));

export default useAuthStore;
