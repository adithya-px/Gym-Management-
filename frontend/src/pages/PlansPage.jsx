import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const PlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ plan_name: '', goal: '', duration: '', created_by_instructor_id: '' });

    const fetchData = async () => {
        try {
            const [plansRes, instRes] = await Promise.all([
                axios.get(`${API}/plans`),
                axios.get(`${API}/instructors`)
            ]);
            setPlans(plansRes.data);
            setInstructors(instRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ plan_name: '', goal: '', duration: '', created_by_instructor_id: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (plan) => {
        setForm({
            plan_name: plan.plan_name || '', goal: plan.goal || '',
            duration: plan.duration || '', created_by_instructor_id: plan.created_by_instructor_id || ''
        });
        setEditing(plan.plan_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/plans/${editing}`, form);
            } else {
                await axios.post(`${API}/plans`, form);
            }
            resetForm();
            fetchData();
        } catch (err) { alert(err.response?.data?.error || 'Error saving plan'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this plan?')) return;
        try {
            await axios.delete(`${API}/plans/${id}`);
            fetchData();
        } catch (err) { alert('Error deleting plan'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading plans...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={24} /> Training Plans ({plans.length})
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                    color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Add Plan
                </button>
            </div>

            {showForm && (
                <GlowCard className="neon-card" style={{ marginBottom: '1.5rem' }} customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Plan' : 'New Plan'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Plan Name</label>
                            <input type="text" value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} required
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Goal</label>
                            <input type="text" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Duration</label>
                            <input type="text" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Creator (Instructor)</label>
                            <select value={form.created_by_instructor_id} onChange={e => setForm({ ...form, created_by_instructor_id: e.target.value })} required
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">Select an instructor...</option>
                                {instructors.map(i => <option key={i.instructor_id} value={i.instructor_id}>{i.first_name} {i.last_name}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Save size={16} /> {editing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </GlowCard>
            )}

            <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto' }} customSize={true}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {['ID', 'Name', 'Goal', 'Duration', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map(p => (
                            <tr key={p.plan_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(69,162,158,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{p.plan_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{p.plan_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{p.goal}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{p.duration}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(p)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(p.plan_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlowCard>
        </div>
    );
};

export default PlansPage;
