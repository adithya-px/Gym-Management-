"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import OrbitalLoader from '../components/OrbitalLoader';

const API = API_BASE;

const BillingPage = () => {
    const [cycles, setCycles] = useState([]);
    const [overdueCycles, setOverdueCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cyclesRes, overdueRes] = await Promise.all([
                axios.get(`${API}/billing-cycles`),
                axios.get(`${API}/billing-cycles/overdue`)
            ]);
            setCycles(cyclesRes.data);
            setOverdueCycles(overdueRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching billing data mapping:', error);
            setLoading(false);
        }
    };

    const handlePay = async (cycleId) => {
        if (!window.confirm("Confirm payment for this billing cycle?")) return;
        setProcessing(true);
        try {
            const res = await axios.put(`${API}/billing-cycles/${cycleId}/pay`, { payment_mode: 'Credit Card' });
            alert(`Payment successful! Generated Invoice: ${res.data.invoice_number}`);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error processing payment");
        }
        setProcessing(false);
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'paid': return { color: '#1D9E75', label: 'Paid', icon: <CheckCircle size={14} /> };
            case 'overdue': return { color: 'var(--danger-red)', label: 'Overdue', icon: <AlertCircle size={14} /> };
            case 'pending': return { color: 'var(--amber-orange)', label: 'Pending', icon: <Clock size={14} /> };
            default: return { color: 'var(--text-muted)', label: status, icon: null };
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><OrbitalLoader message="Loading billing data..." /></div>;

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0 }}>Billing Cycles</h2>
            </div>

            {/* Overdue Alert Summary */}
            {overdueCycles.length > 0 && (
                <GlowCard className="neon-card" style={{ marginBottom: '2rem', borderTop: '3px solid var(--danger-red)', padding: '1.5rem' }} customSize={true}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-red)', fontWeight: 800, marginBottom: '0.8rem' }}>
                        <AlertCircle size={20} />
                        ATTENTION REQUIRED
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                        There are <strong>{overdueCycles.length}</strong> overdue billing cycles requiring follow-up.
                    </div>
                </GlowCard>
            )}

            {/* Cycles Table */}
            <GlowCard className="neon-card" style={{ padding: '0', overflow: 'hidden' }} customSize={true}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Member</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Plan</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Due Date</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cycles.map(cycle => {
                                const statusInfo = getStatusStyle(cycle.status);
                                return (
                                    <tr key={cycle.cycle_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                                        <td style={{ padding: '1.2rem', color: 'var(--text-primary)' }}>{cycle.member_name}</td>
                                        <td style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>{cycle.plan_name}</td>
                                        <td style={{ padding: '1.2rem', color: 'var(--text-primary)', fontWeight: 600 }}>₹{cycle.amount}</td>
                                        <td style={{ padding: '1.2rem', color: 'var(--text-secondary)' }}>
                                            {cycle.due_date}
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 8px', borderRadius: '4px',
                                                backgroundColor: `rgba(${statusInfo.color === '#1D9E75' ? '29, 158, 117' : statusInfo.color === 'var(--danger-red)' ? '255, 51, 102' : '255, 165, 2'}, 0.1)`,
                                                color: statusInfo.color,
                                                fontSize: '0.85rem', fontWeight: 600
                                            }}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'right' }}>
                                            {cycle.status !== 'paid' ? (
                                                <button
                                                    onClick={() => handlePay(cycle.cycle_id)}
                                                    disabled={processing}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid #1D9E75',
                                                        color: '#1D9E75',
                                                        padding: '0.4rem 1rem',
                                                        borderRadius: '4px',
                                                        cursor: processing ? 'not-allowed' : 'pointer',
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {processing ? 'Processing...' : 'Mark Paid'}
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Paid on {cycle.paid_date}</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {cycles.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No billing cycles found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlowCard>
        </div>
    );
};

export default BillingPage;
