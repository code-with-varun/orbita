import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, CheckCircle2, Clock, Sparkles, FolderGit2, Target, Repeat, CheckSquare } from 'lucide-react';
import { MatrixSkeleton, CardSkeleton } from './SkeletonLoader';

export default function MonthlyHighlightsView({ onSelectTask, refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/highlights/month')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshTrigger]);

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

  const { scorecard, starred_items, badges, month } = data;

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
            <div className="metric-val">{scorecard.starred_count}</div>
            <div className="metric-lbl">Starred Milestones</div>
          </div>
        </div>
      </div>

      {/* Main Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Starred Milestones Section */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={20} color="var(--accent-amber)" fill="var(--accent-amber)" /> Starred Completed Milestones
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top accomplishments</span>
          </div>

          {starred_items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No starred milestones completed yet. Star (★) your most impactful items and complete them to showcase here!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {starred_items.map((task) => (
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
                        {task.ticket_key} • {task.orbita_type} • {task.workspace} • Completed: {task.completed_at ? task.completed_at.substring(0, 10) : 'Done'}
                      </div>
                    </div>
                  </div>

                  <span className="badge badge-success">Completed</span>
                </div>
              ))}
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
