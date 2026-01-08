import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Decode token manually or better, invoke a 'me' endpoint
            // For now, simple decode to check expiry
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                if (payload.exp * 1000 > Date.now()) {
                    setUser({
                        username: payload.sub,
                        role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
                        fullName: payload.FullName
                    });
                } else {
                    localStorage.removeItem('token');
                }
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password, tenantId = 1) => {
        try {
            // Hardcoding Tenant 1 for now until we have Tenant selection UI
            api.defaults.headers.common['X-Tenant-Id'] = tenantId;

            const response = await api.post('/Auth/login', { username, password, tenantId });
            const { token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('tenantId', tenantId);

            // Decode again to set user state
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            setUser({
                username: payload.sub,
                role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
                fullName: payload.FullName
            });

            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
