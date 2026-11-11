import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import OrbitaLogo from './OrbitaLogo';

export default function AuthModal({ isOpen, initialIsRegister = false, onClose, onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState(initialIsRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthMode(initialIsRegister ? 'register' : 'login');
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialIsRegister, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (authMode === 'forgot') {
      if (newPassword.length < 6) {
        setLoading(false);
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setLoading(false);
        setErrorMsg('New password and confirm password do not match.');
        return;
      }

      fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          new_password: newPassword
        })
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => Promise.reject(new Error(data.error || 'Password reset failed')));
          }
          return res.json();
        })
        .then((data) => {
          setLoading(false);
          setSuccessMsg(data.message || 'Password successfully updated! Please sign in with your new password.');
          setAuthMode('login');
          setPassword('');
          setNewPassword('');
          setConfirmPassword('');
        })
        .catch((err) => {
          setLoading(false);
          setErrorMsg(err.message || 'Connection error. Please try again.');
        });
      return;
    }

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register' ? { name, email, password, role } : { email, password };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => Promise.reject(new Error(data.error || 'Authentication failed')));
        }
        return res.json();
      })
      .then((data) => {
        setLoading(false);
        if (data.user) {
          onLoginSuccess(data.user);
          if (onClose) onClose();
        } else {
          setErrorMsg('Authentication succeeded but user profile was not returned.');
        }
      })
      .catch((err) => {
        setLoading(false);
        setErrorMsg(err.message || 'Connection error. Please try again.');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose ? onClose : undefined}>
      <div
        className="modal-card"
        style={{ maxWidth: '440px', padding: '2.25rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <OrbitaLogo size={46} showTagline={true} showBadge={true} badgeText="by Runit Infotech" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {authMode === 'register'
              ? 'Create Your Account'
              : authMode === 'forgot'
              ? 'Reset Account Password'
              : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {authMode === 'register'
              ? 'Join Orbita to streamline your execution & workflows'
              : authMode === 'forgot'
              ? 'Enter your registered email and choose a new password'
              : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Tab Switcher (Visible in login and register modes) */}
        {authMode !== 'forgot' ? (
          <div style={{ display: 'flex', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', border: 'none', padding: '0.45rem' }}
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setAuthMode('register');
              }}
            >
              <UserPlus size={14} /> Register
            </button>
            <button
              type="button"
              className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', border: 'none', padding: '0.45rem' }}
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setAuthMode('login');
              }}
            >
              <LogIn size={14} /> Sign In
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', border: 'none', background: 'transparent', color: 'var(--accent-blue)' }}
              onClick={() => {
                setErrorMsg('');
                setAuthMode('login');
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-green)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--accent-red)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Varun Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. varun@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {authMode !== 'forgot' ? (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setAuthMode('forgot');
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">New Password (min 6 characters)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Member">Member</option>
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Founder / Lead">Founder / Lead</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem', fontSize: '0.9rem' }}
          >
            {loading ? (
              'Processing...'
            ) : authMode === 'register' ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : authMode === 'forgot' ? (
              <>
                <KeyRound size={16} /> Reset & Update Password
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {authMode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setErrorMsg('');
                  setAuthMode('login');
                }}
              >
                Sign In
              </button>
            </>
          ) : authMode === 'login' ? (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setErrorMsg('');
                  setAuthMode('register');
                }}
              >
                Register
              </button>
            </>
          ) : (
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => {
                setErrorMsg('');
                setAuthMode('login');
              }}
            >
              Cancel and Return to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
