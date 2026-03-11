import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

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
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Bell color="var(--text-secondary)" size={20} />
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--danger-red)',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px var(--danger-red-glow)'
                    }}></span>
                </div>

                <div className="user-profile">
                    <div className="user-avatar">A</div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Admin</span>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
