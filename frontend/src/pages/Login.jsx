import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, AlertCircle, Eye, EyeOff, Mail } from 'lucide-react';
import { authApi } from '../api';
import './Login.css';

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
    <div
      ref={ref}
      style={{
        width: size, height: size,
        backgroundColor: pupilColor,
        borderRadius: '50%',
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

/* ─────────────────────────────── EyeBall ─────────────────────────────── */
const EyeBall = ({
  size = 48, pupilSize = 16, maxDistance = 10,
  eyeColor = 'white', pupilColor = '#2D2D2D',
  isBlinking = false, forceLookX, forceLookY,
}) => {
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
    <div
      ref={ref}
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'height 0.15s ease, width 0.15s ease',
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            borderRadius: '50%',
            transform: `translate(${x}px, ${y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────── Characters Scene ─────────────────────────────── */
const CharactersScene = ({ isTyping, password, showPassword }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Blinking animation
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

  // Look at each other when typing
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(t);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple sneaky peek when password is visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true);
        setTimeout(() => setIsPurplePeeking(false), 800);
      }, Math.random() * 3000 + 2000);
      return () => clearTimeout(t);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword, isPurplePeeking]);

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

  const hidingPassword = isTyping || (password.length > 0 && !showPassword);
  const revealingPassword = password.length > 0 && showPassword;

  return (
    <div style={{ position: 'relative', width: '550px', height: '400px' }}>

      {/* Purple tall rectangle — back layer */}
      <div
        ref={purpleRef}
        style={{
          position: 'absolute', bottom: 0, left: '70px',
          width: '180px',
          height: hidingPassword ? '440px' : '400px',
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: revealingPassword
            ? 'skewX(0deg)'
            : hidingPassword
              ? `skewX(${(pp.bodySkew || 0) - 12}deg) translateX(40px)`
              : `skewX(${pp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '2rem',
            left: revealingPassword ? '20px' : isLookingAtEachOther ? '55px' : `${45 + pp.faceX}px`,
            top: revealingPassword ? '35px' : isLookingAtEachOther ? '65px' : `${40 + pp.faceY}px`,
            transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isPurpleBlinking}
            forceLookX={revealingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={revealingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isPurpleBlinking}
            forceLookX={revealingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={revealingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      {/* Black tall rectangle — middle layer */}
      <div
        ref={blackRef}
        style={{
          position: 'absolute', bottom: 0, left: '240px',
          width: '120px', height: '310px',
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: revealingPassword
            ? 'skewX(0deg)'
            : isLookingAtEachOther
              ? `skewX(${(bp.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
              : hidingPassword
                ? `skewX(${(bp.bodySkew || 0) * 1.5}deg)`
                : `skewX(${bp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '1.5rem',
            left: revealingPassword ? '10px' : isLookingAtEachOther ? '32px' : `${26 + bp.faceX}px`,
            top: revealingPassword ? '28px' : isLookingAtEachOther ? '12px' : `${32 + bp.faceY}px`,
            transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isBlackBlinking}
            forceLookX={revealingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D"
            isBlinking={isBlackBlinking}
            forceLookX={revealingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* Orange semi-circle — front left */}
      <div
        ref={orangeRef}
        style={{
          position: 'absolute', bottom: 0, left: '0px',
          width: '240px', height: '200px',
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          zIndex: 3,
          transform: revealingPassword ? 'skewX(0deg)' : `skewX(${op.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '2rem',
            left: revealingPassword ? '50px' : `${82 + (op.faceX || 0)}px`,
            top: revealingPassword ? '85px' : `${90 + (op.faceY || 0)}px`,
            transition: 'left 0.2s ease-out, top 0.2s ease-out',
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={revealingPassword ? -5 : undefined}
            forceLookY={revealingPassword ? -4 : undefined}
          />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={revealingPassword ? -5 : undefined}
            forceLookY={revealingPassword ? -4 : undefined}
          />
        </div>
      </div>

      {/* Yellow pill character — front right */}
      <div
        ref={yellowRef}
        style={{
          position: 'absolute', bottom: 0, left: '310px',
          width: '140px', height: '230px',
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform: revealingPassword ? 'skewX(0deg)' : `skewX(${yp.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        {/* Eyes */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '1.5rem',
            left: revealingPassword ? '20px' : `${52 + (yp.faceX || 0)}px`,
            top: revealingPassword ? '35px' : `${40 + (yp.faceY || 0)}px`,
            transition: 'left 0.2s ease-out, top 0.2s ease-out',
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={revealingPassword ? -5 : undefined}
            forceLookY={revealingPassword ? -4 : undefined}
          />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={revealingPassword ? -5 : undefined}
            forceLookY={revealingPassword ? -4 : undefined}
          />
        </div>
        {/* Mouth line */}
        <div
          style={{
            position: 'absolute',
            width: '5rem',
            height: '4px',
            backgroundColor: '#2D2D2D',
            borderRadius: '9999px',
            left: revealingPassword ? '10px' : `${40 + (yp.faceX || 0)}px`,
            top: revealingPassword ? '88px' : `${88 + (yp.faceY || 0)}px`,
            transition: 'left 0.2s ease-out, top 0.2s ease-out',
          }}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────── Login Page ─────────────────────────────── */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ username, password });
      login(response.user, response.token);
      const redirectMap = { admin: '/dashboard', member: '/member-dashboard', instructor: '/instructor-dashboard' };
      navigate(redirectMap[response.user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">

      {/* ── Left Pane ── */}
      <div className="login-left-pane">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon-box">
            <Activity size={16} style={{ color: '#fff' }} />
          </div>
          <span>Neon Iron</span>
        </div>

        {/* Characters */}
        <div className="login-characters-container">
          <CharactersScene isTyping={isTyping} password={password} showPassword={showPassword} />
        </div>

        {/* Footer links */}
        <div className="login-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>

        {/* Decorative backgrounds */}
        <div className="login-decorative-bg" />
        <div className="login-decorative-blob-1" />
        <div className="login-decorative-blob-2" />
      </div>

      {/* ── Right Pane ── */}
      <div className="login-right-pane">
        <div className="login-form-container">

          {/* Mobile brand */}
          <div className="login-mobile-brand">
            <div className="login-mobile-brand-icon">
              <Activity size={16} />
            </div>
            <span>Neon Iron</span>
          </div>

          {/* Header */}
          <div className="login-header">
            <h1>Welcome back!</h1>
            <p>Please enter your details to sign in</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Username */}
            <div className="login-input-group">
              <label htmlFor="login-username" className="login-label">Username or Email</label>
              <input
                id="login-username"
                type="text"
                placeholder="e.g. admin or anna@gym.com"
                value={username}
                autoComplete="off"
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div className="login-input-group">
              <label htmlFor="login-password" className="login-label">Password</label>
              <div className="login-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="login-input-icon"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options row */}
            <div className="login-options">
              <div className="login-checkbox-group">
                <input
                  type="checkbox"
                  id="login-remember"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="login-remember" className="login-checkbox-label">Remember for 30 days</label>
              </div>
              <a href="#" className="login-forgot-link">Forgot password?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Google / SSO button */}
          <div className="login-social-container">
            <button type="button" className="login-google-btn">
              <Mail size={18} />
              Continue with Google
            </button>
          </div>

          {/* Sign up */}
          <div className="login-signup-text">
            Don&apos;t have an account?
            <Link to="/register" className="login-signup-link">Sign up</Link>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.8 }}>
            <p>Demo Admin: <code>admin</code> / <code>admin123</code></p>
            <p>Demo Member: <code>mike@test.com</code> / <code>password123</code></p>
            <p>Demo Coach: <code>john@neoniron.com</code> / <code>coach123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
