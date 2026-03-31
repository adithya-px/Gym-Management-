"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Activity, Info, LogOut, DollarSign, MessageCircle, Apple, Edit2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import '../chartSetup';
import WorkoutLog from '../components/WorkoutLog';
import ProgressTracker from '../components/ProgressTracker';
import NotificationBell from '../components/NotificationBell';

const API = API_BASE;

const MemberDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [messages, setMessages] = useState([]);
    const [dietPlan, setDietPlan] = useState(null);
    const [showBarChart, setShowBarChart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [personalForm, setPersonalForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        date_of_birth: ''
    });
    const [classBookings, setClassBookings] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes, msgRes, dietRes, bookingsRes] = await Promise.all([
                    axios.get(`${API}/member/${user.id}/stats`),
                    axios.get(`${API}/member/${user.id}/charts`),
                    axios.get(`${API}/member/${user.id}/messages`),
                    axios.get(`${API}/member/${user.id}/diet-plan`).catch(() => ({ data: null })),
                    axios.get(`${API}/member/${user.id}/bookings`).catch(() => ({ data: [] }))
                ]);
                setStats(statsRes.data);
                setCharts(chartsRes.data);
                setMessages(msgRes.data);
                setDietPlan(dietRes.data);
                setClassBookings(bookingsRes.data);
            } catch (err) {
                console.error('Failed to fetch member data', err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) fetchData();
    }, [user]);

    useEffect(() => {
        if (!stats?.member) return;
        setPersonalForm({
            first_name: stats.member.first_name || '',
            last_name: stats.member.last_name || '',
            phone: stats.member.phone || '',
            email: stats.member.email || '',
            address: stats.member.address || '',
            date_of_birth: stats.member.date_of_birth || ''
        });
    }, [stats]);

    if (loading || !stats) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
                <div style={{ textAlign: 'center', color: 'var(--electric-blue)' }}>
                    <Activity size={40} style={{ animation: 'spin 2s linear infinite' }} />
                    <p style={{ marginTop: '1rem', fontFamily: 'Outfit' }}>Loading Your Portal...</p>
                </div>
            </div>
        );
    }

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const getInitials = (name) => {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
        return (first + last).toUpperCase();
    };

    const getISOWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const toDateSafe = (isoDate) => {
        if (!isoDate) return null;
        const d = new Date(`${isoDate}T00:00:00`);
        // Guard against invalid dates
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const formatPrettyDate = (isoDate) => {
        const d = toDateSafe(isoDate);
        if (!d) return '—';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatPrettyDateTime = (value) => {
        if (!value) return '—';
        // Backend returns "YYYY-MM-DD HH:mm" for some fields; keep it readable.
        if (typeof value === 'string' && value.includes(' ')) {
            const [datePart, timePart] = value.split(' ');
            return `${formatPrettyDate(datePart)} ${timePart}`;
        }
        return formatPrettyDate(value);
    };

    const today = new Date();
    const isoWeek = getISOWeekNumber(today);
    const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Member';
    const greetingDate = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const avatarInitials = getInitials(user?.name);

    const activePlan = stats.activePlan || null;
    const validUntil = stats.validUntil || activePlan?.end_date || null;
    const membershipActive = validUntil ? toDateSafe(validUntil) && toDateSafe(validUntil) >= new Date(new Date().toDateString()) : false;

    const payments = charts?.payments || [];
    const currentPaymentYear = today.getFullYear();
    const totalPaidThisYear = payments
        .filter(p => (p.payment_date || '').toString().startsWith(String(currentPaymentYear)))
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const thisMonthVisits = stats.thisMonthVisits ?? 0;
    const prevMonthVisits = stats.prevMonthVisits ?? 0;
    const visitsDelta = stats.visitsDelta ?? 0;

    // Attendance (new structured fields from backend)
    const attendanceCalendar = charts?.attendance_calendar || null;
    const attendanceStreak = charts?.attendance_streak || null;
    const monthSummary = charts?.attendance_month_summary || null;
    const stacked6mo = charts?.attendance_stacked_6mo || null;

    const stackedAttendanceData = stacked6mo
        ? {
            labels: stacked6mo.labels,
            datasets: [
                {
                    label: 'Present',
                    data: stacked6mo.present,
                    backgroundColor: 'rgba(29, 158, 117, 0.35)',
                    borderColor: '#1D9E75',
                    borderWidth: 1,
                },
                {
                    label: 'Absent',
                    data: stacked6mo.absent,
                    backgroundColor: 'rgba(102, 252, 241, 0.25)',
                    borderColor: 'var(--electric-blue)',
                    borderWidth: 1,
                },
                {
                    label: 'Rest',
                    data: stacked6mo.rest,
                    backgroundColor: 'rgba(255, 165, 2, 0.25)',
                    borderColor: 'var(--amber-orange)',
                    borderWidth: 1,
                }
            ]
        }
        : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true }
        }
    };

    // Next session (UI-side schedule assumption)
    const sessionDayIndices = [1, 3, 5]; // Mon/Wed/Fri (JS getDay: Sun=0)
    const nextSessionTimeLabel = '6:00 PM';
    const endDate = toDateSafe(activePlan?.end_date);
    const nextSessionDate = (() => {
        if (!endDate) return null;
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        for (let i = 0; i < 30; i++) {
            const candidate = new Date(start);
            candidate.setDate(start.getDate() + i);
            if (candidate > endDate) break;
            if (sessionDayIndices.includes(candidate.getDay())) return candidate;
        }
        return null;
    })();

    const nextSessionLabel = nextSessionDate
        ? nextSessionDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

    const attendanceViewLabel = showBarChart ? 'Stacked Chart' : '4-Week Calendar';

    const planStartDate = toDateSafe(activePlan?.start_date);
    const planEndDate = toDateSafe(activePlan?.end_date);
    const planProgressPercent = planStartDate && planEndDate
        ? clamp(((today.getTime() - planStartDate.getTime()) / Math.max(1, (planEndDate.getTime() - planStartDate.getTime()))) * 100, 0, 100)
        : 0;

    const trainerName = activePlan?.instructor_name || '—';
    const sessionDaysLabel = 'Mon, Wed, Fri';

    const trainerIsSessionDay = sessionDayIndices.includes(today.getDay());
    const hour = today.getHours();
    const trainerLiveAvailable = trainerIsSessionDay && hour >= 17 && hour <= 20;
    const trainerAvailabilityColor = trainerLiveAvailable ? '#1D9E75' : trainerIsSessionDay ? 'var(--amber-orange)' : 'rgba(255,255,255,0.15)';
    const trainerAvailabilityText = trainerLiveAvailable ? 'Live now' : trainerIsSessionDay ? 'Scheduled' : 'Offline';

    const planStartLabel = planStartDate ? formatPrettyDate(activePlan?.start_date) : '—';
    const planEndLabel = planEndDate ? formatPrettyDate(activePlan?.end_date) : '—';

    const dietMacros = dietPlan
        ? (() => {
            const proteinG = Number(dietPlan.protein_g || 0);
            const carbsG = Number(dietPlan.carbs_g || 0);
            const kcalGoal = Number(dietPlan.kcal_goal || 0);
            const proteinKcal = proteinG * 4;
            const carbsKcal = carbsG * 4;
            // Remaining calories treated as fats (9 kcal/g) for a 3-way split.
            const fatKcal = Math.max(0, kcalGoal - proteinKcal - carbsKcal);
            const fatG = fatKcal / 9;

            const totalKcal = Math.max(1, proteinKcal + carbsKcal + fatKcal);
            const proteinPct = clamp((proteinKcal / totalKcal) * 100, 0, 100);
            const carbsPct = clamp((carbsKcal / totalKcal) * 100, 0, 100);
            const fatPct = clamp((fatKcal / totalKcal) * 100, 0, 100);

            // Normalize so percentages add to 100 exactly (prevents small rounding drift)
            const sumPct = proteinPct + carbsPct + fatPct;
            if (sumPct > 0) {
                return {
                    proteinG,
                    carbsG,
                    fatG,
                    proteinPct: (proteinPct / sumPct) * 100,
                    carbsPct: (carbsPct / sumPct) * 100,
                    fatPct: (fatPct / sumPct) * 100
                };
            }

            return { proteinG, carbsG, fatG, proteinPct: 0, carbsPct: 0, fatPct: 0 };
        })()
        : null;

    const handleCancelPersonalEdit = () => {
        if (!stats?.member) return;
        setPersonalForm({
            first_name: stats.member.first_name || '',
            last_name: stats.member.last_name || '',
            phone: stats.member.phone || '',
            email: stats.member.email || '',
            address: stats.member.address || '',
            date_of_birth: stats.member.date_of_birth || ''
        });
        setIsEditingPersonal(false);
    };

    const handleSavePersonalEdit = async () => {
        try {
            const memberId = stats?.member?.member_id;
            if (!memberId) return;
            await axios.put(`${API}/members/${memberId}`, personalForm);
            const statsRes = await axios.get(`${API}/member/${user.id}/stats`);
            setStats(statsRes.data);
            setIsEditingPersonal(false);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save personal details');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-dark)' }}>
            {/* Top Navbar */}
            <header style={{
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                height: '52px',
                padding: '0 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Activity color="#1D9E75" fill="#1D9E75" size={28} />
                    <h1 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Neon Iron</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', letterSpacing: '0.5px' }}>MEMBER PORTAL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <NotificationBell role="member" userId={user?.id} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: '#1D9E75',
                            color: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800
                        }}>
                            {avatarInitials}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Welcome, {user?.name}</div>
                    </div>
                    <button onClick={logout} style={{
                        background: 'transparent', border: '1px solid var(--danger-red)',
                        color: 'var(--danger-red)', padding: '0.4rem 1rem', borderRadius: '0.25rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                {/* Greeting + membership status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0, fontSize: '1.6rem' }}>
                                Good morning, {firstName} <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500, marginLeft: '0.5rem' }}>· {greetingDate} · Week {isoWeek}</span>
                            </h2>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: `1px solid ${membershipActive ? 'rgba(29, 158, 117, 0.45)' : 'rgba(255, 165, 2, 0.35)'}`,
                                backgroundColor: membershipActive ? 'rgba(29, 158, 117, 0.12)' : 'rgba(255, 165, 2, 0.10)',
                                color: membershipActive ? '#1D9E75' : 'var(--amber-orange)'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: membershipActive ? '#1D9E75' : 'var(--amber-orange)'
                                }} />
                                {membershipActive ? 'Elite+ active' : 'Elite+ inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Plan Progress */}
                    <div className="neon-card" style={{ padding: '1.5rem', borderTop: '3px solid #1D9E75' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Active Plan
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>
                                {activePlan ? `${Math.round(planProgressPercent)}%` : '—'}
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', fontSize: '18px', fontWeight: 900, marginBottom: '0.7rem' }}>
                            {activePlan?.plan_name || 'No Plan'}
                        </div>

                        <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', height: '10px', marginBottom: '0.7rem' }}>
                            <div style={{ width: `${planProgressPercent}%`, height: '100%', backgroundColor: '#1D9E75' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>Start: {planStartLabel}</span>
                            <span>End: {planEndLabel}</span>
                        </div>
                    </div>

                    {/* Visits Trend (this month delta) */}
                    <GlowCard className="neon-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--electric-blue)' }} customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Visits This Month
                            </div>
                            <div style={{ color: visitsDelta >= 0 ? '#1D9E75' : 'var(--amber-orange)', fontWeight: 900, fontSize: '0.9rem' }}>
                                {visitsDelta >= 0 ? `↑ +${visitsDelta}` : `↓ ${visitsDelta}`}
                            </div>
                        </div>

                        <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '24px', letterSpacing: '0.2px', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {thisMonthVisits}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            vs last month: {prevMonthVisits}
                        </div>
                    </GlowCard>

                    {/* Next Session */}
                    <GlowCard className="neon-card" style={{ padding: '1.5rem', borderTop: '3px solid var(--amber-orange)' }} customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Next Session
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>
                                {nextSessionTimeLabel}
                            </div>
                        </div>

                        <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                            {nextSessionDate ? nextSessionLabel : 'No session scheduled'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Trainer: {trainerName}
                        </div>
                    </GlowCard>

                    {/* Trainer Availability */}
                    <GlowCard className="neon-card" style={{ padding: '1.5rem', borderTop: '3px solid #1D9E75' }} customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Trainer
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>
                                {trainerAvailabilityText}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.55rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: trainerAvailabilityColor }} />
                            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)' }}>
                                {trainerName}
                            </div>
                        </div>

                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Session days: {sessionDaysLabel}
                        </div>
                    </GlowCard>
                </div>

                {/* My Upcoming Classes */}
                {classBookings.filter(b => b.status === 'confirmed').length > 0 && (
                    <GlowCard className="neon-card" customSize={true} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                            <Calendar size={18} color="var(--electric-blue)" /> My Upcoming Classes
                        </h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {classBookings.filter(b => b.status === 'confirmed').slice(0, 4).map(b => (
                                <div key={b.booking_id} style={{
                                    padding: '0.75rem 1rem', backgroundColor: 'rgba(102, 252, 241, 0.05)',
                                    border: '1px solid rgba(102, 252, 241, 0.15)', borderRadius: '0.6rem', minWidth: '200px'
                                }}>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{b.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                        {b.day_of_week} · {b.start_time}–{b.end_time}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.1rem' }}>{b.booked_date}</div>
                                </div>
                            ))}
                        </div>
                    </GlowCard>
                )}

                {/* Data Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Attendance */}
                    <GlowCard className="neon-card" customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0 }}>Attendance</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    {showBarChart ? 'Present / Absent / Rest (stacked)' : '4-week calendar'}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBarChart(!showBarChart)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--electric-blue)',
                                    color: 'var(--electric-blue)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.4rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {showBarChart ? 'Show 4-Week Calendar' : 'Show 6-Month Stacked Chart'}
                            </button>
                        </div>

                        {attendanceCalendar ? (
                            showBarChart ? (
                                <div style={{ height: '260px' }}>
                                    {stackedAttendanceData ? (
                                        <Bar data={stackedAttendanceData} options={chartOptions} />
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No chart data.</div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {/* Day of week headers */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, idx) => (
                                            <div key={idx} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 900 }}>
                                                {w}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 4-week grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                                        {attendanceCalendar.weeks.flat().map((d, idx) => {
                                            const dayNum = d.date ? parseInt(d.date.split('-')[2], 10) : null;
                                            const status = d.status;
                                            const isOut = status === 'out';
                                            const cellBg =
                                                status === 'present'
                                                    ? '#1D9E75'
                                                    : status === 'absent'
                                                        ? 'rgba(252, 92, 101, 0.18)'
                                                        : status === 'rest'
                                                            ? 'rgba(255, 165, 2, 0.18)'
                                                            : 'rgba(255,255,255,0.03)';

                                            const cellBorder =
                                                status === 'present'
                                                    ? '1px solid rgba(29, 158, 117, 0.5)'
                                                    : status === 'absent'
                                                        ? '1px solid rgba(252, 92, 101, 0.35)'
                                                        : status === 'rest'
                                                            ? '1px solid rgba(255, 165, 2, 0.35)'
                                                            : '1px solid rgba(255,255,255,0.06)';

                                            const cellColor =
                                                status === 'present'
                                                    ? 'var(--bg-primary)'
                                                    : status === 'absent'
                                                        ? '#FC5C65'
                                                        : status === 'rest'
                                                            ? 'var(--amber-orange)'
                                                            : 'rgba(255,255,255,0.35)';

                                            return (
                                                <div
                                                    key={`${d.date || idx}-${idx}`}
                                                    title={d.date ? `${d.date} • ${status}` : status}
                                                    style={{
                                                        height: '40px',
                                                        borderRadius: '10px',
                                                        backgroundColor: cellBg,
                                                        border: cellBorder,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: isOut ? 'default' : 'pointer',
                                                        opacity: isOut ? 0.35 : 1,
                                                        transition: 'transform 0.15s ease'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: cellColor }}>
                                                        {dayNum || ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Streak widget */}
                                    {attendanceStreak && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <div>
                                                <span style={{ color: '#1D9E75', fontWeight: 900 }}>Current streak</span>: {attendanceStreak.current ?? 0}
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--electric-blue)', fontWeight: 900 }}>Personal best</span>: {attendanceStreak.best ?? 0}
                                            </div>
                                        </div>
                                    )}

                                    {/* Monthly summary counts */}
                                    {monthSummary && (
                                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                <span style={{ color: '#1D9E75', fontWeight: 900 }}>Present {monthSummary.present ?? 0}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>·</span>
                                                <span style={{ color: 'var(--electric-blue)', fontWeight: 900 }}>Absent {monthSummary.absent ?? 0}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>·</span>
                                                <span style={{ color: 'var(--amber-orange)', fontWeight: 900 }}>Rest {monthSummary.rest ?? 0}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>Loading attendance...</div>
                        )}
                    </GlowCard>

                    {/* Payment History */}
                    <GlowCard className="neon-card" customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0 }}>Payment History</h3>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    {membershipActive ? 'Status' : 'Balance'}
                                </div>
                            </div>

                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.35rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 900,
                                border: `1px solid ${membershipActive ? 'rgba(29, 158, 117, 0.45)' : 'rgba(255, 165, 2, 0.40)'}`,
                                backgroundColor: membershipActive ? 'rgba(29, 158, 117, 0.12)' : 'rgba(255, 165, 2, 0.10)',
                                color: membershipActive ? '#1D9E75' : 'var(--amber-orange)'
                            }}>
                                {membershipActive ? 'All paid' : 'Pending'}
                            </span>
                        </div>

                        {payments.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No payments found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {payments.map((pay, i) => {
                                        const amountNum = parseFloat(pay.amount || 0);
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: '1rem',
                                                    backgroundColor: 'var(--bg-primary)',
                                                    borderRadius: '0.5rem',
                                                    borderLeft: '3px solid var(--electric-purple)',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.1rem' }}>
                                                        ₹{Number.isFinite(amountNum) ? amountNum.toFixed(2) : pay.amount}
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                        {formatPrettyDate(pay.payment_date)}
                                                    </span>
                                                </div>
                                                <div style={{ color: 'var(--electric-blue)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 800 }}>
                                                    {pay.plan_name}
                                                </div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                                    Valid: {formatPrettyDate(pay.valid_from)} → {formatPrettyDate(pay.valid_until)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ paddingTop: '0.95rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 900 }}>
                                    <span>Total paid · {currentPaymentYear}</span>
                                    <span style={{ color: '#1D9E75' }}>₹{totalPaidThisYear.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </GlowCard>
                </div>

                {/* Workout Log */}
                <GlowCard className="neon-card" style={{ marginBottom: '2rem' }} customSize={true}>
                    <WorkoutLog memberId={user.id} />
                </GlowCard>

                {/* Progress Tracker - Weight & Body Metrics */}
                <GlowCard className="neon-card" style={{ marginBottom: '2rem' }} customSize={true}>
                    <ProgressTracker memberId={user.id} />
                </GlowCard>

                {/* Diet Plan */}
                {dietPlan && (
                    <div className="neon-card" style={{ marginBottom: '2rem' }}>
                        {/* Header: plan + daily calories + last-updated moved here */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Apple size={24} color="var(--neon-green)" />
                                    <h3 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', fontWeight: 900 }}>
                                        Diet Plan
                                    </h3>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Updated {formatPrettyDateTime(dietPlan.updated_at)} by Coach {dietPlan.instructor_name}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
                                    {dietPlan.kcal_goal} kcal/day
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>
                                    Daily Calories
                                </div>
                            </div>
                        </div>

                        {/* Macro split + proportional bar */}
                        {dietMacros && (
                            <>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', height: '14px', marginBottom: '1.1rem' }}>
                                    <div style={{ width: `${dietMacros.proteinPct}%`, height: '100%', backgroundColor: 'var(--neon-green)' }} />
                                    <div style={{ width: `${dietMacros.carbsPct}%`, height: '100%', backgroundColor: 'var(--electric-blue)', marginLeft: '-0px' }} />
                                    <div style={{ width: `${dietMacros.fatPct}%`, height: '100%', backgroundColor: 'var(--amber-orange)' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid var(--neon-green)' }}>
                                        <div style={{ color: 'var(--neon-green)', fontWeight: 900 }}>{Math.round(dietMacros.proteinPct)}%</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '0.15rem' }}>Protein</div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.25rem', marginTop: '0.35rem' }}>{Math.round(dietMacros.proteinG)}g</div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid var(--electric-blue)' }}>
                                        <div style={{ color: 'var(--electric-blue)', fontWeight: 900 }}>{Math.round(dietMacros.carbsPct)}%</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '0.15rem' }}>Carbs</div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.25rem', marginTop: '0.35rem' }}>{Math.round(dietMacros.carbsG)}g</div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid var(--amber-orange)' }}>
                                        <div style={{ color: 'var(--amber-orange)', fontWeight: 900 }}>{Math.round(dietMacros.fatPct)}%</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '0.15rem' }}>Fats</div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.25rem', marginTop: '0.35rem' }}>{Math.round(dietMacros.fatG)}g</div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Meals row (single horizontal row) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                            {[
                                { key: 'breakfast', label: 'BREAKFAST', content: dietPlan.breakfast },
                                { key: 'lunch', label: 'LUNCH', content: dietPlan.lunch },
                                { key: 'dinner', label: 'DINNER', content: dietPlan.dinner },
                                { key: 'snacks', label: 'SNACKS', content: dietPlan.snacks }
                            ].map((m) => (
                                <div key={m.key} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 900, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                                        {m.label}
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.35 }}>
                                        {m.content || '—'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coach note */}
                        {dietPlan.notes && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(29, 158, 117, 0.10)', borderRadius: '0.5rem', border: '1px solid rgba(29, 158, 117, 0.28)', borderLeft: '5px solid #1D9E75' }}>
                                <div style={{ fontSize: '0.9rem', color: '#1D9E75', marginBottom: '0.35rem', fontWeight: 900 }}>
                                    Coach Note
                                </div>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                    {dietPlan.notes}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Personal Details + Messages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {/* Personal Details */}
                    <GlowCard className="neon-card" customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit' }}>Personal Details</h3>
                            <button
                                type="button"
                                onClick={() => (isEditingPersonal ? handleCancelPersonalEdit() : setIsEditingPersonal(true))}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--electric-blue)',
                                    color: 'var(--electric-blue)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 900
                                }}
                            >
                                <Edit2 size={16} />
                                {isEditingPersonal ? 'Close' : 'Edit'}
                            </button>
                        </div>

                        {!isEditingPersonal ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-secondary)' }}>
                                <div><strong>Email:</strong> {stats.member?.email}</div>
                                <div><strong>Phone:</strong> {stats.member?.phone}</div>
                                <div><strong>Joined:</strong> {stats.member?.join_date}</div>
                                <div><strong>Member ID:</strong> #{stats.member?.member_id}</div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 900, display: 'block', marginBottom: '0.3rem' }}>Email</label>
                                        <input
                                            type="email"
                                            value={personalForm.email}
                                            onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                                            style={{ width: '100%', padding: '0.7rem 0.8rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 900, display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                                        <input
                                            type="text"
                                            value={personalForm.phone}
                                            onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                            style={{ width: '100%', padding: '0.7rem 0.8rem', backgroundColor: 'rgba(11, 12, 16, 0.5)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleCancelPersonalEdit}
                                        style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 900 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSavePersonalEdit}
                                        style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 900 }}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </GlowCard>

                    {/* Messages Inbox */}
                    <GlowCard className="neon-card" customSize={true}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MessageCircle size={20} color="var(--electric-blue)" /> Messages from Coach
                            </h3>
                            {messages.length > 0 && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.35rem 0.6rem',
                                    borderRadius: '999px',
                                    fontSize: '0.8rem',
                                    fontWeight: 900,
                                    border: '1px solid rgba(29, 158, 117, 0.35)',
                                    backgroundColor: 'rgba(29, 158, 117, 0.12)',
                                    color: '#1D9E75'
                                }}>
                                    {Math.min(3, messages.length)} new
                                </span>
                            )}
                        </div>
                        {messages.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No messages yet.</div>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {messages.map((msg) => (
                                    <div key={msg.message_id} style={{
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '0.6rem',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <span style={{ color: 'var(--electric-blue)', fontWeight: 900, fontSize: '0.95rem' }}>{msg.from_name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 900, fontSize: '0.8rem' }}>{msg.sent_at}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlowCard>
                </div>
            </main>
        </div>
    );
};

export default MemberDashboard;
