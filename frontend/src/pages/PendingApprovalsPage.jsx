"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const API = API_BASE;

const PendingApprovalsPage = () => {
    const { user } = useAuth();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of user being processed

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/pending-users`);
            setPendingUsers(res.data);
        } catch (err) {
            console.error('Error fetching pending users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (targetUser, status) => {
        if (!window.confirm(`Are you sure you want to ${status === 'active' ? 'Approve' : 'Reject'} ${targetUser.first_name} ${targetUser.last_name}?`)) return;
        
        setActionLoading(targetUser.id);
        try {
            await axios.put(`${API}/admin/approve-user/${targetUser.role}/${targetUser.id}`, { status });
            // Remove from list
            setPendingUsers(pendingUsers.filter(u => !(u.id === targetUser.id && u.role === targetUser.role)));
        } catch (err) {
            console.error('Error updating status', err);
            alert('Failed to update status.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0 }}>Pending Approvals</h1>
                <button onClick={fetchPendingUsers} style={{
                    background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                    padding: '0.5rem 1rem', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
            ) : pendingUsers.length === 0 ? (
                <GlowCard className="neon-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} customSize={true}>
                    <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>No pending account approvals at this time.</p>
                </GlowCard>
            ) : (
                <GlowCard className="neon-card" style={{ padding: 0, overflow: 'hidden' }} customSize={true}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Name</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Role</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Email & Phone</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem' }}>Applied On</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.map(u => (
                                <tr key={`${u.role}-${u.id}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                        {u.first_name} {u.last_name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                                            backgroundColor: u.role === 'member' ? 'rgba(48,134,255,0.1)' : 'rgba(255,165,2,0.1)',
                                            color: u.role === 'member' ? 'var(--electric-blue)' : 'var(--amber-orange)'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <div>{u.email}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{u.phone}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {u.date_added || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {actionLoading === u.id ? (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Processing...</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleAction(u, 'active')} style={{
                                                    background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)',
                                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem'
                                                }}>
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button onClick={() => handleAction(u, 'rejected')} style={{
                                                    background: 'transparent', border: '1px solid var(--danger-red)', color: 'var(--danger-red)',
                                                    padding: '0.4rem 0.8rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem'
                                                }}>
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlowCard>
            )}
        </div>
    );
};

export default PendingApprovalsPage;
