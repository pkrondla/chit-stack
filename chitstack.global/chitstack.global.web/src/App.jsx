import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import useAffiliateAuthStore from './store/useAffiliateAuthStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import AffiliateLayout from './components/AffiliateLayout';
import Register from './pages/Public/Register';
import Subscribe from './pages/Public/Subscribe';
import OrderStatus from './pages/Public/OrderStatus';
import PaymentEntry from './pages/Public/PaymentEntry';

import UserManagement from './pages/Admin/UserManagement';
import Tenants from './pages/Admin/Tenants';
import Catalog from './pages/Admin/Catalog';
import Orders from './pages/Admin/Orders';
import Settings from './pages/Admin/Settings';
import Affiliates from './pages/Admin/Affiliates';
import AffiliateCommissionsAdmin from './pages/Admin/AffiliateCommissions';

import AffiliateLogin from './pages/Affiliate/AffiliateLogin';
import AffiliateRegister from './pages/Affiliate/AffiliateRegister';
import AffiliateDashboard from './pages/Affiliate/AffiliateDashboard';
import AffiliateCommissions from './pages/Affiliate/AffiliateCommissions';
import AffiliatePayouts from './pages/Affiliate/AffiliatePayouts';
import AffiliateTenants from './pages/Affiliate/AffiliateTenants';

const Dashboard = () => <div><h2>Global Admin Dashboard</h2><p>Select a module from the sidebar.</p></div>;

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const AffiliateProtectedRoute = ({ children }) => {
    const affiliate = useAffiliateAuthStore((state) => state.affiliate);
    if (!affiliate) return <Navigate to="/affiliate/login" />;
    return children;
};

function App() {
    useEffect(() => {
        useAuthStore.getState().initAuth();
        useAffiliateAuthStore.getState().initAuth();
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

                {/* Affiliate public routes */}
                <Route path="/affiliate/login" element={<AffiliateLogin />} />
                <Route path="/affiliate/register" element={<AffiliateRegister />} />

                {/* Affiliate portal — protected */}
                <Route path="/affiliate" element={<AffiliateProtectedRoute><AffiliateLayout /></AffiliateProtectedRoute>}>
                    <Route index element={<Navigate to="/affiliate/dashboard" replace />} />
                    <Route path="dashboard" element={<AffiliateDashboard />} />
                    <Route path="commissions" element={<AffiliateCommissions />} />
                    <Route path="payouts" element={<AffiliatePayouts />} />
                    <Route path="tenants" element={<AffiliateTenants />} />
                </Route>

                {/* Protected admin routes */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tenants" element={<Tenants />} />
                    <Route path="admin/users" element={<UserManagement />} />
                    <Route path="admin/catalog" element={<Catalog />} />
                    <Route path="admin/orders" element={<Orders />} />
                    <Route path="admin/settings" element={<Settings />} />
                    <Route path="admin/affiliates" element={<Affiliates />} />
                    <Route path="admin/affiliate-commissions" element={<AffiliateCommissionsAdmin />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
