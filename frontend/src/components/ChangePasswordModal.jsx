import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, X, CheckCircle, AlertCircle } from 'lucide-react';

const API = API_BASE;

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        if (form.new_password !== form.confirm_password) {
            setMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${API}/auth/change-password`, {
                user_id: user.id || user.user_id, // check auth context payload pattern
                role: user.role,
                old_password: form.old_password,
                new_password: form.new_password
            });
            setMsg({ type: 'success', text: 'Password updated successfully' });
            setForm({ old_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => {
                setMsg(null);
                onClose();
            }, 2000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <GlowCard className="neon-card" style={{ width: '400px', maxWidth: '90%', padding: '2rem', position: 'relative' }} customSize={true}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--electric-blue)' }}>
                    <KeyRound size={24} />
                    <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0 }}>Change Password</h2>
                </div>

                {msg && (
                    <div style={{
                        padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        backgroundColor: msg.type === 'error' ? 'rgba(252,92,101,0.1)' : 'rgba(29,158,117,0.1)',
                        color: msg.type === 'error' ? 'var(--danger-red)' : 'var(--neon-green)',
                        border: `1px solid ${msg.type === 'error' ? 'var(--danger-red)' : 'var(--neon-green)'}`
                    }}>
                        {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>Current Password</label>
                        <input type="password" value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} required
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>New Password</label>
                        <input type="password" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} minLength={6} required
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'block' }}>Confirm New Password</label>
                        <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} minLength={6} required
                            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)' }} />
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '1rem', padding: '0.8rem', background: 'transparent',
                        border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)',
                        borderRadius: '0.4rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                    }}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </GlowCard>
        </div>
    );
};

export default ChangePasswordModal;
