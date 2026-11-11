import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  KeyRound,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Layers,
  CreditCard,
  Contact,
  HardDriveDownload,
  Calendar,
  Sparkles
} from 'lucide-react';
import { downloadUserExcelExport, exportToJson } from '../utils/exportUtils';

export default function ProfileSettingsModal({
  isOpen,
  initialTab = 'profile',
  onClose,
  currentUser,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'export' | 'password'
  
  // Password Reset State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [skipCurrentPass, setSkipCurrentPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
    setPassError('');
    setPassSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [initialTab, isOpen]);

  // Fetch summary counts for user data when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setLoadingSummary(true);
      const userId = currentUser.id || currentUser._id || '';
      const userEmail = currentUser.email || '';
      const userName = currentUser.name || '';
      const userRole = currentUser.role || '';

      const query = new URLSearchParams({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        user_role: userRole
      });

      fetch(`/api/user/export-data?${query.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setDataSummary(data);
          setLoadingSummary(false);
        })
        .catch((err) => {
          console.error('Error fetching export summary:', err);
          setLoadingSummary(false);
        });
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const isSuperadmin = currentUser.role === 'Superadmin';

  // Handle Password Reset submission
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }

    setPassLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          current_password: skipCurrentPass ? undefined : currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPassSuccess(data.message || 'Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onShowToast) {
        onShowToast('Password updated successfully!', 'success');
      }
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  // Handle Multi-Sheet Excel Export
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const filename = await downloadUserExcelExport(currentUser);
      if (onShowToast) {
        onShowToast(`Export completed! Downloaded ${filename}`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast(err.message || 'Export failed. Please try again.', 'error');
      }
    } finally {
      setExportLoading(false);
    }
  };

  // Handle JSON Dump fallback
  const handleExportJson = async () => {
    try {
      const userId = currentUser.id || currentUser._id || '';
      const query = new URLSearchParams({
        user_id: userId,
        user_email: currentUser.email || '',
        user_name: currentUser.name || '',
        user_role: currentUser.role || ''
      });

      const res = await fetch(`/api/tasks?${query.toString()}`);
      const tasks = await res.json();
      const filename = `Orbita_Data_${(currentUser.name || 'User').replace(/\s+/g, '_')}`;
      exportToJson(filename, {
        user: currentUser,
        export_date: new Date().toISOString(),
        tasks: tasks
      });
      if (onShowToast) {
        onShowToast('JSON data dump downloaded successfully!', 'info');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Failed to export JSON dump', 'error');
    }
  };

  const counts = dataSummary?.counts || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: isSuperadmin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            >
              {isSuperadmin ? '👑' : (currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Profile & Settings
                </h2>
                <span className={`badge ${isSuperadmin ? 'badge-priority-critical' : 'badge-priority-medium'}`} style={{ fontSize: '0.7rem' }}>
                  {currentUser.role || 'Member'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                {currentUser.name} • {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none' }}
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.25rem',
            marginBottom: '1.5rem',
            gap: '0.25rem'
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', border: 'none', padding: '0.5rem' }}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} /> Profile & Overview
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', border: 'none', padding: '0.5rem' }}
            onClick={() => setActiveTab('export')}
          >
            <FileSpreadsheet size={15} /> Export Data (Excel)
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', border: 'none', padding: '0.5rem' }}
            onClick={() => setActiveTab('password')}
          >
            <KeyRound size={15} /> Password Reset
          </button>
        </div>

        {/* TAB 1: PROFILE & OVERVIEW */}
        {activeTab === 'profile' && (
          <div>
            <div
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="var(--accent-blue)" /> Account Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700' }}>Full Name</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', marginTop: '0.2rem' }}>{currentUser.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700' }}>Email Address</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', marginTop: '0.2rem' }}>{currentUser.email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700' }}>Access Level / Role</div>
                  <div style={{ color: 'var(--text-main)', fontWeight: '600', marginTop: '0.2rem' }}>{currentUser.role || 'Member'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700' }}>User ID</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                    {currentUser.id || currentUser._id || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* User Data Footprint Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} color="var(--accent-purple)" /> Your Stored Data Across Tables
                </h3>
                {loadingSummary && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Refreshing stats...</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{counts.total_work_items ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Work Items</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-green)' }}>{counts.focus_sessions ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Focus Sessions</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{counts.subscriptions ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Subscriptions</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{counts.warranties ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Warranties</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ec4899' }}>{counts.credentials ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Vault Passwords</div>
                </div>
                <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#06b6d4' }}>{counts.contacts ?? '...'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Contacts</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                onClick={() => setActiveTab('export')}
              >
                <FileSpreadsheet size={16} /> Export All Data to Excel (.xlsx)
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                onClick={() => setActiveTab('password')}
              >
                <KeyRound size={16} /> Reset Account Password
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DATA EXPORT (MULTI-SHEET EXCEL DUMP) */}
        {activeTab === 'export' && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.12))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-green)', fontWeight: '800', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                <FileSpreadsheet size={20} /> Complete Excel Sheet Data Dump
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Export all your user data table-wise into a clean Microsoft Excel sheet (<strong style={{ color: 'var(--text-main)' }}>.xlsx</strong>).
                Each table in the Orbita database is dumped into its own dedicated worksheet with clear columns and structured formatting.
              </p>
            </div>

            {/* Breakdown of Sheets */}
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Worksheets Included in Your Export:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '240px', overflowY: 'auto' }}>
              {[
                { name: '1. Profile Details', desc: 'Account credentials, role, User ID & join date', count: '1 record' },
                { name: '2. Work Items (Tasks)', desc: 'Tasks, Routines, Goals & Projects with priorities and schedules', count: `${counts.total_work_items || 0} items` },
                { name: '3. Project Stages & Subtasks', desc: 'Detailed milestone stages and checklist subtasks', count: `${counts.projects || 0} projects` },
                { name: '4. Focus & Time Sessions', desc: 'Chronological focus time tracking logs with elapsed durations', count: `${counts.focus_sessions || 0} sessions` },
                { name: '5. Subscriptions', desc: 'SaaS tools, renewal dates, auto-renew status & costs', count: `${counts.subscriptions || 0} subs` },
                { name: '6. Past Billing Cycles', desc: 'Historical invoice and payment cycle records', count: 'Recorded history' },
                { name: '7. Product Warranties', desc: 'Product assets, conditions, serial numbers & expiration dates', count: `${counts.warranties || 0} items` },
                { name: '8. Credential Vault', desc: 'Cyber-secured passwords (decrypted for you), logins & MFA', count: `${counts.credentials || 0} logins` },
                { name: '9. Contact Directory', desc: 'Address book contacts, phone numbers, emails & social links', count: `${counts.contacts || 0} contacts` },
                { name: '10. Activity & Audit Logs', desc: 'Security actions, timer sessions & creation timestamps', count: `${counts.audit_logs || 0} events` }
              ].map((sheet, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{sheet.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{sheet.desc}</div>
                    </div>
                  </div>
                  <span className="badge badge-priority-low" style={{ fontSize: '0.7rem' }}>
                    {sheet.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{
                  flex: 2,
                  justifyContent: 'center',
                  padding: '0.8rem 1.25rem',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  borderColor: '#059669'
                }}
                disabled={exportLoading}
                onClick={handleExportExcel}
              >
                {exportLoading ? (
                  <>
                    <HardDriveDownload size={18} className="animate-spin" /> Compiling Multi-Sheet Excel File...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet size={18} /> Export All Data Table-Wise (.xlsx)
                  </>
                )}
              </button>

              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.8rem 1rem', fontSize: '0.85rem' }}
                onClick={handleExportJson}
                title="Download standard JSON format"
              >
                <Download size={15} /> JSON Dump
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PASSWORD RESET */}
        {activeTab === 'password' && (
          <div>
            <div
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={16} color="var(--accent-amber)" /> Reset or Change Password
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Set a new password for account <strong style={{ color: 'var(--text-main)' }}>{currentUser.email}</strong>. Once updated, you can immediately use the new password.
              </p>
            </div>

            {passSuccess && (
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
                <CheckCircle2 size={16} /> {passSuccess}
              </div>
            )}

            {passError && (
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} /> {passError}
              </div>
            )}

            <form onSubmit={handlePasswordReset}>
              {!skipCurrentPass && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter existing password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={!skipCurrentPass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={skipCurrentPass}
                    onChange={(e) => setSkipCurrentPass(e.target.checked)}
                  />
                  <span>I forgot my current password (direct reset for verified account)</span>
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">New Password (min 6 characters)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                disabled={passLoading}
              >
                {passLoading ? 'Updating Password...' : <><KeyRound size={16} /> Update Password</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

