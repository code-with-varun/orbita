import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Star,
  Repeat,
  Target,
  FolderGit2,
  CheckSquare
} from 'lucide-react';

export default function DashboardView({ stats, onSelectTask, setActiveView }) {
  if (!stats) return <div className="content-area">Loading executive dashboard...</div>;

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Productivity metrics across Tasks, Routines, Goals & Projects</p>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.total_tasks}</div>
            <div className="metric-lbl">Total Work Items</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.completed_tasks}</div>
            <div className="metric-lbl">Completed ({stats.completion_rate}%)</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.total_hours_logged}h</div>
            <div className="metric-lbl">Deep Focus Effort</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Star size={24} fill="var(--accent-amber)" />
          </div>
          <div>
            <div className="metric-val">{stats.starred_count || 0}</div>
            <div className="metric-lbl">Milestone Stars</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="metric-val">{stats.due_today}</div>
            <div className="metric-lbl">Due Today</div>
          </div>
        </div>
      </div>

      {/* Main Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Work Items */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>Recent Work Items</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest activity</span>
          </div>

          {(!stats.recent_tasks || stats.recent_tasks.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No items created yet. Click <strong>+ New Item</strong> to create your first Task, Routine, Goal, or Project!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recent_tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${task.orbita_type === 'Project' ? 'var(--accent-blue)' : task.orbita_type === 'Goal' ? 'var(--accent-amber)' : task.orbita_type === 'Routine' ? 'var(--accent-purple)' : 'var(--accent-green)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectTask(task.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
                      {task.ticket_key}
                    </span>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {task.is_starred ? '★ ' : ''}{task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.orbita_type} • {task.workspace} {task.tags ? `• ${task.tags}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                      {task.priority}
                    </span>
                    <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                      {task.status}
                    </span>
                    <ArrowUpRight size={16} color="var(--text-dim)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4 Core Types Breakdown */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
            The 4 Orbita Types
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Task */}
            <div
              style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              onClick={() => setActiveView && setActiveView('tasks')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  <CheckSquare size={15} color="var(--accent-green)" /> Tasks (Single Actions)
                </div>
                <span className="badge badge-status">{stats.tasks_count || 0}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>One-time simple completion (No timer)</div>
            </div>

            {/* Routine */}
            <div
              style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              onClick={() => setActiveView && setActiveView('routines')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  <Repeat size={15} color="var(--accent-purple)" /> Routines (Recurring)
                </div>
                <span className="badge badge-status">{stats.routines_count || 0}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repeats on schedule (Daily/Weekly/Monthly)</div>
            </div>

            {/* Goal */}
            <div
              style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              onClick={() => setActiveView && setActiveView('goals')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  <Target size={15} color="var(--accent-amber)" /> Goals (Focus Efforts)
                </div>
                <span className="badge badge-status">{stats.goals_count || 0}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time-tracked ongoing effort with focus timer</div>
            </div>

            {/* Project */}
            <div
              style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              onClick={() => setActiveView && setActiveView('projects')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                  <FolderGit2 size={15} color="var(--accent-blue)" /> Projects (Multi-Stage)
                </div>
                <span className="badge badge-status">{stats.projects_count || 0}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Structured multistep delivery (Stages & Tasks)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
