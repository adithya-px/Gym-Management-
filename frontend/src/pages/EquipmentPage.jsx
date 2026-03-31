"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Edit2, Trash2, X, Save, AlertTriangle, Wrench, ChevronDown, ChevronUp, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = API_BASE;

const conditionColors = {
    'Excellent': 'var(--neon-green)',
    'Good': 'var(--electric-blue)',
    'Needs Repair': '#FFA502',
    'Out of Service': 'var(--danger-red)',
};

const ticketStatusColors = {
    'open': '#FFA502',
    'in_progress': 'var(--electric-blue)',
    'resolved': 'var(--neon-green)',
    'closed': 'var(--text-muted)',
};

const ticketStatusLabels = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
};

const priorityColors = {
    'low': 'var(--text-muted)',
    'medium': '#FFA502',
    'high': 'var(--danger-red)',
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

const inputStyle = {
    width: '100%', padding: '0.6rem',
    backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)',
    borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none'
};

const EquipmentPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', category: '', quantity: '', condition_status: 'Good', next_maintenance_date: '' });

    // Ticket state
    const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' or 'tickets'
    const [allTickets, setAllTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [reportModal, setReportModal] = useState(null); // equipment_id to report against
    const [reportForm, setReportForm] = useState({ description: '', priority: 'medium' });
    const [resolveModal, setResolveModal] = useState(null); // ticket object being resolved
    const [resolveForm, setResolveForm] = useState({ status: '', resolution_notes: '' });
    const [expandedTicket, setExpandedTicket] = useState(null);

    const fetchEquipment = async () => {
        try {
            const res = await axios.get(`${API}/equipment`);
            setEquipment(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchAllTickets = async () => {
        setTicketsLoading(true);
        try {
            const res = await axios.get(`${API}/equipment/tickets`);
            setAllTickets(res.data);
        } catch (err) { console.error(err); }
        finally { setTicketsLoading(false); }
    };

    useEffect(() => { fetchEquipment(); fetchAllTickets(); }, []);

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

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/equipment/${reportModal}/tickets`, {
                ...reportForm,
                reported_by_id: user.id,
                reported_by_role: user.role
            });
            setReportModal(null);
            setReportForm({ description: '', priority: 'medium' });
            fetchAllTickets();
            alert('Issue reported successfully! Admin has been notified.');
        } catch (err) {
            alert(err.response?.data?.error || 'Error reporting issue');
        }
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API}/equipment/tickets/${resolveModal.ticket_id}`, resolveForm);
            setResolveModal(null);
            setResolveForm({ status: '', resolution_notes: '' });
            fetchAllTickets();
        } catch (err) {
            alert(err.response?.data?.error || 'Error updating ticket');
        }
    };

    // Count open tickets per equipment
    const ticketCountMap = {};
    allTickets.forEach(t => {
        if (t.status === 'open' || t.status === 'in_progress') {
            ticketCountMap[t.equipment_id] = (ticketCountMap[t.equipment_id] || 0) + 1;
        }
    });

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading equipment...</div>;

    const validTransitions = {
        'open': ['in_progress', 'resolved', 'closed'],
        'in_progress': ['resolved', 'closed'],
        'resolved': ['closed'],
        'closed': []
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell size={24} /> Equipment
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                        <button onClick={() => setActiveTab('equipment')} style={{
                            padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', fontSize: '0.85rem', fontWeight: '600',
                            background: activeTab === 'equipment' ? 'rgba(69,162,158,0.2)' : 'transparent',
                            color: activeTab === 'equipment' ? 'var(--neon-green)' : 'var(--text-muted)',
                        }}>
                            <Dumbbell size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Inventory
                        </button>
                        <button onClick={() => setActiveTab('tickets')} style={{
                            padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderLeft: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600',
                            background: activeTab === 'tickets' ? 'rgba(255,165,2,0.15)' : 'transparent',
                            color: activeTab === 'tickets' ? '#FFA502' : 'var(--text-muted)',
                        }}>
                            <Wrench size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                            Repair Tickets
                            {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length > 0 && (
                                <span style={{
                                    marginLeft: '0.4rem', padding: '0.1rem 0.45rem', borderRadius: '1rem',
                                    fontSize: '0.75rem', fontWeight: '700',
                                    background: 'var(--danger-red)', color: '#fff'
                                }}>
                                    {allTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                                </span>
                            )}
                        </button>
                    </div>
                    {isAdmin && activeTab === 'equipment' && (
                        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)',
                            color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                        }}>
                            <Plus size={18} /> Add Equipment
                        </button>
                    )}
                </div>
            </div>

            {/* ============ EQUIPMENT TAB ============ */}
            {activeTab === 'equipment' && (
                <>
                    {/* Add/Edit Form */}
                    {showForm && isAdmin && (
                        <GlowCard className="neon-card" style={{ marginBottom: '1.5rem' }} customSize={true}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Equipment' : 'New Equipment'}</h3>
                                <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                                    <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Quantity</label>
                                    <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Condition</label>
                                    <select value={form.condition_status} onChange={e => setForm({ ...form, condition_status: e.target.value })} style={inputStyle}>
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good</option>
                                        <option value="Needs Repair">Needs Repair</option>
                                        <option value="Out of Service">Out of Service</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Next Maintenance</label>
                                    <input type="date" value={form.next_maintenance_date} onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })} style={inputStyle} />
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

                    {/* Equipment Table */}
                    <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto' }} customSize={true}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {['ID', 'Name', 'Category', 'Qty', 'Condition', 'Next Maintenance', 'Tickets', 'Actions'].map(h => (
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
                                            {ticketCountMap[eq.equipment_id] ? (
                                                <span style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700',
                                                    color: '#FFA502', border: '1px solid #FFA502', backgroundColor: 'rgba(255,165,2,0.1)'
                                                }}>
                                                    <Wrench size={12} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />
                                                    {ticketCountMap[eq.equipment_id]} open
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => { setReportModal(eq.equipment_id); setReportForm({ description: '', priority: 'medium' }); }}
                                                    title="Report an issue"
                                                    style={{ background: 'none', border: '1px solid #FFA502', color: '#FFA502', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                                    <Wrench size={14} /> Report
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => handleEdit(eq)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(eq.equipment_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlowCard>
                </>
            )}

            {/* ============ TICKETS TAB ============ */}
            {activeTab === 'tickets' && (
                <GlowCard className="neon-card" customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Wrench size={20} /> Repair Tickets
                        </h3>
                    </div>

                    {ticketsLoading ? (
                        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading tickets...</div>
                    ) : allTickets.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No repair tickets yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allTickets.map(ticket => (
                                <div key={ticket.ticket_id}
                                    style={{
                                        border: `1px solid ${ticketStatusColors[ticket.status]}30`,
                                        borderRadius: '0.75rem',
                                        backgroundColor: `${ticketStatusColors[ticket.status]}08`,
                                        overflow: 'hidden', transition: 'all 0.2s'
                                    }}>
                                    {/* Ticket Header */}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.85rem 1rem', cursor: 'pointer'
                                    }}
                                        onClick={() => setExpandedTicket(expandedTicket === ticket.ticket_id ? null : ticket.ticket_id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>#{ticket.ticket_id}</span>
                                            <span style={{
                                                padding: '0.15rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700',
                                                color: priorityColors[ticket.priority],
                                                border: `1px solid ${priorityColors[ticket.priority]}`,
                                                backgroundColor: `${priorityColors[ticket.priority]}15`,
                                                textTransform: 'uppercase'
                                            }}>
                                                {ticket.priority}
                                            </span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{ticket.equipment_name}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                — {ticket.description}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700',
                                                color: ticketStatusColors[ticket.status],
                                                border: `1px solid ${ticketStatusColors[ticket.status]}`,
                                                backgroundColor: `${ticketStatusColors[ticket.status]}15`
                                            }}>
                                                {ticketStatusLabels[ticket.status]}
                                            </span>
                                            {expandedTicket === ticket.ticket_id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedTicket === ticket.ticket_id && (
                                        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Description</div>
                                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{ticket.description}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reported By</div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        {ticket.reported_by_role} #{ticket.reported_by_id}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                        <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />Created
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ticket.created_at}</div>
                                                </div>
                                                {ticket.resolved_at && (
                                                    <div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                                                            <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />Resolved
                                                        </div>
                                                        <div style={{ color: 'var(--neon-green)', fontSize: '0.9rem' }}>{ticket.resolved_at}</div>
                                                    </div>
                                                )}
                                            </div>
                                            {ticket.resolution_notes && (
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Resolution Notes</div>
                                                    <div style={{ color: 'var(--neon-green)', fontSize: '0.9rem', fontStyle: 'italic' }}>{ticket.resolution_notes}</div>
                                                </div>
                                            )}
                                            {/* Admin: Status Transition buttons */}
                                            {isAdmin && validTransitions[ticket.status]?.length > 0 && (
                                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                    {validTransitions[ticket.status].map(nextStatus => (
                                                        <button key={nextStatus}
                                                            onClick={() => {
                                                                setResolveModal(ticket);
                                                                setResolveForm({ status: nextStatus, resolution_notes: ticket.resolution_notes || '' });
                                                            }}
                                                            style={{
                                                                background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                                                padding: '0.35rem 0.75rem', borderRadius: '0.4rem',
                                                                border: `1px solid ${ticketStatusColors[nextStatus]}`,
                                                                color: ticketStatusColors[nextStatus]
                                                            }}>
                                                            → {ticketStatusLabels[nextStatus]}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </GlowCard>
            )}

            {/* ============ REPORT ISSUE MODAL ============ */}
            {reportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '480px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: '#FFA502', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wrench size={20} /> Report Equipment Issue
                            </h3>
                            <button onClick={() => setReportModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Reporting issue for: <strong style={{ color: 'var(--text-primary)' }}>{equipment.find(e => e.equipment_id === reportModal)?.name}</strong>
                        </p>
                        <form onSubmit={handleReportSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>What's wrong? *</label>
                                <textarea value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                                    required rows={3} placeholder="Describe the issue..."
                                    style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Priority</label>
                                <select value={reportForm.priority} onChange={e => setReportForm({ ...reportForm, priority: e.target.value })} style={inputStyle}>
                                    <option value="low">Low — Minor cosmetic issue</option>
                                    <option value="medium">Medium — Usable but needs attention</option>
                                    <option value="high">High — Safety concern / unusable</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setReportModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid #FFA502', color: '#FFA502', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                                    <Wrench size={16} /> Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ RESOLVE MODAL ============ */}
            {resolveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '480px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: ticketStatusColors[resolveForm.status], fontFamily: 'Outfit' }}>
                                Update Ticket #{resolveModal.ticket_id}
                            </h3>
                            <button onClick={() => setResolveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Transitioning from <strong style={{ color: ticketStatusColors[resolveModal.status] }}>{ticketStatusLabels[resolveModal.status]}</strong> → <strong style={{ color: ticketStatusColors[resolveForm.status] }}>{ticketStatusLabels[resolveForm.status]}</strong>
                        </p>
                        <form onSubmit={handleResolveSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Resolution Notes</label>
                                <textarea value={resolveForm.resolution_notes} onChange={e => setResolveForm({ ...resolveForm, resolution_notes: e.target.value })}
                                    rows={3} placeholder="What was done to fix the issue?"
                                    style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setResolveModal(null)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{
                                    padding: '0.6rem 1.2rem', background: 'transparent',
                                    border: `1px solid ${ticketStatusColors[resolveForm.status]}`,
                                    color: ticketStatusColors[resolveForm.status],
                                    borderRadius: '0.4rem', cursor: 'pointer', fontWeight: '600'
                                }}>
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentPage;
