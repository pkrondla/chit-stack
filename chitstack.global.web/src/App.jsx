import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Layout from './components/Layout';

import UserManagement from './pages/Admin/UserManagement';
import Tenants from './pages/Admin/Tenants';

// Placeholder Pages
const Dashboard = () => <div><h2>Global Admin Dashboard</h2><p>Select a module from the sidebar.</p></div>;

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
    useEffect(() => {
        useAuthStore.getState().initAuth();
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tenants" element={<Tenants />} />
                    <Route path="admin/users" element={<UserManagement />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
