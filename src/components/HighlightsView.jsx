import React, { useState, useEffect } from 'react';
import { Star, Award, CheckCircle2, Flame, Repeat, Clock, Trophy, Sparkles, ArrowUpRight } from 'lucide-react';

export default function HighlightsView({ onSelectTask, refreshTrigger }) {
  const [highlightsData, setHighlightsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/highlights/month')
      .then((res) => res.json())
      .then((data) => {
        setHighlightsData(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [refreshTrigger]);

  if (loading || !highlightsData) {
    return <div className="content-area">Loading monthly highlights report...</div>;
  }

  const { scorecard, starred_items, badges, month } = highlightsData;

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Highlights & Achievements</h1>
          <p className="page-subtitle">{month} • Productivity Recognition & Starred Milestones</p>
        </div>
        <div className="glass-card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.08)' }}>
          <Trophy size={22} color="var(--accent-amber)" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productivity Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>{scorecard.achievement_score}</div>
          </div>
        </div>
      </div>

      {/* Scorecard Metrics */}
      <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.total_completed}</div>
            <div className="metric-lbl">Total Completed</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.workflows_completed}</div>
            <div className="metric-lbl">Workflows Delivered</div>
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
            <Flame size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.streak_days} Days</div>
            <div className="metric-lbl">Current Streak</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
            <Repeat size={24} />
          </div>
          <div>
            <div className="metric-val">{scorecard.routine_completion_rate}%</div>
            <div className="metric-lbl">Routine Consistency</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Starred Completed Milestones */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} fill="var(--accent-amber)" color="var(--accent-amber)" /> Starred Completed Milestones
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{starred_items.length} milestones</span>
          </div>

          {starred_items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No starred completed items yet. Star (★) your important items and complete them to appear in highlights!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {starred_items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${item.workspace_color || 'var(--accent-amber)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectTask(item.id)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: '800', color: item.workspace_color, fontSize: '0.85rem' }}>
                        {item.ticket_key}
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {item.title}
                      </span>
                      <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                        {item.complexity || 'Task'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Completed on: {item.completed_at ? item.completed_at.substring(0, 10) : 'Recent'} • {item.project_name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                    <ArrowUpRight size={16} color="var(--text-dim)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievement Badges */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--accent-purple)" /> Achievement Badges
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {badges.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem',
                  background: 'var(--bg-card-hover)',
                  border: `1px solid ${b.earned ? b.color + '44' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  opacity: b.earned ? 1 : 0.45
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: b.earned ? b.color + '22' : 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: b.earned ? b.color : 'var(--text-dim)'
                  }}
                >
                  <Award size={18} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: b.earned ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {b.title} {b.earned ? '★' : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
