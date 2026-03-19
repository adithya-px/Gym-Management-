import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NeonCard } from '../components/NeonCard';
import { Calendar, Activity, Info, LogOut, DollarSign, MessageCircle, User, Apple } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import '../chartSetup';

const API = 'http://localhost:5000/api';

const MemberDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [messages, setMessages] = useState([]);
    const [dietPlan, setDietPlan] = useState(null);
    const [showBarChart, setShowBarChart] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, chartsRes, msgRes, dietRes] = await Promise.all([
                    axios.get(`${API}/member/${user.id}/stats`),
                    axios.get(`${API}/member/${user.id}/charts`),
                    axios.get(`${API}/member/${user.id}/messages`),
                    axios.get(`${API}/member/${user.id}/diet-plan`).catch(() => ({ data: null }))
                ]);
                setStats(statsRes.data);
                setCharts(chartsRes.data);
                setMessages(msgRes.data);
                setDietPlan(dietRes.data);
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

    const attendanceData = charts && charts.attendance ? {
        labels: charts.attendance.labels,
        datasets: [{
            label: 'Total Visits (Monthly)',
            data: charts.attendance.data,
            backgroundColor: '#66FCF1',
            borderRadius: 4,
            barPercentage: 0.6,
        }]
    } : null;

    const attendanceBlocks = charts ? charts.attendance_blocks : null;

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
                    {/* Monthly Attendance Chart / Blocks */}
                    {attendanceData && attendanceBlocks && (
                        <div className="neon-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0 }}>Attendance History</h3>
                                <button onClick={() => setShowBarChart(!showBarChart)} style={{
                                    background: 'transparent',
                                    border: '1px solid var(--electric-blue)',
                                    color: 'var(--electric-blue)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.4rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.3s'
                                }}>
                                    {showBarChart ? 'Show Recent Blocks' : 'Show Monthly Chart'}
                                </button>
                            </div>

                            {showBarChart ? (
                                <Bar data={attendanceData} options={{ responsive: true, maintainAspectRatio: true }} />
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                        {attendanceBlocks.labels.map((label, index) => {
                                            const isPresent = attendanceBlocks.data[index] === 1;
                                            return (
                                                <div key={index} style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                                                }}>
                                                    <div
                                                        title={`${label}: ${isPresent ? 'Present' : 'Absent'}`}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '4px',
                                                            backgroundColor: isPresent ? 'var(--neon-green)' : 'rgba(255,255,255,0.05)',
                                                            border: isPresent ? '1px solid var(--neon-green)' : '1px solid rgba(255,255,255,0.1)',
                                                            boxShadow: isPresent ? '0 0 8px rgba(102, 252, 241, 0.4)' : 'none',
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer'
                                                        }}
                                                    ></div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {label.split(' ')[1] ? label.split(' ')[1] : label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--neon-green)', boxShadow: '0 0 8px rgba(102, 252, 241, 0.4)' }}></div> Present
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}></div> Absent
                                        </div>
                                    </div>
                                </div>
                            )}
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

                {/* Diet Plan */}
                {dietPlan && (
                    <div className="neon-card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Apple size={24} color="var(--neon-green)" /> Your Assigned Diet Plan
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ backgroundColor: 'rgba(11, 12, 16, 0.5)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--neon-green)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Protein Goal</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--neon-green)' }}>{dietPlan.protein_g}g</div>
                            </div>
                            <div style={{ backgroundColor: 'rgba(11, 12, 16, 0.5)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--electric-purple)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Carbs Goal</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--electric-purple)' }}>{dietPlan.carbs_g}g</div>
                            </div>
                            <div style={{ backgroundColor: 'rgba(11, 12, 16, 0.5)', padding: '1rem', borderRadius: '0.5rem', borderLeft: '3px solid #FF6B6B' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Daily Calories</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#FF6B6B' }}>{dietPlan.kcal_goal} kcal</div>
                            </div>
                        </div>

                        {(dietPlan.breakfast || dietPlan.lunch || dietPlan.dinner || dietPlan.snacks) && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {dietPlan.breakfast && (
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--electric-blue)', marginBottom: '0.25rem', fontWeight: '600' }}>Breakfast</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dietPlan.breakfast}</div>
                                    </div>
                                )}
                                {dietPlan.lunch && (
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--electric-blue)', marginBottom: '0.25rem', fontWeight: '600' }}>Lunch</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dietPlan.lunch}</div>
                                    </div>
                                )}
                                {dietPlan.dinner && (
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--electric-blue)', marginBottom: '0.25rem', fontWeight: '600' }}>Dinner</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dietPlan.dinner}</div>
                                    </div>
                                )}
                                {dietPlan.snacks && (
                                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--electric-blue)', marginBottom: '0.25rem', fontWeight: '600' }}>Snacks</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dietPlan.snacks}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {dietPlan.notes && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(69, 162, 158, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(69, 162, 158, 0.3)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--neon-green)', marginBottom: '0.25rem', fontWeight: '600' }}>Coach's Notes</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{dietPlan.notes}</div>
                            </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'right' }}>
                            Last updated: {dietPlan.updated_at} by Coach {dietPlan.instructor_name}
                        </div>
                    </div>
                )}

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
