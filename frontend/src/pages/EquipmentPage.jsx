import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const conditionColors = {
    'Excellent': 'var(--neon-green)',
    'Good': 'var(--electric-blue)',
    'Needs Repair': '#FFA502',
    'Out of Service': 'var(--danger-red)',
};

const getMaintenanceStatus = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maintDate = new Date(dateStr);
    maintDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((maintDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, color: 'var(--danger-red)' };
    if (diffDays <= 7) return { label: `Due in ${diffDays}d`, color: '#FFA502' };
    return null;
};

const EquipmentPage = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', category: '', quantity: '', condition_status: 'Good', next_maintenance_date: '' });

    const fetchEquipment = async () => {
        try {
            const res = await axios.get(`${API}/equipment`);
            setEquipment(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEquipment(); }, []);

    const resetForm = () => {
        setForm({ name: '', category: '', quantity: '', condition_status: 'Good', next_maintenance_date: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (eq) => {
        setForm({
            name: eq.name || '', category: eq.category || '',
            quantity: eq.quantity || '', condition_status: eq.condition_status || 'Good',
            next_maintenance_date: eq.next_maintenance_date || ''
        });
        setEditing(eq.equipment_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, quantity: parseInt(form.quantity) || 0 };
            if (editing) {
                await axios.put(`${API}/equipment/${editing}`, payload);
            } else {
                await axios.post(`${API}/equipment`, payload);
            }
            resetForm();
            fetchEquipment();
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving equipment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this equipment?')) return;
        try {
            await axios.delete(`${API}/equipment/${id}`);
            fetchEquipment();
        } catch (err) { alert('Error deleting equipment'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading equipment...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={24} /> Equipment ({equipment.length})
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                    color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                }}>
                    <Plus size={18} /> Add Equipment
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <GlowCard className="neon-card" style={{ marginBottom: '1.5rem' }} customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Equipment' : 'New Equipment'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                            <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Quantity</label>
                            <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Condition</label>
                            <select value={form.condition_status} onChange={e => setForm({ ...form, condition_status: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Needs Repair">Needs Repair</option>
                                <option value="Out of Service">Out of Service</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Next Maintenance</label>
                            <input type="date" value={form.next_maintenance_date} onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Save size={16} /> {editing ? 'Update' : 'Add'}
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
                            {['ID', 'Name', 'Category', 'Qty', 'Condition', 'Next Maintenance', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {equipment.map(eq => (
                            <tr key={eq.equipment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(69,162,158,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{eq.equipment_id}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{eq.name}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{eq.category}</td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{eq.quantity}</td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '600',
                                        color: conditionColors[eq.condition_status] || 'var(--text-secondary)',
                                        border: `1px solid ${conditionColors[eq.condition_status] || 'var(--border-color)'}`,
                                        backgroundColor: `${conditionColors[eq.condition_status] || 'var(--border-color)'}15`
                                    }}>
                                        {eq.condition_status}
                                    </span>
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    {(() => {
                                        const status = getMaintenanceStatus(eq.next_maintenance_date);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{ color: status ? status.color : 'var(--text-secondary)' }}>{eq.next_maintenance_date || 'N/A'}</span>
                                                {status && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                        padding: '0.15rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '600',
                                                        color: status.color, border: `1px solid ${status.color}`, backgroundColor: `${status.color}15`
                                                    }}>
                                                        <AlertTriangle size={12} /> {status.label}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td style={{ padding: '0.85rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(eq)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(eq.equipment_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
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

export default EquipmentPage;
