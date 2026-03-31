import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import API_BASE from '../config';
import './Login.css'; // Reusing Login.css for layout consistency

/* ─────────────────────────────── Pupil ─────────────────────────────── */
const Pupil = ({ size = 12, maxDistance = 5, pupilColor = '#2D2D2D', forceLookX, forceLookY }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  const pos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };
  const { x, y } = pos();
  return (
    <div ref={ref} style={{
      width: size, height: size, backgroundColor: pupilColor, borderRadius: '50%',
      transform: `translate(${x}px, ${y}px)`, transition: 'transform 0.1s ease-out',
    }} />
  );
};

/* ─────────────────────────────── EyeBall ─────────────────────────────── */
const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = '#2D2D2D', isBlinking = false, forceLookX, forceLookY }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  const pos = () => {
    if (!ref.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };
  const { x, y } = pos();
  return (
    <div ref={ref} style={{
      width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      transition: 'height 0.15s ease, width 0.15s ease',
    }}>
      {!isBlinking && (
        <div style={{
          width: pupilSize, height: pupilSize, backgroundColor: pupilColor, borderRadius: '50%',
          transform: `translate(${x}px, ${y}px)`, transition: 'transform 0.1s ease-out',
        }} />
      )}
    </div>
  );
};

/* ─────────────────────────────── Characters Scene ─────────────────────────────── */
const CharactersScene = ({ isTyping, password, showPassword }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const setupBlink = (setter) => {
    const schedule = () => {
      const t = setTimeout(() => {
        setter(true);
        setTimeout(() => { setter(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    return schedule();
  };
  useEffect(() => { const t = setupBlink(setIsPurpleBlinking); return () => clearTimeout(t); }, []);
  useEffect(() => { const t = setupBlink(setIsBlackBlinking); return () => clearTimeout(t); }, []);

  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const pp = calcPos(purpleRef);
  const bp = calcPos(blackRef);
  const yp = calcPos(yellowRef);
  const op = calcPos(orangeRef);

  return (
    <div style={{ position: 'relative', width: '550px', height: '400px' }}>
      {/* Characters implementation same as Login for consistent brand look */}
      {/* Purple character */}
      <div ref={purpleRef} style={{ position: 'absolute', bottom: 0, left: '70px', width: '180px', height: '400px', backgroundColor: '#6C3FF5', borderRadius: '10px 10px 0 0', zIndex: 1, transform: `skewX(${pp.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: '2rem', left: `${45 + pp.faceX}px`, top: `${40 + pp.faceY}px` }}>
          <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} />
          <EyeBall size={18} pupilSize={7} isBlinking={isPurpleBlinking} />
        </div>
      </div>
      {/* Black character */}
      <div ref={blackRef} style={{ position: 'absolute', bottom: 0, left: '240px', width: '120px', height: '310px', backgroundColor: '#2D2D2D', borderRadius: '8px 8px 0 0', zIndex: 2, transform: `skewX(${bp.bodySkew * 1.5}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: '1.5rem', left: `${26 + bp.faceX}px`, top: `${32 + bp.faceY}px` }}>
          <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} />
          <EyeBall size={16} pupilSize={6} isBlinking={isBlackBlinking} />
        </div>
      </div>
      {/* Orange character */}
      <div ref={orangeRef} style={{ position: 'absolute', bottom: 0, left: '0px', width: '240px', height: '200px', backgroundColor: '#FF9B6B', borderRadius: '120px 120px 0 0', zIndex: 3, transform: `skewX(${op.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: '2rem', left: `${82 + op.faceX}px`, top: `${90 + op.faceY}px` }}>
          <Pupil size={12} /> <Pupil size={12} />
        </div>
      </div>
      {/* Yellow pill character */}
      <div ref={yellowRef} style={{ position: 'absolute', bottom: 0, left: '310px', width: '140px', height: '230px', backgroundColor: '#E8D754', borderRadius: '70px 70px 0 0', zIndex: 4, transform: `skewX(${yp.bodySkew}deg)`, transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out' }}>
        <div style={{ position: 'absolute', display: 'flex', gap: '1.5rem', left: `${52 + yp.faceX}px`, top: `${40 + yp.faceY}px` }}>
          <Pupil size={12} /> <Pupil size={12} />
        </div>
        <div style={{ position: 'absolute', width: '5rem', height: '4px', backgroundColor: '#2D2D2D', borderRadius: '9999px', left: `${40 + yp.faceX}px`, top: `${88 + yp.faceY}px` }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────── Register Page ─────────────────────────────── */
const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
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
            await axios.post(`${API_BASE}/register`, submitData);
            setMsg({ type: 'success', text: 'Registration successful! Redirecting to login...' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-left-pane">
                <div className="login-brand">
                    <div className="login-brand-icon-box"><Activity size={16} /></div>
                    <span>Neon Iron</span>
                </div>
                <div className="login-characters-container">
                    <CharactersScene isTyping={false} password={form.password} showPassword={showPassword} />
                </div>
                <div className="login-footer-links">
                    <a href="#">Privacy Policy</a> <a href="#">Terms</a> <a href="#">Contact</a>
                </div>
                <div className="login-decorative-bg" />
            </div>

            <div className="login-right-pane" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div className="login-form-container" style={{ maxWidth: '500px' }}>
                    <div className="login-header">
                        <h1>Create Account</h1>
                        <p>Join the Neon Iron community today</p>
                    </div>

                    {msg && (
                        <div className={msg.type === 'error' ? "login-error" : "login-error"} style={{ backgroundColor: msg.type === 'error' ? 'rgba(248, 81, 73, 0.1)' : 'rgba(29, 158, 117, 0.1)', color: msg.type === 'error' ? 'var(--danger-red)' : 'var(--neon-green)', borderColor: msg.type === 'error' ? 'rgba(248, 81, 73, 0.3)' : 'rgba(29, 158, 117, 0.3)', marginBottom: '1.5rem' }}>
                            {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-input-group">
                            <label className="login-label">Register As</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="login-input">
                                <option value="member">Member</option>
                                <option value="instructor">Instructor / Coach</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="login-input-group">
                                <label className="login-label">First Name</label>
                                <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required className="login-input" />
                            </div>
                            <div className="login-input-group">
                                <label className="login-label">Last Name</label>
                                <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required className="login-input" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="login-input-group">
                                <label className="login-label">Email</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="login-input" />
                            </div>
                            <div className="login-input-group">
                                <label className="login-label">Phone</label>
                                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="login-input" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="login-input-group">
                                <label className="login-label">Password</label>
                                <div className="login-input-wrapper">
                                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} className="login-input" />
                                    <button type="button" className="login-input-icon" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="login-input-group">
                                <label className="login-label">Confirm Password</label>
                                <input type={showPassword ? "text" : "password"} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required minLength={6} className="login-input" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="login-submit-btn" style={{ marginTop: '1rem' }}>
                            <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="login-signup-text">
                        Already have an account? <Link to="/login" className="login-signup-link">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
