import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home,
    Users,
    Briefcase,
    ClipboardList,
    UserCheck,
    CreditCard,
    Dumbbell,
    Apple,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Dumbbell className="text-accent-secondary" size={28} />
                    <span>Neon</span>Iron
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                    <Home className="nav-item-icon" />
                    Dashboard
                </NavLink>

                <NavLink to="/members" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users className="nav-item-icon" />
                    Members
                </NavLink>

                <NavLink to="/instructors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Briefcase className="nav-item-icon" />
                    Instructors
                </NavLink>

                <NavLink to="/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ClipboardList className="nav-item-icon" />
                    Plans
                </NavLink>

                <NavLink to="/member-plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck className="nav-item-icon" />
                    Assignments
                </NavLink>

                <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck className="nav-item-icon" />
                    Attendance
                </NavLink>

                <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CreditCard className="nav-item-icon" />
                    Payments
                </NavLink>

                <NavLink to="/equipment" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Dumbbell className="nav-item-icon" />
                    Equipment
                </NavLink>

                <NavLink to="/diet-plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Apple className="nav-item-icon" />
                    Diet Plans
                </NavLink>
            </nav>

            <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
                <button
                    onClick={logout}
                    className="nav-item"
                    style={{
                        color: 'var(--danger-red)',
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut className="nav-item-icon" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
