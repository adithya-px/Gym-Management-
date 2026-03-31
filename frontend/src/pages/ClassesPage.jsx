"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Users, Plus, X, UserCheck, Dumbbell, Flame, Zap, Heart } from 'lucide-react';
import OrbitalLoader from '../components/OrbitalLoader';
import axios from 'axios';

const API = API_BASE;

const categoryColors = {
    'Cardio': { bg: 'rgba(252, 92, 101, 0.12)', border: '#FC5C65', icon: <Flame size={16} /> },
    'Strength': { bg: 'rgba(102, 252, 241, 0.12)', border: 'var(--electric-blue)', icon: <Dumbbell size={16} /> },
    'Flexibility': { bg: 'rgba(184, 41, 234, 0.12)', border: 'var(--electric-purple)', icon: <Heart size={16} /> },
    'Functional': { bg: 'rgba(255, 165, 2, 0.12)', border: 'var(--amber-orange)', icon: <Zap size={16} /> },
};

const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ClassesPage = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [instructors, setInstructors] = useState([]);
    const [formData, setFormData] = useState({
        title: '', description: '', instructor_id: '', day_of_week: 'Monday',
        start_time: '09:00', end_time: '10:00', max_capacity: 20, category: 'Cardio'
    });

    const isAdmin = user?.role === 'admin';
    const isMember = user?.role === 'member';
    const isInstructor = user?.role === 'instructor';

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${API}/classes`);
            setClasses(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchBookings = async () => {
        if (!isMember || !user?.id) return;
        try {
            const res = await axios.get(`${API}/member/${user.id}/bookings`);
            setMyBookings(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchClasses(), fetchBookings()]);
            if (isAdmin) {
                try {
                    const res = await axios.get(`${API}/instructors`);
                    setInstructors(res.data);
                } catch (err) { console.error(err); }
            }
            setLoading(false);
        };
        init();
    }, [user]);

    // Get next date for a given day_of_week from today
    const getNextDate = (dayName) => {
        const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
        const today = new Date();
        const target = dayMap[dayName];
        const current = today.getDay();
        let daysAhead = target - current;
        if (daysAhead <= 0) daysAhead += 7;
        const next = new Date(today);
        next.setDate(today.getDate() + daysAhead);
        return next.toISOString().split('T')[0];
    };

    const handleBook = async (classItem) => {
        const bookedDate = getNextDate(classItem.day_of_week);
        try {
            await axios.post(`${API}/classes/${classItem.class_id}/book`, {
                member_id: user.id,
                booked_date: bookedDate
            });
            fetchBookings();
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.error || 'Booking failed');
        }
    };

    const handleCancel = async (bookingId) => {
        try {
            await axios.put(`${API}/bookings/${bookingId}/cancel`);
            fetchBookings();
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.error || 'Cancel failed');
        }
    };

    const handleCreate = async () => {
        try {
            await axios.post(`${API}/classes`, formData);
            setShowCreateModal(false);
            setFormData({ title: '', description: '', instructor_id: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', max_capacity: 20, category: 'Cardio' });
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.error || 'Create failed');
        }
    };

    const handleDelete = async (classId) => {
        if (!window.confirm('Deactivate this class?')) return;
        try {
            await axios.delete(`${API}/classes/${classId}`);
            fetchClasses();
        } catch (err) { alert('Failed to deactivate'); }
    };

    const isBookedForClass = (classId) => {
        return myBookings.find(b => b.class_id === classId && b.status === 'confirmed');
    };

    // Group classes by day
    const groupedByDay = dayOrder.reduce((acc, day) => {
        const dayClasses = classes.filter(c => c.day_of_week === day);
        if (dayClasses.length > 0) acc[day] = dayClasses;
        return acc;
    }, {});

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
                <OrbitalLoader message="Loading Class Schedule..." />

            </div>
        );
    }

    const inputStyle = {
        width: '100%', padding: '0.7rem 0.8rem', backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)', borderRadius: '0.5rem',
        color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit'
    };
    const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={24} /> Class Schedule
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        {isMember ? 'Browse and book group classes' : isInstructor ? 'Manage your class schedule' : 'Manage all gym classes'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowCreateModal(true)} style={{
                        padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                        color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem'
                    }}>
                        <Plus size={18} /> Add Class
                    </button>
                )}
            </div>

            {/* My Upcoming Bookings (Member only) */}
            {isMember && myBookings.filter(b => b.status === 'confirmed').length > 0 && (
                <GlowCard className="neon-card" customSize={true} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCheck size={20} color="var(--neon-green)" /> My Upcoming Bookings
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {myBookings.filter(b => b.status === 'confirmed').map(booking => (
                            <div key={booking.booking_id} style={{
                                padding: '0.85rem 1.1rem', backgroundColor: 'rgba(29, 158, 117, 0.08)',
                                border: '1px solid rgba(29, 158, 117, 0.25)', borderRadius: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>{booking.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                                        {booking.day_of_week} · {booking.start_time}–{booking.end_time} · {booking.booked_date}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                                        with {booking.instructor_name}
                                    </div>
                                </div>
                                <button onClick={() => handleCancel(booking.booking_id)} title="Cancel booking" style={{
                                    background: 'transparent', border: '1px solid var(--danger-red)',
                                    color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.4rem',
                                    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700
                                }}>Cancel</button>
                            </div>
                        ))}
                    </div>
                </GlowCard>
            )}

            {/* Weekly Schedule Grid */}
            {Object.keys(groupedByDay).length === 0 ? (
                <GlowCard className="neon-card" customSize={true} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Calendar size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No classes scheduled yet.</p>
                </GlowCard>
            ) : (
                Object.entries(groupedByDay).map(([day, dayClasses]) => (
                    <div key={day} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{
                            fontFamily: 'Outfit', color: 'var(--electric-blue)', fontSize: '1.05rem',
                            marginBottom: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <span style={{
                                width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(102, 252, 241, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
                            }}>{day.substring(0, 2)}</span>
                            {day}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                            {dayClasses.map(cls => {
                                const catStyle = categoryColors[cls.category] || categoryColors['Functional'];
                                const booked = isBookedForClass(cls.class_id);
                                const spotsLeft = cls.max_capacity - (cls.current_bookings || 0);
                                const isFull = spotsLeft <= 0;
                                return (
                                    <GlowCard key={cls.class_id} className="neon-card" customSize={true} style={{
                                        borderLeft: `4px solid ${catStyle.border}`, padding: '1.25rem',
                                        transition: 'transform 0.2s', cursor: 'default'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                                    <span style={{
                                                        padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem',
                                                        fontWeight: 800, backgroundColor: catStyle.bg, color: catStyle.border,
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                    }}>
                                                        {catStyle.icon} {cls.category}
                                                    </span>
                                                </div>
                                                <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.05rem' }}>{cls.title}</div>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(cls.class_id)} title="Deactivate" style={{
                                                    background: 'transparent', border: 'none', color: 'var(--danger-red)',
                                                    cursor: 'pointer', padding: '0.25rem'
                                                }}><X size={16} /></button>
                                            )}
                                        </div>
                                        {cls.description && (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.4 }}>{cls.description}</p>
                                        )}
                                        <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {cls.start_time}–{cls.end_time}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={14} /> {spotsLeft} / {cls.max_capacity} spots</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Coach {cls.instructor_name}</div>
                                            {isMember && (
                                                booked ? (
                                                    <button onClick={() => handleCancel(booked.booking_id)} style={{
                                                        padding: '0.4rem 0.8rem', border: '1px solid var(--danger-red)',
                                                        background: 'transparent', color: 'var(--danger-red)',
                                                        borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                                                    }}>Cancel Booking</button>
                                                ) : (
                                                    <button onClick={() => handleBook(cls)} disabled={isFull} style={{
                                                        padding: '0.4rem 0.8rem', border: `1px solid ${isFull ? 'var(--text-muted)' : 'var(--neon-green)'}`,
                                                        background: isFull ? 'transparent' : 'rgba(29, 158, 117, 0.08)',
                                                        color: isFull ? 'var(--text-muted)' : 'var(--neon-green)',
                                                        borderRadius: '0.4rem', cursor: isFull ? 'not-allowed' : 'pointer',
                                                        fontWeight: 700, fontSize: '0.8rem'
                                                    }}>{isFull ? 'Full' : 'Book Spot'}</button>
                                                )
                                            )}
                                        </div>
                                    </GlowCard>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Create Modal (Admin only) */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem',
                        border: '1px solid var(--border-color)', width: '500px', maxHeight: '85vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0 }}>Create New Class</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Class Title *</label>
                                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} placeholder="e.g. Morning HIIT" />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, resize: 'vertical'}} rows={2} placeholder="Optional description" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Instructor *</label>
                                    <select value={formData.instructor_id} onChange={e => setFormData({...formData, instructor_id: e.target.value})} style={inputStyle}>
                                        <option value="">Select instructor</option>
                                        {instructors.map(i => (
                                            <option key={i.instructor_id} value={i.instructor_id}>{i.first_name} {i.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle}>
                                        {Object.keys(categoryColors).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Day *</label>
                                    <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})} style={inputStyle}>
                                        {dayOrder.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Start Time</label>
                                    <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>End Time</label>
                                    <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Max Capacity</label>
                                <input type="number" value={formData.max_capacity} onChange={e => setFormData({...formData, max_capacity: e.target.value})} style={inputStyle} min={1} />
                            </div>
                            <button onClick={handleCreate} disabled={!formData.title || !formData.instructor_id} style={{
                                padding: '0.75rem', border: '1px solid var(--neon-green)', background: 'rgba(29, 158, 117, 0.08)',
                                color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem',
                                marginTop: '0.5rem'
                            }}>Create Class</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesPage;
