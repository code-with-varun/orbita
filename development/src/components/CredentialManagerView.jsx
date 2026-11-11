import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Mail,
  User,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Lock,
  Sparkles,
  Key
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';

const MFA_TOOLS = [
  'Google Authenticator',
  'Salesforce Authenticator',
  'Microsoft Authenticator',
  'Mobile OTP / SMS',
  'Email OTP',
  'Authy',
  'Hardware Key (YubiKey)',
  'Duo Security',
  'None',
  'Other'
];

export default function CredentialManagerView({ currentUser, onShowToast }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mfaFilter, setMfaFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Revealed passwords state: keyed by credential ID -> { password, timer, expiresAt }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    site_or_app: '',
    category: 'Cloud / Dev',
    url: '',
    registered_email: '',
    mobile_number: '',
    user_id_name: '',
    password: '',
    mfa_tool: 'Google Authenticator',
    mfa_details: '',
    notes: ''
  });

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      let url = '/api/credentials?';
      if (currentUser) {
        url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&`;
      }
      if (mfaFilter !== 'All') url += `mfa_tool=${encodeURIComponent(mfaFilter)}&`;
      if (categoryFilter !== 'All') url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setCredentials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [currentUser, mfaFilter, categoryFilter]);

  // Countdown timer effect for revealed passwords
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRevealedPasswords((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (next[id].expiresAt <= now) {
            delete next[id];
            changed = true;
          } else {
            next[id] = {
              ...next[id],
              remainingSeconds: Math.ceil((next[id].expiresAt - now) / 1000)
            };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCredentials();
  };

  const handleRevealPassword = async (id, siteName) => {
    if (revealedPasswords[id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    try {
      const res = await fetch(`/api/credentials/${id}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: currentUser?.name || 'Authorized User' })
      });

      if (res.ok) {
        const data = await res.json();
        const durationSeconds = 20;
        setRevealedPasswords((prev) => ({
          ...prev,
          [id]: {
            password: data.password,
            expiresAt: Date.now() + durationSeconds * 1000,
            remainingSeconds: durationSeconds
          }
        }));
        if (onShowToast) onShowToast(`Password revealed for ${siteName} (auto-hides in 20s)`, 'info');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reveal password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPassword = (id, password) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    if (onShowToast) onShowToast('Password copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,.-=';
    let newPass = '';
    for (let i = 0; i < 18; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: newPass });
    setShowFormPassword(true);
  };

  const handleOpenAdd = () => {
    setEditingCred(null);
    setShowFormPassword(false);
    setFormData({
      site_or_app: '',
      category: 'Cloud / Dev',
      url: '',
      registered_email: currentUser?.email || '',
      mobile_number: '',
      user_id_name: '',
      password: '',
      mfa_tool: 'Google Authenticator',
      mfa_details: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cred) => {
    setEditingCred(cred);
    setShowFormPassword(false);
    setFormData({
      site_or_app: cred.site_or_app,
      category: cred.category || 'General',
      url: cred.url || '',
      registered_email: cred.registered_email || '',
      mobile_number: cred.mobile_number || '',
      user_id_name: cred.user_id_name || '',
      password: '',
      mfa_tool: cred.mfa_tool || 'None',
      mfa_details: cred.mfa_details || '',
      notes: cred.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id, siteName) => {
    if (!window.confirm(`Are you sure you want to delete vault credentials for "${siteName}"?`)) return;
    try {
      const res = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onShowToast) onShowToast(`Credential for "${siteName}" removed`, 'info');
        setRevealedPasswords((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        fetchCredentials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCredential = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        user_name: currentUser?.name || 'User'
      };

      const url = editingCred ? `/api/credentials/${editingCred.id}` : '/api/credentials';
      const method = editingCred ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (onShowToast) onShowToast(editingCred ? 'Vault credential updated' : 'Credential cyber-encrypted and saved', 'success');
        setIsFormOpen(false);
        fetchCredentials();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save credential');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderMfaBadge = (tool) => {
    switch (tool) {
      case 'Salesforce Authenticator':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <ShieldCheck size={13} /> Salesforce Authenticator
          </span>
        );
      case 'Google Authenticator':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-green)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Key size={13} /> Google Authenticator
          </span>
        );
      case 'Microsoft Authenticator':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            border: '1px solid rgba(129, 140, 248, 0.3)'
          }}>
            <ShieldCheck size={13} /> Microsoft Authenticator
          </span>
        );
      case 'Mobile OTP / SMS':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Smartphone size={13} /> Mobile OTP / SMS
          </span>
        );
      case 'Email OTP':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(236, 72, 153, 0.15)',
            color: 'var(--accent-pink)',
            border: '1px solid rgba(236, 72, 153, 0.3)'
          }}>
            <Mail size={13} /> Email OTP
          </span>
        );
      case 'Hardware Key (YubiKey)':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent-purple)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <KeyRound size={13} /> Hardware Key (YubiKey)
          </span>
        );
      case 'Authy':
      case 'Duo Security':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 9px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.15)',
            color: 'var(--accent-red)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <ShieldAlert size={13} /> {tool}
          </span>
        );
      case 'None':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 8px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)'
          }}>
            None / Disabled
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 8px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            color: 'var(--text-main)',
            background: 'rgba(255, 255, 255, 0.05)'
          }}>
            {tool}
          </span>
        );
    }
  };

  const mfaCount = credentials.filter((c) => c.mfa_tool && c.mfa_tool !== 'None').length;

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.15)',
              padding: '8px',
              borderRadius: '10px',
              color: 'var(--accent-purple)',
              display: 'flex'
            }}>
              <KeyRound size={22} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>Master Credential Manager</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
            AES-256 cyber-encrypted vault with DB transaction protection, MFA tool governance, and line-item password reveal
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Credential
        </button>
      </div>

      {/* Security Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '10px',
        padding: '0.75rem 1.1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lock size={17} color="var(--accent-purple)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
            <strong>Cyber Security Active:</strong> Passwords encrypted via AES-256-GCM. DB transactions and API payloads return strictly masked tokens.
          </span>
        </div>
        <span style={{
          fontSize: '0.72rem',
          padding: '2px 8px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.2)',
          color: 'var(--accent-green)',
          fontWeight: 600
        }}>
          Vault Protected
        </span>
      </div>

      {/* KPI Cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Vault Credentials</span>
            <Lock size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
            {credentials.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Encrypted accounts & sites
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>2FA / MFA Configured</span>
            <ShieldCheck size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-green)' }}>
            {mfaCount} / {credentials.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Protected with multi-factor tools
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Salesforce Authenticator</span>
            <ShieldCheck size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: '#38bdf8' }}>
            {credentials.filter((c) => c.mfa_tool === 'Salesforce Authenticator').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Salesforce 2FA managed accounts
          </div>
        </div>

        <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Google Authenticator</span>
            <Key size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent-green)' }}>
            {credentials.filter((c) => c.mfa_tool === 'Google Authenticator').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Google OTP secured accounts
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ padding: '0.9rem 1.1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search site, email, mobile, username, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Search</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MFA Tool:</span>
            <select
              value={mfaFilter}
              onChange={(e) => setMfaFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All MFA Tools</option>
              {MFA_TOOLS.map((tool) => (
                <option key={tool} value={tool}>{tool}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchCredentials} title="Refresh" style={{ padding: '7px 10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <TableSkeleton rows={5} />
          </div>
        ) : credentials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <KeyRound size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No credentials found in vault
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              Securely register login accounts, encrypted passwords, MFA tools (Salesforce, Google Authenticator), and registered phones.
            </p>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Add First Credential
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Site / Application</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Registered Email</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mobile Number</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>User ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Password (Encrypted)</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>MFA Tool</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => {
                  const revealed = revealedPasswords[cred.id];

                  return (
                    <tr
                      key={cred.id}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                      className="table-row-hover"
                    >
                      {/* Site or Application */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.12)',
                            color: 'var(--accent-purple)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}>
                            {cred.site_or_app.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {cred.site_or_app}
                              {cred.url && (
                                <a
                                  href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--text-dim)' }}
                                  title="Open site"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {cred.category || 'General'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Registered Email */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {cred.registered_email || '—'}
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {cred.mobile_number || '—'}
                        </div>
                      </td>

                      {/* User ID */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {cred.user_id_name || '—'}
                        </div>
                      </td>

                      {/* Password & Reveal */}
                      <td style={{ padding: '12px 16px' }}>
                        {revealed ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'var(--accent-green)',
                              fontSize: '0.88rem',
                              letterSpacing: '0.02em'
                            }}>
                              {revealed.password}
                            </span>

                            <button
                              className="action-icon-btn"
                              onClick={() => handleCopyPassword(cred.id, revealed.password)}
                              title="Copy password"
                              style={{ padding: '3px', color: copiedId === cred.id ? 'var(--accent-green)' : 'var(--text-muted)' }}
                            >
                              {copiedId === cred.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>

                            <button
                              className="action-icon-btn"
                              onClick={() => handleRevealPassword(cred.id, cred.site_or_app)}
                              title="Hide password immediately"
                              style={{ padding: '3px', color: 'var(--accent-red)' }}
                            >
                              <EyeOff size={13} />
                            </button>

                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginLeft: '2px' }}>
                              ({revealed.remainingSeconds}s)
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'monospace', letterSpacing: '0.15em', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                              ••••••••••••
                            </span>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleRevealPassword(cred.id, cred.site_or_app)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                color: 'var(--accent-purple)'
                              }}
                              title="Click to reveal only this line item's password"
                            >
                              <Eye size={12} /> Reveal
                            </button>
                          </div>
                        )}
                      </td>

                      {/* MFA Tool */}
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          {renderMfaBadge(cred.mfa_tool)}
                          {cred.mfa_details && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {cred.mfa_details}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenEdit(cred)}
                            title="Edit Credential"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleDelete(cred.id, cred.site_or_app)}
                            title="Delete Credential"
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CREDENTIAL                                   */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} color="var(--accent-purple)" />
                <h2 className="modal-title">
                  {editingCred ? 'Edit Credential' : 'Add Credential to Vault'}
                </h2>
              </div>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCredential}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Site or Application Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Console, Salesforce, Google Cloud, GitHub"
                    value={formData.site_or_app}
                    onChange={(e) => setFormData({ ...formData, site_or_app: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Cloud / Dev">Cloud / Dev</option>
                    <option value="Email & Productivity">Email & Productivity</option>
                    <option value="CRM & Sales">CRM & Sales</option>
                    <option value="Finance & Banking">Finance & Banking</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Internal Tools">Internal Tools</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    placeholder="user@domain.com"
                    value={formData.registered_email}
                    onChange={(e) => setFormData({ ...formData, registered_email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">User ID / Username</label>
                  <input
                    type="text"
                    placeholder="admin_sys / varun_dev"
                    value={formData.user_id_name}
                    onChange={(e) => setFormData({ ...formData, user_id_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password Input with Cyber Encrypt & Generator */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {editingCred ? 'Change Password (Leave blank to keep existing)' : 'Master Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-purple)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}
                  >
                    <Sparkles size={12} /> Generate Cyber-Strong Password
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required={!editingCred}
                    placeholder={editingCred ? '•••••••••••• (Encrypted in DB)' : 'Enter secure password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '40px', fontFamily: showFormPassword ? 'monospace' : 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Password will be encrypted via AES-256-GCM before DB insertion and safe cyber tokenized.
                </div>
              </div>

              {/* Multi-Factor Authentication */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Multi-Factor Tool (2FA) *</label>
                  <select
                    value={formData.mfa_tool}
                    onChange={(e) => setFormData({ ...formData, mfa_tool: e.target.value })}
                    className="form-select"
                  >
                    {MFA_TOOLS.map((tool) => (
                      <option key={tool} value={tool}>{tool}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">MFA Notes / Backup Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. Registered with device iPhone 16, SMS backup"
                    value={formData.mfa_details}
                    onChange={(e) => setFormData({ ...formData, mfa_details: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Login URL</label>
                <input
                  type="text"
                  placeholder="https://login.salesforce.com or https://console.aws.amazon.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">General Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Root account, requires VPN for access"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCred ? 'Update Vault Credential' : 'Save Encrypted Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
