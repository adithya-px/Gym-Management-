import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationBell from '../NotificationBell';

const TopNavbar = () => {
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';

        // Convert /member-plans to Member Plans
        const routeName = path.substring(1).split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return routeName;
    };

    return (
        <header className="top-navbar">
            <div className="page-title">{getPageTitle()}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <NotificationBell role="admin" userId={1} />
                <div className="user-profile">
                    <div className="user-avatar">A</div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Admin</span>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
