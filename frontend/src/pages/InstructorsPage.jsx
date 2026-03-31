"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import axios from 'axios';

const API = API_BASE;

const InstructorsPage = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', specialization: '', experience_years: '' });

    const fetchInstructors = async () => {
        try {
            const res = await axios.get(`${API}/instructors`);
            setInstructors(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInstructors(); }, []);

    const resetForm = () => {
        setForm({ first_name: '', last_name: '', phone: '', email: '', specialization: '', experience_years: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (instructor) => {
        setForm({
            first_name: instructor.first_name || '', last_name: instructor.last_name || '',
            phone: instructor.phone || '', email: instructor.email || '',
            specialization: instructor.specialization || '', experience_years: instructor.experience_years || ''
        });
        setEditing(instructor.instructor_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/instructors/${editing}`, form);
            } else {
                await axios.post(`${API}/instructors`, form);
            }
            resetForm();
            fetchInstructors();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving instructor');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this instructor and all related records?')) return;
        try {
            await axios.delete(`${API}/instructors/${id}`);
            fetchInstructors();
        } catch (err) { alert('Error deleting instructor'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading instructors...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={24} /> Instructors ({instructors.length})
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                    color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Add Instructor
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <GlowCard className="neon-card" style={{ marginBottom: '1.5rem' }} customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Instructor' : 'New Instructor'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { key: 'first_name', label: 'First Name', type: 'text' },
                            { key: 'last_name', label: 'Last Name', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'phone', label: 'Phone', type: 'text' },
                            { key: 'specialization', label: 'Specialization', type: 'text' },
                            { key: 'experience_years', label: 'Experience (Years)', type: 'number' },
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
                </GlowCard>
            )}

            {/* Data Table */}
            <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto' }} customSize={true}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            {['ID', 'Name', 'Email', 'Specialization', 'Exp (Yrs)', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.map(i => (
                            <tr key={i.instructor_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(69,162,158,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{i.instructor_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{i.first_name} {i.last_name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{i.email}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{i.specialization}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{i.experience_years}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(i)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(i.instructor_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
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

export default InstructorsPage;
