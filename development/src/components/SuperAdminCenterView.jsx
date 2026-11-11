import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Database,
  Download,
  Trash2,
  RefreshCw,
  Activity,
  UserCheck,
  Server,
  FileSpreadsheet,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { CardSkeleton } from './SkeletonLoader';

export default function SuperAdminCenterView({ currentUser, onResetDatabase, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'backups' | 'maintenance'
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchAdminData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/overview').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json())
    ])
      .then(([ovData, usersData]) => {
        setOverview(ovData);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load admin data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRole = (userId, newRole) => {
    fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole, updated_by: currentUser?.name || 'Super Admin' })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setActionMessage({ text: data.error, type: 'danger' });
        } else {
          setActionMessage({ text: `User role updated to ${newRole}`, type: 'success' });
          fetchAdminData();
        }
      })
      .catch((err) => setActionMessage({ text: err.message, type: 'danger' }));
  };

  const handleDeleteUser = (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) return;

    fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updated_by: currentUser?.name || 'Super Admin' })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setActionMessage({ text: data.error, type: 'danger' });
        } else {
          setActionMessage({ text: `User "${userName}" deleted successfully`, type: 'success' });
          fetchAdminData();
        }
      })
      .catch((err) => setActionMessage({ text: err.message, type: 'danger' }));
  };

  const handleDownloadBackupJSON = () => {
    fetch('/api/admin/backups/dump')
      .then((res) => res.json())
      .then((data) => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Orbita_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setActionMessage({ text: 'Full JSON system backup downloaded successfully!', type: 'success' });
      })
      .catch((err) => setActionMessage({ text: err.message, type: 'danger' }));
  };

  const handleDownloadUsersCSV = () => {
    if (users.length === 0) return;
    let csv = 'ID,Name,Email,Role,RegisteredDate,WorkItemsCount,FocusHoursLogged\n';
    users.forEach((u) => {
      csv += `"${u.id}","${u.name}","${u.email}","${u.role}","${new Date(u.createdAt).toLocaleString()}",${u.task_count},${u.logged_hours}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orbita_Users_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setActionMessage({ text: 'Users CSV report downloaded!', type: 'success' });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Superadmin Command Center</h2>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
                System Governance
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              System overview, User Management & Governance, Database Backups, and Maintenance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchAdminData} title="Refresh System Status">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleDownloadBackupJSON}>
            <Download size={15} /> Backup Data Dumps
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`badge badge-${actionMessage.type === 'danger' ? 'priority-high' : 'success'}`}
          style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} /> System Health & Metrics
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> User Management ({users.length})
        </button>
        <button
          className={`btn ${activeTab === 'backups' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('backups')}
        >
          <Database size={16} /> Data Backups & Dumps
        </button>
        <button
          className={`btn ${activeTab === 'maintenance' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Server size={16} /> System Maintenance & Reset
        </button>
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <>
          {/* TAB 1: OVERVIEW & HEALTH */}
          {activeTab === 'overview' && overview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Database Health
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Server size={20} /> {overview.database_status}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Target DB: <strong>{overview.database_name}</strong>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Registered Users
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-blue)' }}>
                    {overview.users.total} Users
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Superadmins: {overview.users.superadmin} | Admins: {overview.users.admin} | Members: {overview.users.member}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Total Work Items
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-purple)' }}>
                    {overview.work_items.total} Items
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Tasks: {overview.work_items.tasks} | Routines: {overview.work_items.routines} | Goals: {overview.work_items.goals} | Projects: {overview.work_items.projects}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    Focus Effort Logged
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
                    {overview.effort.total_focus_hours}h
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Sessions: {overview.effort.total_sessions} | Running Timers: {overview.effort.active_running_timers}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} /> Platform Governance Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>User Role Distribution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Superadmin (System Governance):</span>
                        <strong>{overview.users.superadmin}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Admins (Workspace Managers):</span>
                        <strong>{overview.users.admin}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Members (Standard Users):</span>
                        <strong>{overview.users.member}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-purple)' }}>Work Item Distribution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Single Action Tasks:</span>
                        <strong>{overview.work_items.tasks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Recurring Routines:</span>
                        <strong>{overview.work_items.routines}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Focus Effort Goals:</span>
                        <strong>{overview.work_items.goals}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Multi-Stage Projects:</span>
                        <strong>{overview.work_items.projects}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT & GOVERNANCE */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search user by name, email, or role..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    flex: '1',
                    maxWidth: '400px'
                  }}
                />

                <button className="btn btn-secondary" onClick={handleDownloadUsersCSV}>
                  <FileSpreadsheet size={15} /> Export Users CSV
                </button>
              </div>

              <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>User Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Work Items</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Focus Hours</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Registered Date</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isSuperadminAccount = u.email.toLowerCase() === 'superadmin@orbita.com';
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <UserCheck size={16} style={{ color: 'var(--accent-blue)' }} /> {u.name}
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {isSuperadminAccount ? (
                              <span className="badge badge-purple">Superadmin</span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-main)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '0.78rem'
                                }}
                              >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                                <option value="Superadmin">Superadmin</option>
                              </select>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{u.task_count}</td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--accent-amber)' }}>{u.logged_hours}h</td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            {!isSuperadminAccount && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                title="Delete User Account"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DATA BACKUPS & DUMPS */}
          {activeTab === 'backups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={20} style={{ color: 'var(--accent-blue)' }} /> Full System Backup & Data Dumps
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Download high-fidelity full database snapshots containing all User profiles, Tasks, Routines, Goals, Projects, Focus Timesheets, and Audit Logs.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }} onClick={handleDownloadBackupJSON}>
                    <Download size={18} /> Download Full JSON Backup
                  </button>

                  <button className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }} onClick={handleDownloadUsersCSV}>
                    <FileSpreadsheet size={18} /> Export Registered Users CSV
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.5rem' }}>Backup Schedule & Policy</h4>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                  <li>Backups include complete MongoDB Atlas documents from the <strong>orbita</strong> collection.</li>
                  <li>User passwords are stripped automatically for security prior to backup export.</li>
                  <li>System audits record every data backup action triggered by Superadmins.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM MAINTENANCE & RESET */}
          {activeTab === 'maintenance' && (
            <div className="glass-card" style={{ border: '1px solid var(--accent-red)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--accent-red)' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>System Maintenance & Database Reset</h3>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                Only a verified <strong>Superadmin</strong> can trigger a database maintenance reset. Resetting will clear all operational work items and restore default seed items while preserving the primary Superadmin account.
              </p>

              <button className="btn btn-danger" style={{ padding: '0.75rem 1.5rem', fontWeight: '700' }} onClick={() => setIsResetConfirmOpen(true)}>
                <RefreshCw size={18} /> Trigger System Reset
              </button>

              {/* Reset Modal Confirmation */}
              {isResetConfirmOpen && (
                <div className="modal-overlay">
                  <div className="modal-content glass-card" style={{ maxWidth: '450px', padding: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent-red)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={20} /> Confirm Database Reset
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      Are you sure you want to reset the Orbita database? This action is irreversible.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => setIsResetConfirmOpen(false)}>
                        Cancel
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setIsResetConfirmOpen(false);
                          onResetDatabase();
                        }}
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
