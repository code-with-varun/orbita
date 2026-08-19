import React, { useState, useEffect } from 'react';
import {
  Plus,
  Square,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  RotateCcw,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Pause,
  Play
} from 'lucide-react';

function LiveTimerBadge({ runningTask, onStopTimer, onPauseTimer, onResumeTimer }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isPaused = Boolean(runningTask?.is_timer_paused);
  const accumulated = runningTask?.timer_accumulated_seconds || 0;

  useEffect(() => {
    if (isPaused) {
      setElapsedSeconds(accumulated);
      return;
    }

    if (!runningTask?.timer_started_at) {
      setElapsedSeconds(accumulated);
      return;
    }

    const calculateElapsed = () => {
      const startMs = new Date(runningTask.timer_started_at).getTime();
      const nowMs = Date.now();
      const diff = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(accumulated + diff);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningTask?.timer_started_at, runningTask?.is_timer_paused, accumulated, isPaused]);

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="running-timer-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isPaused ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: `1px solid ${isPaused ? 'var(--accent-amber)' : 'rgba(239, 68, 68, 0.3)'}` }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isPaused ? 'var(--accent-amber)' : '#ef4444',
          boxShadow: isPaused ? '0 0 8px var(--accent-amber)' : '0 0 8px #ef4444'
        }}
      />
      <span style={{ fontWeight: '800', color: isPaused ? 'var(--accent-amber)' : 'var(--accent-red)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
        {formatTime(elapsedSeconds)} {isPaused && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(PAUSED)</span>}
      </span>
      <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
        {runningTask.ticket_key}: {runningTask.title}
      </span>

      {/* Pause / Resume Button */}
      {isPaused ? (
        <button
          onClick={() => onResumeTimer && onResumeTimer(runningTask.id)}
          className="btn btn-secondary"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', borderRadius: '10px', color: 'var(--accent-green)' }}
          title="Resume Focus Timer"
        >
          <Play size={10} fill="currentColor" /> Resume
        </button>
      ) : (
        <button
          onClick={() => onPauseTimer && onPauseTimer(runningTask.id)}
          className="btn btn-secondary"
          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', borderRadius: '10px', color: 'var(--accent-amber)' }}
          title="Pause Focus Timer"
        >
          <Pause size={10} /> Pause
        </button>
      )}

      {/* Stop Button */}
      <button
        onClick={() => onStopTimer(runningTask.id)}
        className="btn btn-danger"
        style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem', borderRadius: '10px' }}
        title="Stop Focus Timer"
      >
        <Square size={10} /> Stop
      </button>
    </div>
  );
}

export default function Header({
  runningTask,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onOpenTaskModal,
  onOpenAuthModal,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  searchTerm,
  setSearchTerm,
  workspaceFilter,
  setWorkspaceFilter,
  onResetDatabase
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isSuperadmin = currentUser?.role === 'Superadmin';

  const handleResetClick = () => {
    if (!isSuperadmin) {
      alert('Access Denied: Only a Super Admin (superadmin@orbita.com) can perform a system reset.');
      return;
    }

    if (window.confirm('SUPERADMIN ACTION: Wipe all work items and reset the system to a clean setup for fresh users?')) {
      if (onResetDatabase) {
        onResetDatabase();
      }
    }
  };

  return (
    <header className="header">
      {/* Search Input & Workspace Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '550px' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search tasks, routines, goals, projects, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 2-Way Workspace Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }}>
          <button
            type="button"
            className={`btn ${workspaceFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: 'none' }}
            onClick={() => setWorkspaceFilter('All')}
          >
            All
          </button>
          <button
            type="button"
            className={`btn ${workspaceFilter === 'Personal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: 'none' }}
            onClick={() => setWorkspaceFilter('Personal')}
          >
            Personal
          </button>
          <button
            type="button"
            className={`btn ${workspaceFilter === 'Work' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: 'none' }}
            onClick={() => setWorkspaceFilter('Work')}
          >
            Work
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Active Live Ticking Stopwatch Badge */}
        {runningTask && (
          <LiveTimerBadge
            runningTask={runningTask}
            onStopTimer={onStopTimer}
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
          />
        )}

        {/* Superadmin-Only System Reset Button */}
        {isSuperadmin && (
          <button
            className="btn btn-secondary"
            onClick={handleResetClick}
            title="Superadmin: Reset app to fresh setup (preserves Superadmin)"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)' }}
          >
            <RotateCcw size={14} /> Reset System
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          className="btn btn-secondary"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ padding: '0.5rem' }}
        >
          {theme === 'dark' ? <Sun size={16} color="var(--accent-amber)" /> : <Moon size={16} color="var(--accent-blue)" />}
        </button>

        {/* Global New Item Button */}
        <button className="btn btn-primary" onClick={onOpenTaskModal}>
          <Plus size={16} /> New Item
        </button>

        {/* User Profile Badge */}
        {currentUser ? (
          <div style={{ position: 'relative' }}>
            <div
              className="user-badge-header"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={isSuperadmin ? { border: '1px solid var(--accent-amber)' } : {}}
            >
              <div
                className="user-avatar"
                style={isSuperadmin ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' } : {}}
              >
                {isSuperadmin ? '👑' : (currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isSuperadmin ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                  {currentUser.name}
                </span>
                {isSuperadmin && (
                  <span style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Super Admin
                  </span>
                )}
              </div>
            </div>

            {showUserDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '210px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  padding: '0.65rem',
                  zIndex: 200
                }}
              >
                <div style={{ padding: '0.4rem 0.2rem 0.6rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                  <span className={`badge ${isSuperadmin ? 'badge-priority-critical' : 'badge-priority-medium'}`} style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                    {currentUser.role || 'Member'}
                  </span>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={onOpenAuthModal}>
            <User size={16} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
