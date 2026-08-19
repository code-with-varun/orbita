import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle2, Star, Repeat, Target, FolderGit2, CheckSquare } from 'lucide-react';
import { MatrixSkeleton } from './SkeletonLoader';

export default function PriorityMatrixView({
  currentUser,
  onSelectTask,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onToggleStar,
  onUpdateTaskStatus,
  refreshTrigger,
  workspaceFilter,
  onRefresh
}) {
  const [matrixData, setMatrixData] = useState({ Q1: [], Q2: [], Q3: [], Q4: [] });
  const [loading, setLoading] = useState(true);

  const fetchMatrix = () => {
    let url = '/api/matrix?';
    if (workspaceFilter && workspaceFilter !== 'All') {
      url += `workspace=${workspaceFilter}&`;
    }
    if (currentUser) {
      url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&user_name=${encodeURIComponent(currentUser.name || '')}&`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMatrixData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatrix();
  }, [refreshTrigger, workspaceFilter]);

  const handleToggleItem = (task) => {
    if (task.is_stage_task) {
      fetch(`/api/projects/${task.parent_project_id}/stages/${task.parent_stage_id}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true })
      })
        .then(() => {
          fetchMatrix();
          if (onRefresh) onRefresh();
        });
    } else {
      onUpdateTaskStatus(task.id, 'Completed');
    }
  };

  const handleTimerAction = (task) => {
    if (task.is_stage_task) {
      if (task.is_timer_running) {
        fetch(`/api/projects/${task.parent_project_id}/stages/${task.parent_stage_id}/tasks/${task.id}/timer/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name: 'User' })
        }).then(() => {
          fetchMatrix();
          if (onRefresh) onRefresh();
        });
      } else {
        fetch(`/api/projects/${task.parent_project_id}/stages/${task.parent_stage_id}/tasks/${task.id}/timer/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name: 'User' })
        }).then(() => {
          fetchMatrix();
          if (onRefresh) onRefresh();
        });
      }
    } else {
      onStartTimer(task.id);
    }
  };

  const quadrants = [
    {
      id: 'Q1',
      title: 'Q1: Do Now',
      subtitle: 'Urgent & Important (Crises, Critical Deadlines & Immediate Bills)',
      borderColor: 'var(--accent-red)',
      tasks: matrixData.Q1 || []
    },
    {
      id: 'Q2',
      title: 'Q2: Plan & Schedule',
      subtitle: 'Important & Not Urgent (Goals, Learning, Key Projects & Growth)',
      borderColor: 'var(--accent-blue)',
      tasks: matrixData.Q2 || []
    },
    {
      id: 'Q3',
      title: 'Q3: Quick Action',
      subtitle: 'Urgent & Not Important (Chores, Interruptions & Quick Routines)',
      borderColor: 'var(--accent-purple)',
      tasks: matrixData.Q3 || []
    },
    {
      id: 'Q4',
      title: 'Q4: Someday / Optional',
      subtitle: 'Not Urgent & Not Important (Ideas & Low Priority Tasks)',
      borderColor: 'var(--text-dim)',
      tasks: matrixData.Q4 || []
    }
  ];

  const getTypeIcon = (type) => {
    if (type === 'Routine') return <Repeat size={11} color="var(--accent-purple)" />;
    if (type === 'Goal') return <Target size={11} color="var(--accent-amber)" />;
    if (type === 'Project') return <FolderGit2 size={11} color="var(--accent-blue)" />;
    return <CheckSquare size={11} color="var(--accent-green)" />;
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Eisenhower Priority Matrix</h1>
          <p className="page-subtitle">Strategic 2x2 Decision Grid (Scrollable Quadrants with Stage-Tasks)</p>
        </div>
      </div>

      {loading ? (
        <MatrixSkeleton />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {quadrants.map((q) => (
            <div
              key={q.id}
              className="glass-card"
              style={{
                borderTop: `4px solid ${q.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                height: '520px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {q.title}
                  </h3>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{q.subtitle}</p>
                </div>
                <span className="nav-item-badge">{q.tasks.length} items</span>
              </div>

              {/* Scrollable Container (displays 4-5 items cleanly then scrolls) */}
              <div className="scrollable-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                {q.tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '3rem' }}>
                    No active items in {q.id}
                  </div>
                ) : (
                  q.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-card"
                      style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}
                      onClick={() => onSelectTask(task.is_stage_task ? task.parent_project_id : task.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                            {task.ticket_key}
                          </span>
                          <span className="badge badge-status" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.63rem', padding: '0.1rem 0.35rem' }}>
                            {getTypeIcon(task.orbita_type)} {task.is_stage_task ? `Project Task` : task.orbita_type}
                          </span>
                          <span className="badge badge-status" style={{ fontSize: '0.63rem', padding: '0.1rem 0.35rem' }}>
                            {task.workspace}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(task.is_stage_task ? task.parent_project_id : task.id);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)', padding: 0 }}
                          title={task.is_starred ? 'Starred milestone' : 'Mark as milestone'}
                        >
                          <Star size={15} fill={task.is_starred ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        {task.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)' }}>
                        <span>Due: {task.due_date || task.scheduled_date || 'No Date'}</span>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {task.is_timer_allowed && (
                            <button
                              className={`btn ${task.is_timer_running ? 'btn-danger' : 'btn-secondary'}`}
                              style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTimerAction(task);
                              }}
                              title="Task Focus Timer"
                            >
                              {task.is_timer_running ? <Square size={10} /> : <Play size={10} fill="currentColor" />} Timer
                            </button>
                          )}

                          <button
                            className="btn btn-success"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleItem(task);
                            }}
                            title="Mark Completed"
                          >
                            <CheckCircle2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
