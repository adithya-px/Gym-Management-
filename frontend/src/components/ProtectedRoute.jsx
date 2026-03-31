import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Not logged in, redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Role not authorized, redirect to appropriate dashboard
        const redirectMap = { admin: '/dashboard', member: '/member-dashboard', instructor: '/instructor-dashboard' };
        return <Navigate to={redirectMap[user?.role] || '/dashboard'} replace />;
    }

    return children;
};
