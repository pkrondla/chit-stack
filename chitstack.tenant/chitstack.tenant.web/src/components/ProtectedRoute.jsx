import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Loading from './Loading';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { token, user, loading } = useAuthStore();
    const location = useLocation();

    if (loading) {
        return <Loading fullScreen />;
    }

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
