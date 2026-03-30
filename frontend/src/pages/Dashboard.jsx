import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { NeonCard } from '../components/NeonCard';
import { Users, Briefcase, Activity, DollarSign, Dumbbell, AlertTriangle, Loader, Apple } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { dashboardApi } from '../api';
import axios from 'axios';
import '../chartSetup';

const API = API_BASE;

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Auto-trigger alert generation on admin dashboard load.
                // This calls the generate_daily_alerts stored procedure which:
                //   1. Checks for billing cycles expiring in 7 days -> notifies member
                //   2. Checks for overdue payments -> notifies member + admin
                //   3. Checks for equipment maintenance due within 3 days -> notifies admin
                //   4. Checks for repair tickets open > 2 days -> notifies admin
                // Delivery: in-app notifications only (no email/SMS).
                // Idempotent: won't duplicate alerts already generated today.
                await axios.post(`${API}/notifications/generate`).catch(() => {});

                const statsData = await dashboardApi.getStats();
                const chartsData = await dashboardApi.getCharts();
                setStats(statsData);
                setCharts(chartsData);
            } catch (error) {
                console.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading || !stats || !charts) {
        return (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--electric-blue)' }}>
                    <Loader className="animate-spin" size={40} style={{ animation: 'spin 2s linear infinite' }} />
                    <p style={{ marginTop: '1rem', fontFamily: 'Outfit' }}>Loading System Data...</p>
                </div>
            </div>
        );
    }

    const attendanceData = {
        labels: charts.attendance.labels,
        datasets: [
            {
                label: 'Member Visits',
                data: charts.attendance.data,
                borderColor: '#66FCF1',
                backgroundColor: 'rgba(102, 252, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0B0C10',
                pointBorderColor: '#66FCF1',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const revenueData = {
        labels: charts.revenue.labels,
        datasets: [
            {
                label: 'Revenue ($)',
                data: charts.revenue.data,
                backgroundColor: '#B829EA',
                borderRadius: 4,
                barPercentage: 0.6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
            }
        }
    };

    return (
        <div className="dashboard-container">
            {/* Top Stats Row */}
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Overview</h2>
            <div className="dashboard-grid">
                <NeonCard
                    title={<><Users size={18} /> Total Members</>}
                    value={stats.totalMembers}
                    accent="primary"
                />
                <NeonCard
                    title={<><Activity size={18} /> Today's Attendance</>}
                    value={stats.todayAttendance}
                    accent="secondary"
                />
                <NeonCard
                    title={<><DollarSign size={18} /> Monthly Revenue</>}
                    value={`$${stats.monthlyRevenue}`}
                    accent="tertiary"
                />
                <NeonCard
                    title={<><Briefcase size={18} /> Instructors</>}
                    value={stats.activeInstructors}
                />
                <NeonCard
                    title={<><Apple size={18} /> Diet Plans</>}
                    value={stats.activeDietPlans}
                    accent="primary"
                />
            </div>

            <div className="charts-grid">
                {/* Chart Area 1 - Attendance Trend */}
                <GlowCard className="neon-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }} customSize={true}>
                    <div className="card-title"><Activity size={18} /> Attendance Trend</div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
                        <Line data={attendanceData} options={chartOptions} />
                    </div>
                </GlowCard>

                {/* Chart Area 2 - Monthly Revenue */}
                <GlowCard className="neon-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }} customSize={true}>
                    <div className="card-title text-accent-tertiary"><DollarSign size={18} /> Monthly Revenue</div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '1rem' }}>
                        <Bar data={revenueData} options={chartOptions} />
                    </div>
                </GlowCard>

                {/* Expiring Members Alert Panel */}
                <GlowCard className="neon-card neon-card-alert" customSize={true}>
                    <div className="card-title text-danger">
                        <AlertTriangle size={20} /> Expiring Soon (Next 7 Days)
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        {stats.expiringMembers.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                                No members expiring soon.
                            </div>
                        ) : (
                            stats.expiringMembers.map((member) => (
                                <div key={member.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '12px 0',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{member.plan}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--danger-red)', fontWeight: '600' }}>{member.validUntil}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action Required</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlowCard>
            </div>
        </div>
    );
};

export default Dashboard;
