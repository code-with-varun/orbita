import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Target,
  FolderGit2,
  Calendar,
  Clock,
  ShieldAlert,
  Grid,
  Trophy,
  Table,
  Kanban
} from 'lucide-react';
import { OrbitaIcon } from './OrbitaLogo';

export default function Sidebar({ activeView, setActiveView, stats }) {
  const navSections = [
    {
      label: 'Overview & Insights',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'highlights', label: 'Monthly Highlights', icon: Trophy, badge: stats?.starred_count ? `★ ${stats.starred_count}` : null }
      ]
    },
    {
      label: 'Planning & Views',
      items: [
        { id: 'matrix', label: 'Priority Matrix (2x2)', icon: Grid },
        { id: 'calendar', label: 'Calendar Planner', icon: Calendar, badge: stats?.due_today ? `${stats.due_today} due` : null },
        { id: 'kanban', label: 'Kanban Board', icon: Kanban },
        { id: 'grid', label: 'Data Grid View', icon: Table }
      ]
    },
    {
      label: 'Core Work Items (4 Types)',
      items: [
        { id: 'tasks', label: 'Tasks (Single Action)', icon: CheckSquare, badge: stats?.tasks_count ? `${stats.tasks_count}` : null },
        { id: 'routines', label: 'Routines (Recurring)', icon: Repeat, badge: stats?.routines_count ? `${stats.routines_count}` : null },
        { id: 'goals', label: 'Goals (Focus Efforts)', icon: Target, badge: stats?.goals_count ? `${stats.goals_count}` : null },
        { id: 'projects', label: 'Projects (Multi-Stage)', icon: FolderGit2, badge: stats?.projects_count ? `${stats.projects_count}` : null }
      ]
    },
    {
      label: 'Effort & Audit',
      items: [
        { id: 'timesheet', label: 'Focus & Timesheets', icon: Clock },
        { id: 'audit_logs', label: 'Activity & Audit', icon: ShieldAlert }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ cursor: 'pointer', padding: '0.4rem 0' }} onClick={() => setActiveView('dashboard')}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 0 12px rgba(124, 58, 237, 0.2)'
        }}>
          <OrbitaIcon size={26} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h2 className="brand-title" style={{ letterSpacing: '0.04em', fontSize: '1.15rem' }}>ORBITA</h2>
          </div>
          <p style={{ fontSize: '0.66rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
            Work Management Tool <span style={{ opacity: 0.7 }}>• Runit Infotech</span>
          </p>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        {navSections.map((sec, sIdx) => (
          <div key={sIdx}>
            <div className="nav-section-label" style={{ marginBottom: '0.35rem' }}>{sec.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <div
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span>Total Items:</span>
          <strong style={{ color: 'var(--text-main)' }}>{stats?.total_tasks || 0}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Focus Logged:</span>
          <strong style={{ color: 'var(--accent-blue)' }}>{stats?.total_hours_logged || 0}h</strong>
        </div>
      </div>
    </aside>
  );
}
