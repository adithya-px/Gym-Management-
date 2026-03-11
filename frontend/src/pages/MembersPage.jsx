import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const MembersPage = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '', date_of_birth: '', join_date: '' });

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API}/members`);
            setMembers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, []);

    const resetForm = () => {
        setForm({ first_name: '', last_name: '', phone: '', email: '', address: '', date_of_birth: '', join_date: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (member) => {
        setForm({
            first_name: member.first_name || '', last_name: member.last_name || '',
            phone: member.phone || '', email: member.email || '',
            address: member.address || '', date_of_birth: member.date_of_birth || '',
            join_date: member.join_date || ''
        });
        setEditing(member.member_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/members/${editing}`, form);
            } else {
                await axios.post(`${API}/members`, { ...form, join_date: form.join_date || new Date().toISOString().split('T')[0] });
            }
            resetForm();
            fetchMembers();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving member');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this member and all related records?')) return;
        try {
            await axios.delete(`${API}/members/${id}`);
            fetchMembers();
        } catch (err) { alert('Error deleting member'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading members...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={24} /> Members ({members.length})
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                    color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Add Member
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="neon-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Member' : 'New Member'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { key: 'first_name', label: 'First Name', type: 'text' },
                            { key: 'last_name', label: 'Last Name', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'phone', label: 'Phone', type: 'text' },
                            { key: 'address', label: 'Address', type: 'text' },
                            { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                            { key: 'join_date', label: 'Join Date', type: 'date' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                                <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                    required={f.key === 'first_name' || f.key === 'email'}
                                    style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                        ))}
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Save size={16} /> {editing ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Data Table */}
            <div className="neon-card" style={{ padding: 0, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {['ID', 'Name', 'Email', 'Phone', 'Join Date', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(m => (
                            <tr key={m.member_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(69,162,158,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{m.member_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{m.first_name} {m.last_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{m.email}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{m.phone}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{m.join_date}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(m)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(m.member_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
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

export default MembersPage;
