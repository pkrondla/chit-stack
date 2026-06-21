import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import Register from './pages/Public/Register';
import Subscribe from './pages/Public/Subscribe';
import OrderStatus from './pages/Public/OrderStatus';
import PaymentEntry from './pages/Public/PaymentEntry';

import UserManagement from './pages/Admin/UserManagement';
import Tenants from './pages/Admin/Tenants';
import Catalog from './pages/Admin/Catalog';
import Orders from './pages/Admin/Orders';
import Settings from './pages/Admin/Settings';

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
                {/* Public routes — no auth required */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/orders/:orderRef" element={<OrderStatus />} />
                <Route path="/orders/:orderRef/payment" element={<PaymentEntry />} />

                {/* Protected admin routes */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tenants" element={<Tenants />} />
                    <Route path="admin/users" element={<UserManagement />} />
                    <Route path="admin/catalog" element={<Catalog />} />
                    <Route path="admin/orders" element={<Orders />} />
                    <Route path="admin/settings" element={<Settings />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
