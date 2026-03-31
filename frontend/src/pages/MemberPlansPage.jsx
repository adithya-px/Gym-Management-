"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import OrbitalLoader from '../components/OrbitalLoader';
import axios from 'axios';

const API = API_BASE;

const MemberPlansPage = () => {
    const [memberPlans, setMemberPlans] = useState([]);
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ member_id: '', plan_id: '', instructor_id: '', start_date: '', end_date: '' });

    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const fetchData = async () => {
        try {
            const [mpRes, memRes, plnRes, instRes] = await Promise.all([
                axios.get(`${API}/member-plans`),
                axios.get(`${API}/members`),
                axios.get(`${API}/plans`),
                axios.get(`${API}/instructors`)
            ]);
            setMemberPlans(mpRes.data);
            setMembers(memRes.data);
            setPlans(plnRes.data);
            setInstructors(instRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ member_id: '', plan_id: '', instructor_id: '', start_date: '', end_date: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (mp) => {
        setForm({
            member_id: mp.member_id || '', plan_id: mp.plan_id || '',
            instructor_id: mp.instructor_id || '', start_date: mp.start_date || '', end_date: mp.end_date || ''
        });
        setEditing(mp.member_plan_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/member-plans/${editing}`, form);
            } else {
                await axios.post(`${API}/member-plans`, form);
            }
            resetForm();
            fetchData();
        } catch (err) { alert('Error saving assignment'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this plan assignment?')) return;
        try {
            await axios.delete(`${API}/member-plans/${id}`);
            fetchData();
        } catch (err) { alert('Error deleting assignment'); }
    };

    if (loading) return <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}><OrbitalLoader message="Loading assignments..." /></div>;

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedMemberPlans = [...memberPlans].sort((a, b) => {
        if (!sortField) return 0;
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={24} /> Plan Assignments ({memberPlans.length})
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                    color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Assign Plan
                </button>
            </div>

            {showForm && (
                <GlowCard className="neon-card" style={{ marginBottom: '1.5rem' }} customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Assignment' : 'New Assignment'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Member</label>
                            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">Select Member...</option>
                                {members.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Plan</label>
                            <select value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">Select Plan...</option>
                                {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.plan_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Instructor (Optional)</label>
                            <select value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">No Instructor</option>
                                {instructors.map(i => <option key={i.instructor_id} value={i.instructor_id}>{i.first_name} {i.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>End Date</label>
                            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Save size={16} /> {editing ? 'Update' : 'Assign'}
                            </button>
                        </div>
                    </form>
                </GlowCard>
            )}

            <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto' }} customSize={true}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>ID</th>
                            <th onClick={() => handleSort('member_name')} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                Member {sortField === 'member_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th onClick={() => handleSort('plan_name')} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                Plan {sortField === 'plan_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Instructor</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Start</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>End</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMemberPlans.map(mp => (
                            <tr key={mp.member_plan_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{mp.member_plan_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{mp.member_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>{mp.plan_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{mp.instructor_name || 'None'}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{mp.start_date}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{mp.end_date}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(mp)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(mp.member_plan_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Trash2 size={14} />
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

export default MemberPlansPage;
