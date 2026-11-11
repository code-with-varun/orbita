import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, CheckCircle2, Clock, Sparkles, FolderGit2, Target, Repeat, CheckSquare } from 'lucide-react';
import { MatrixSkeleton, CardSkeleton } from './SkeletonLoader';

export default function MonthlyHighlightsView({ currentUser, onSelectTask, refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Completed'

  useEffect(() => {
    let url = '/api/highlights/month?';
    if (currentUser) {
      url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&user_name=${encodeURIComponent(currentUser.name || '')}&`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshTrigger, currentUser]);

  if (loading || !data) {
    return (
      <div className="content-area">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '100px' }} />
          ))}
        </div>
        <MatrixSkeleton />
      </div>
    );
  }

  const scorecard = data?.scorecard || {
    achievement_score: 0,
    total_completed: 0,
    projects_completed: 0,
    routines_kept: 0,
    focus_hours: 0,
    goals_tracked: 0
  };
  const starred_items = Array.isArray(data?.starred_items) ? data.starred_items : [];
  const badges = Array.isArray(data?.badges) ? data.badges : [];
  const month = data?.month || 'Current Month';

  return (
    <div className="content-area">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Highlights & Scorecard</h1>
          <p className="page-subtitle">Recognizing achievements, completed milestones & deep work for {month}</p>
        </div>

        <div className="glass-card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderColor: 'var(--accent-amber)' }}>
          <Trophy size={24} color="var(--accent-amber)" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>
              {scorecard.achievement_score}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Grid */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.total_completed}</div>
            <div className="metric-lbl">Total Completed Items</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
            <FolderGit2 size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.projects_completed || 0}</div>
            <div className="metric-lbl">Projects Delivered</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Target size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.goals_completed || 0}</div>
            <div className="metric-lbl">Goals Achieved</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.focus_hours}h</div>
            <div className="metric-lbl">Deep Focus Hours</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Star size={24} fill="var(--accent-amber)" />
          </div>
          <div>
            <div className="metric-val">{starred_items.length}</div>
            <div className="metric-lbl">
              Starred Milestones ({starred_items.filter((t) => t.status === 'Completed').length} done • {starred_items.filter((t) => t.status !== 'Completed').length} active)
            </div>
          </div>
        </div>
      </div>

      {/* Main Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Starred Milestones Section */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Star size={20} color="var(--accent-amber)" fill="var(--accent-amber)" /> Starred Highlights & Key Milestones
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing impactful focus items with their live, actual progress status
              </span>
            </div>

            {/* Quick Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'All', label: `All (${starred_items.length})` },
                { id: 'Active', label: `Active (${starred_items.filter((t) => t.status !== 'Completed').length})` },
                { id: 'Completed', label: `Completed (${starred_items.filter((t) => t.status === 'Completed').length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    background: statusFilter === tab.id ? 'var(--accent-amber)' : undefined,
                    borderColor: statusFilter === tab.id ? 'var(--accent-amber)' : undefined,
                    color: statusFilter === tab.id ? '#000' : undefined
                  }}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {starred_items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No starred milestones found. Star (★) your most impactful items anywhere in the app to showcase them here!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {starred_items
                .filter((task) => {
                  if (statusFilter === 'Active') return task.status !== 'Completed';
                  if (statusFilter === 'Completed') return task.status === 'Completed';
                  return true;
                })
                .map((task) => {
                  const isDone = task.status === 'Completed';
                  const isInProgress = task.status === 'In Progress';

                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--accent-amber)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <Star size={20} color="var(--accent-amber)" fill="var(--accent-amber)" />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {task.ticket_key} • {task.orbita_type} • {task.workspace} •{' '}
                            {isDone
                              ? `Completed: ${task.completed_at ? task.completed_at.substring(0, 10) : 'Done'}`
                              : `Due: ${task.due_date || task.scheduled_date || 'No Date'}`}
                          </div>
                        </div>
                      </div>

                      {/* Actual Live Status Badge */}
                      <span
                        className={`badge ${isDone ? 'badge-success' : isInProgress ? 'badge-priority-medium' : 'badge-priority-high'}`}
                        style={
                          isDone
                            ? {}
                            : isInProgress
                            ? { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)' }
                            : { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59, 130, 246, 0.3)' }
                        }
                      >
                        {task.status || 'Active'}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Achievement Badges */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} color="var(--accent-purple)" /> Achievement Badges
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {badges.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 0.85rem',
                  background: b.earned ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${b.earned ? b.color : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  opacity: b.earned ? 1 : 0.45
                }}
              >
                <div style={{ color: b.earned ? b.color : 'var(--text-dim)' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: b.earned ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {b.title} {b.earned && '✓'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
