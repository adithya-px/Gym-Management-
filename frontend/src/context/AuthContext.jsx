import React, { createContext, useState, useContext, useEffect } from 'react';
import { dashboardApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token on load
        const storedUser = localStorage.getItem('gym_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('gym_token', token);
        localStorage.setItem('gym_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('gym_token');
        localStorage.removeItem('gym_user');
        setUser(null);
        window.location.href = '/login';
    };

    if (loading) {
        return <div>Loading...</div>; // Could replace with Neon loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
