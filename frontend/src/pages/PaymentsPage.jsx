import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, X, Save, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import '../chartSetup';

const API = 'http://localhost:5000/api';

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ member_id: '', plan_id: '', amount: '', payment_date: '', valid_from: '', valid_until: '', payment_mode: 'Credit Card' });

    const fetchData = async () => {
        try {
            const [payRes, memRes, planRes] = await Promise.all([
                axios.get(`${API}/payments`),
                axios.get(`${API}/members`),
                axios.get(`${API}/plans`)
            ]);
            setPayments(payRes.data);
            setMembers(memRes.data);
            setPlans(planRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ member_id: '', plan_id: '', amount: '', payment_date: '', valid_from: '', valid_until: '', payment_mode: 'Credit Card' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (p) => {
        setForm({
            member_id: p.member_id || '', plan_id: p.plan_id || '',
            amount: p.amount || '', payment_date: p.payment_date || '',
            valid_from: p.valid_from || '', valid_until: p.valid_until || '',
            payment_mode: p.payment_mode || 'Credit Card'
        });
        setEditing(p.payment_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/payments/${editing}`, form);
            } else {
                await axios.post(`${API}/payments`, form);
            }
            resetForm();
            fetchData();
        } catch (err) { alert('Error saving payment'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this payment?')) return;
        try {
            await axios.delete(`${API}/payments/${id}`);
            fetchData();
        } catch (err) { alert('Error deleting payment'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading payments...</div>;

    // Monthly Graph Data Processing
    const monthlyRevenue = {};
    payments.forEach(p => {
        if (!p.payment_date) return;
        const month = p.payment_date.substring(0, 7); // e.g., '2025-01'
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(p.amount || 0);
    });

    const sortedMonths = Object.keys(monthlyRevenue).sort();

    // Formatting for nice labels, e.g., 'Jan 2025'
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartLabels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    });

    const chartData = {
        labels: chartLabels,
        datasets: [{
            label: 'Monthly Revenue ($)',
            data: sortedMonths.map(m => monthlyRevenue[m]),
            backgroundColor: '#C5A3FF',
            borderRadius: 4,
            barPercentage: 0.5,
        }]
    };

    const getMemberName = (id) => {
        const m = members.find(m => m.member_id.toString() === id.toString());
        return m ? `${m.first_name} ${m.last_name}` : id;
    };

    const getPlanName = (id) => {
        const p = plans.find(p => p.plan_id.toString() === id.toString());
        return p ? p.plan_name : id;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={24} /> Revenue & Payments
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'var(--electric-blue)', border: 'none',
                    color: 'var(--bg-darker)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Record Payment
                </button>
            </div>

            {/* Monthly Revenue Chart */}
            {sortedMonths.length > 0 && (
                <div className="neon-card fade-in" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} /> Monthly Revenue Trend
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Bar
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (value) => `$${value}`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {showForm && (
                <div className="neon-card" style={{ marginBottom: '1.5rem', border: '1px solid var(--electric-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Payment' : 'New Payment'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Member</label>
                            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }}>
                                <option value="">Select Member...</option>
                                {members.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Plan</label>
                            <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }}>
                                <option value="">Select Plan...</option>
                                {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.plan_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Amount ($)</label>
                            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment Mode</label>
                            <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }}>
                                <option>Credit Card</option><option>Cash</option><option>Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payment Date</label>
                            <input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Valid From</label>
                                <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Valid Until</label>
                                <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Save size={16} /> Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="neon-card" style={{ padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Member</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Plan</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Valid Till</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Mode</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.payment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{p.payment_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{getMemberName(p.member_id)}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{getPlanName(p.plan_id)}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>${p.amount}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{p.payment_date}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{p.valid_until}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{p.payment_mode}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(p)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(p.payment_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentsPage;
