import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NeonCard } from '../components/NeonCard';
import { Calendar, Activity, Info, LogOut, DollarSign, MessageCircle, User } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import '../chartSetup';

const API = 'http://localhost:5000/api';

const MemberDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes, msgRes] = await Promise.all([
                    axios.get(`${API}/member/${user.id}/stats`),
                    axios.get(`${API}/member/${user.id}/charts`),
                    axios.get(`${API}/member/${user.id}/messages`)
                ]);
                setStats(statsRes.data);
                setCharts(chartsRes.data);
                setMessages(msgRes.data);
            } catch (err) {
                console.error('Failed to fetch member data', err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) fetchData();
    }, [user]);

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

    const attendanceData = charts ? {
        labels: charts.attendance.labels,
        datasets: [{
            label: 'Total Visits (Monthly)',
            data: charts.attendance.data,
            backgroundColor: '#66FCF1',
            borderRadius: 4,
            barPercentage: 0.6,
        }]
    } : null;

    const payments = charts ? charts.payments : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-dark)' }}>
            {/* Top Navbar */}
            <header style={{
                backgroundColor: 'rgba(11, 12, 16, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Activity color="var(--neon-green)" size={28} />
                    <h1 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Neon Iron</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>Member Portal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Welcome, {user?.name}</div>
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
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Your Training Portal</h2>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <NeonCard
                        title="Active Plan"
                        value={stats.activePlan?.plan_name || 'No Plan'}
                        icon={<Activity size={24} />}
                        glowColor="var(--neon-green)"
                        subtitle={stats.activePlan ? `Ends: ${stats.activePlan.end_date}` : ''}
                    />
                    <NeonCard
                        title="Total Visits"
                        value={stats.totalVisits}
                        icon={<Calendar size={24} />}
                        glowColor="var(--electric-blue)"
                        subtitle="All Time"
                    />
                    <NeonCard
                        title="Membership Valid Until"
                        value={stats.validUntil || stats.activePlan?.end_date || 'N/A'}
                        icon={<Info size={24} />}
                        glowColor="var(--electric-purple)"
                        subtitle={stats.validUntil && new Date(stats.validUntil) >= new Date() ? 'Active Membership' : 'Expired / No Membership'}
                    />
                    <NeonCard
                        title="Trainer"
                        value={stats.activePlan?.instructor_name || 'N/A'}
                        icon={<User size={24} />}
                        glowColor="var(--neon-green)"
                        subtitle={stats.activePlan?.plan_name || ''}
                    />
                </div>

                {/* Data Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Monthly Attendance Chart */}
                    {attendanceData && (
                        <div className="neon-card">
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit' }}>Attendance History</h3>
                            <Bar data={attendanceData} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                    )}

                    {/* Payment History List */}
                    <div className="neon-card">
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit' }}>Payment History</h3>
                        {payments.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No payments found.</div>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {payments.map((pay, i) => (
                                    <div key={i} style={{
                                        padding: '1rem',
                                        backgroundColor: 'rgba(11, 12, 16, 0.5)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '3px solid var(--electric-purple)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem' }}>${pay.amount}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{pay.payment_date}</span>
                                        </div>
                                        <div style={{ color: 'var(--electric-blue)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{pay.plan_name}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            Valid: {pay.valid_from} to {pay.valid_until}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Personal Details + Messages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {/* Personal Details */}
                    <div className="neon-card">
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit' }}>Personal Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-secondary)' }}>
                            <div><strong>Email:</strong> {stats.member?.email}</div>
                            <div><strong>Phone:</strong> {stats.member?.phone}</div>
                            <div><strong>Joined:</strong> {stats.member?.join_date}</div>
                            <div><strong>Member ID:</strong> #{stats.member?.member_id}</div>
                        </div>
                    </div>

                    {/* Messages Inbox */}
                    <div className="neon-card">
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageCircle size={20} color="var(--electric-blue)" /> Messages from Coach
                        </h3>
                        {messages.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No messages yet.</div>
                        ) : (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {messages.map((msg) => (
                                    <div key={msg.message_id} style={{
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        backgroundColor: 'rgba(11, 12, 16, 0.5)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '3px solid var(--electric-blue)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--electric-blue)', fontWeight: '600', fontSize: '0.9rem' }}>{msg.from_name}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{msg.sent_at}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MemberDashboard;
