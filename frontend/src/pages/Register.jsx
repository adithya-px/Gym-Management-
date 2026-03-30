import { GlowCard } from '../components/GlowCard';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

const API = 'http://localhost:5000/api';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [form, setForm] = useState({
        role: 'member',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        
        if (form.password !== form.confirm_password) {
            setMsg({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        setLoading(true);
        try {
            const { confirm_password, ...submitData } = form;
            await axios.post(`${API}/register`, submitData);
            setMsg({ type: 'success', text: 'Registration successful! Please wait for an Admin to approve your account before logging in.' });
            setForm({ role: 'member', first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '' });
            setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--bg-dark)', padding: '2rem'
        }}>
            <GlowCard className="neon-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }} customSize={true}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--neon-green)' }}>
                    <Activity size={48} />
                </div>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.5rem' }}>Create Account</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Join Neon Iron. Admins will review your application.</p>

                {msg && (
                    <div style={{
                        backgroundColor: msg.type === 'error' ? 'rgba(252, 92, 101, 0.1)' : 'rgba(29, 158, 117, 0.1)',
                        border: `1px solid ${msg.type === 'error' ? 'var(--danger-red)' : 'var(--neon-green)'}`,
                        color: msg.type === 'error' ? 'var(--danger-red)' : 'var(--neon-green)',
                        padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
                    }}>
                        {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Register As</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="member">Member</option>
                                <option value="instructor">Instructor / Coach</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>First Name</label>
                            <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Last Name</label>
                            <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Password</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Confirm Password</label>
                            <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required minLength={6} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '1rem', padding: '0.85rem', backgroundColor: 'transparent',
                        color: 'var(--neon-green)', border: '1px solid var(--neon-green)',
                        borderRadius: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                        transition: 'all 0.3s'
                    }}>
                        <UserPlus size={18} /> {loading ? 'Submitting...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--electric-blue)', textDecoration: 'none', fontWeight: '500' }}>Sign In here</Link>
                </div>
            </GlowCard>
        </div>
    );
};

export default Register;
