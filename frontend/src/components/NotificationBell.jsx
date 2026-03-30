import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Check, Trash2, Info } from 'lucide-react';

const API = 'http://localhost:5000/api';

const NotificationBell = ({ userId, role }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                axios.get(`${API}/notifications/${role}/${userId}`),
                axios.get(`${API}/notifications/${role}/${userId}/unread-count`)
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(countRes.data.count);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        if (userId && role) {
            fetchNotifications();
            // Optional: set up polling here if needed
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [userId, role]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.put(`${API}/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all/${role}/${userId}`);
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div 
                onClick={toggleDropdown}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    color: 'var(--text-secondary)'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: 'var(--danger-red)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        height: '16px',
                        minWidth: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid var(--bg-primary)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    width: '320px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.02)'
                    }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                style={{
                                    background: 'none', border: 'none', 
                                    color: 'var(--electric-blue)', fontSize: '0.8rem',
                                    cursor: 'pointer', padding: 0, fontWeight: 600
                                }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications to show.</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div 
                                    key={notif.notification_id}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        backgroundColor: notif.is_read ? 'transparent' : 'rgba(29, 158, 117, 0.05)',
                                        display: 'flex',
                                        gap: '1rem',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div style={{ marginTop: '2px', color: notif.type.includes('overdue') ? 'var(--danger-red)' : 'var(--electric-blue)' }}>
                                        <Info size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <div style={{ 
                                                color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                fontWeight: notif.is_read ? 500 : 700,
                                                fontSize: '0.9rem'
                                            }}>
                                                {notif.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                                {notif.created_at.split(' ')[0]}
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: notif.is_read ? 0 : '8px' }}>
                                            {notif.message}
                                        </div>
                                        {!notif.is_read && (
                                            <button 
                                                onClick={(e) => markAsRead(notif.notification_id, e)}
                                                style={{
                                                    background: 'transparent', border: 'none',
                                                    color: '#1D9E75', fontSize: '0.8rem',
                                                    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                                                }}
                                            >
                                                <Check size={14} /> Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
