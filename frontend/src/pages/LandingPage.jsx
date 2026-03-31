import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CinematicHero } from '../components/ui/CinematicHero';

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();

  // Auto-redirect logged-in users to their dashboard
  if (isAuthenticated && user) {
    const redirectMap = { admin: '/dashboard', member: '/member-dashboard', instructor: '/instructor-dashboard' };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-dark)', position: 'relative', minHeight: '100vh', width: '100%' }}>
      {/* Top right login option as page loads */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100 }}>
        <Link 
          to="/login"
          style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: '600',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Sign In
        </Link>
      </div>
      <CinematicHero />
    </div>
  );
};

export default LandingPage;
