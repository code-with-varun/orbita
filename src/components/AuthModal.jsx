import React, { useState } from 'react';
import { LogIn, UserPlus, Orbit, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password, role } : { email, password };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then(data => Promise.reject(new Error(data.error || 'Authentication failed')));
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

  const handleFillSuperadmin = () => {
    setIsRegister(false);
    setEmail('superadmin@orbita.com');
    setPassword('superadmin123');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose ? onClose : undefined}>
      <div
        className="modal-card"
        style={{ maxWidth: '440px', padding: '2.25rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
            }}
          >
            <Orbit size={30} color="#ffffff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {isRegister ? 'Get Started with Orbita' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isRegister ? 'Create your account to organize your tasks & workflows' : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${isRegister ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', border: 'none', padding: '0.45rem' }}
            onClick={() => {
              setErrorMsg('');
              setIsRegister(true);
            }}
          >
            <UserPlus size={14} /> Register
          </button>
          <button
            type="button"
            className={`btn ${!isRegister ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', border: 'none', padding: '0.45rem' }}
            onClick={() => {
              setErrorMsg('');
              setIsRegister(false);
            }}
          >
            <LogIn size={14} /> Sign In
          </button>
        </div>

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
          {isRegister && (
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

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
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
            {loading ? 'Processing...' : isRegister ? <><UserPlus size={16} /> Create Account</> : <><LogIn size={16} /> Sign In</>}
          </button>
        </form>

        {/* Superadmin Quick Access */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleFillSuperadmin}
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', color: 'var(--accent-amber)' }}
            title="Pre-fill default Super Admin credentials"
          >
            <ShieldCheck size={14} /> Use Super Admin (superadmin@orbita.com)
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setErrorMsg('');
              setIsRegister(!isRegister);
            }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
}
