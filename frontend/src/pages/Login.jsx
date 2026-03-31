import { GlowCard } from '../components/GlowCard';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';
import { authApi } from '../api';
import { ParticleTextEffect } from '../components/ParticleTextEffect';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await authApi.login({ username, password });

            // Context handles localStorage and state setup
            login(response.user, response.token);

            // Navigate to appropriate dashboard based on role
            const redirectMap = { admin: '/', member: '/member-dashboard', instructor: '/instructor-dashboard' };
            navigate(redirectMap[response.user.role] || '/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ParticleTextEffect>
            <div style={{ padding: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <GlowCard className="neon-card" style={{
                maxWidth: '400px',
                width: '100%',
                padding: '2.5rem',
                textAlign: 'center'
            }} customSize={true}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--neon-green)' }}>
                    <Activity size={48} />
                </div>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Neon Iron</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enter to access operations</p>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(252, 92, 101, 0.1)',
                        border: '1px solid var(--danger-red)',
                        color: 'var(--danger-red)',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.8rem',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--neon-green)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.8rem',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--neon-green)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.85rem',
                            backgroundColor: 'transparent',
                            color: 'var(--neon-green)',
                            border: '1px solid var(--neon-green)',
                            borderRadius: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = 'var(--bg-primary)';
                                e.target.style.color = 'var(--electric-blue)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--electric-blue)';
                            e.target.style.color = 'var(--bg-primary)';
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--electric-blue)', textDecoration: 'none', fontWeight: '500' }}>Sign Up here</Link>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: '0.25rem' }}>Demo Admin: admin / admin123</p>
                    <p style={{ marginBottom: '0.25rem' }}>Demo Member: mike@test.com / password123</p>
                    <p>Demo Coach: john@neoniron.com / coach123</p>
                </div>
            </GlowCard>
            </div>
        </ParticleTextEffect>
    );
};

export default Login;
