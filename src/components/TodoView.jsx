import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Square,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Repeat,
  Target,
  FolderGit2,
  Clock,
  CheckSquare,
  Layers
} from 'lucide-react';
import { CardSkeleton } from './SkeletonLoader';

export default function TodoView({
  tasks = [],
  loading = false,
  onUpdateTaskStatus,
  onSelectTask,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onToggleStar,
  onRefresh,
  runningTask,
  title = "Tasks & Work Items",
  description = "Execution overview across your work items",
  typeFilterDefault = ""
}) {
  const [expandedTasks, setExpandedTasks] = useState({});
  const [filterQuadrant, setFilterQuadrant] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');

  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => {
      const current = prev[taskId] !== undefined ? prev[taskId] : (typeFilterDefault === 'Project');
      return {
        ...prev,
        [taskId]: !current
      };
    });
  };

  const handleToggleStageTask = (projectId, stageId, taskId, currentCompleted) => {
    fetch(`/api/projects/${projectId}/stages/${stageId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentCompleted })
    })
      .then((res) => res.json())
      .then(() => onRefresh())
      .catch((err) => console.error(err));
  };

  const handleStartStageTaskTimer = (projectId, stageId, taskId) => {
    fetch(`/api/projects/${projectId}/stages/${stageId}/tasks/${taskId}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: 'User' })
    })
      .then((res) => res.json())
      .then(() => onRefresh())
      .catch((err) => console.error(err));
  };

  const handlePauseStageTaskTimer = (projectId, stageId, taskId) => {
    fetch(`/api/projects/${projectId}/stages/${stageId}/tasks/${taskId}/timer/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: 'User' })
    })
      .then((res) => res.json())
      .then(() => onRefresh())
      .catch((err) => console.error(err));
  };

  const handleResumeStageTaskTimer = (projectId, stageId, taskId) => {
    fetch(`/api/projects/${projectId}/stages/${stageId}/tasks/${taskId}/timer/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: 'User' })
    })
      .then((res) => res.json())
      .then(() => onRefresh())
      .catch((err) => console.error(err));
  };

  const handleStopStageTaskTimer = (projectId, stageId, taskId) => {
    fetch(`/api/projects/${projectId}/stages/${stageId}/tasks/${taskId}/timer/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: 'User' })
    })
      .then((res) => res.json())
      .then(() => onRefresh())
      .catch((err) => console.error(err));
  };

  const filteredTasks = tasks.filter((t) => {
    if (typeFilterDefault && t.orbita_type !== typeFilterDefault) return false;
    if (filterWorkspace && t.workspace !== filterWorkspace) return false;
    if (filterQuadrant && t.priority_quadrant !== filterQuadrant) return false;
    return true;
  });

  const getTypeIcon = (type) => {
    if (type === 'Routine') return <Repeat size={13} color="var(--accent-purple)" />;
    if (type === 'Goal') return <Target size={13} color="var(--accent-amber)" />;
    if (type === 'Project') return <FolderGit2 size={13} color="var(--accent-blue)" />;
    return <CheckSquare size={13} color="var(--accent-green)" />;
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="select-input" value={filterWorkspace} onChange={(e) => setFilterWorkspace(e.target.value)}>
            <option value="">All Workspaces</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>

          <select className="select-input" value={filterQuadrant} onChange={(e) => setFilterQuadrant(e.target.value)}>
            <option value="">All Quadrants</option>
            <option value="Q1">Q1: Do Now</option>
            <option value="Q2">Q2: Plan & Schedule</option>
            <option value="Q3">Q3: Quick Action</option>
            <option value="Q4">Q4: Optional</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          No {typeFilterDefault || 'work'} items found. Create your first item from <strong>+ New Item</strong>!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredTasks.map((task) => {
            const isDone = task.status === 'Completed';
            const isProject = task.orbita_type === 'Project';
            const isExpanded = expandedTasks[task.id] !== undefined
              ? expandedTasks[task.id]
              : (isProject && typeFilterDefault === 'Project');
            const hasStages = task.stages && task.stages.length > 0;

            const isGoalRunning = runningTask && runningTask.id === task.id && !runningTask.is_timer_paused;
            const isGoalPaused = runningTask && runningTask.id === task.id && runningTask.is_timer_paused;

            return (
              <div
                key={task.id}
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${isProject ? 'var(--accent-blue)' : task.orbita_type === 'Goal' ? 'var(--accent-amber)' : task.orbita_type === 'Routine' ? 'var(--accent-purple)' : 'var(--accent-green)'}`,
                  padding: '1rem',
                  opacity: isDone && !isProject ? 0.65 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                    {/* Left Icon: If Project -> Collapse / Expand Stages; Else -> 1-Click Complete Toggle */}
                    {isProject ? (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.4rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-blue)'
                        }}
                        title={isExpanded ? 'Collapse Stages' : 'Expand Stages'}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, isDone ? 'Active' : 'Completed')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDone ? 'var(--accent-green)' : 'var(--text-dim)' }}
                        title={isDone ? 'Mark as Active' : 'Mark as Completed'}
                      >
                        {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                          {task.ticket_key}
                        </span>

                        <h4
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            textDecoration: isDone && !isProject ? 'line-through' : 'none'
                          }}
                        >
                          {task.title}
                        </h4>

                        <span className="badge badge-status" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem' }}>
                          {getTypeIcon(task.orbita_type)} {task.orbita_type}
                        </span>

                        <span className="badge badge-status" style={{ fontSize: '0.65rem' }}>
                          {task.workspace}
                        </span>

                        <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                          {task.priority}
                        </span>

                        <span className="badge badge-status" style={{ fontSize: '0.65rem' }}>
                          {task.priority_quadrant || 'Q2'}
                        </span>

                        {/* If Project: Show Status as Badge */}
                        {isProject && (
                          <span className={`badge ${isDone ? 'badge-success' : 'badge-priority-medium'}`} style={{ fontSize: '0.65rem' }}>
                            {task.status}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Assignee: <strong style={{ color: 'var(--text-main)' }}>{task.assignee}</strong></span>
                        <span>Due: <strong style={{ color: 'var(--text-main)' }}>{task.due_date || task.scheduled_date || 'No Date'}</strong></span>

                        {task.orbita_type === 'Routine' && task.recurrence_type && (
                          <span>Repeats: <strong style={{ color: 'var(--accent-purple)' }}>{task.recurrence_type} ({task.recurrence_day || 'Interval: ' + task.recurrence_interval})</strong></span>
                        )}

                        {task.orbita_type === 'Goal' && (
                          <span>Focus: <strong style={{ color: 'var(--accent-amber)' }}>{task.actual_hours || 0}h / {task.target_hours || 0}h target</strong></span>
                        )}

                        {isProject && (
                          <span>Stages Progress: <strong style={{ color: 'var(--accent-blue)' }}>{task.completed_tasks || 0}/{task.total_tasks || 0} tasks done ({task.progress_percentage || 0}%)</strong></span>
                        )}

                        {task.tags && <span>Tags: <strong style={{ color: 'var(--accent-blue)' }}>{task.tags}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Star Toggle */}
                    <button
                      onClick={() => onToggleStar(task.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)', padding: '0.3rem' }}
                      title={task.is_starred ? 'Starred milestone' : 'Mark as milestone'}
                    >
                      <Star size={18} fill={task.is_starred ? 'currentColor' : 'none'} />
                    </button>

                    {/* Focus Timer on Goal */}
                    {task.orbita_type === 'Goal' && !isDone && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {isGoalRunning ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-amber)' }}
                              onClick={() => onPauseTimer && onPauseTimer(task.id)}
                              title="Pause Focus Timer"
                            >
                              <Pause size={12} /> Pause
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => onStopTimer && onStopTimer(task.id)}
                              title="Stop Focus Timer"
                            >
                              <Square size={12} /> Stop
                            </button>
                          </>
                        ) : isGoalPaused ? (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-green)' }}
                              onClick={() => onResumeTimer && onResumeTimer(task.id)}
                              title="Resume Focus Timer"
                            >
                              <Play size={12} fill="currentColor" /> Resume
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => onStopTimer && onStopTimer(task.id)}
                              title="Stop Focus Timer"
                            >
                              <Square size={12} /> Stop
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => onStartTimer(task.id)}
                            title="Start Focus Timer"
                          >
                            <Play size={12} fill="currentColor" /> Timer
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expand/Collapse Stages Toggle Button for Projects */}
                    {isProject && hasStages && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => toggleExpand(task.id)}
                      >
                        <Layers size={13} /> {isExpanded ? 'Collapse' : 'Expand'} ({task.stages.length})
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => onSelectTask(task.id)}
                      title="View Details"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Project Stages & Task-Level Timer Dropdown */}
                {isExpanded && isProject && hasStages && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {task.stages.map((st, sIdx) => (
                        <div key={st.id || sIdx} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: st.is_completed ? 'var(--accent-green)' : 'var(--text-main)' }}>
                              Stage {sIdx + 1}: {st.title} {st.is_completed ? '✓ (Completed)' : `(${st.completed_tasks || 0}/${st.total_tasks || 0})`}
                            </div>
                          </div>

                          {/* Individual Tasks inside Stage */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingLeft: '0.5rem' }}>
                            {st.tasks?.map((t) => {
                              const isTaskRunning = Boolean(t.is_timer_running);
                              const isTaskPaused = Boolean(t.is_timer_paused);
                              const tDone = Boolean(t.is_completed);

                              return (
                                <div
                                  key={t._id || t.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.35rem 0.5rem',
                                    background: 'var(--bg-card)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)'
                                  }}
                                >
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                                    <input
                                      type="checkbox"
                                      checked={tDone}
                                      onChange={() => handleToggleStageTask(task.id, st.id || st._id, t._id || t.id, tDone)}
                                    />
                                    <span style={{ fontSize: '0.82rem', fontWeight: '500', textDecoration: tDone ? 'line-through' : 'none', color: tDone ? 'var(--text-dim)' : 'var(--text-main)' }}>
                                      {t.ticket_key ? `[${t.ticket_key}] ` : ''}{t.title}
                                    </span>
                                  </label>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {t.actual_hours > 0 && (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: '600' }}>
                                        {t.actual_hours}h
                                      </span>
                                    )}

                                    {/* Task-Level Focus Timer Buttons */}
                                    {!tDone && (
                                      isTaskRunning ? (
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', color: 'var(--accent-amber)' }}
                                            onClick={() => handlePauseStageTaskTimer(task.id, st.id || st._id, t._id || t.id)}
                                            title="Pause Task Timer"
                                          >
                                            <Pause size={10} /> Pause
                                          </button>
                                          <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                            onClick={() => handleStopStageTaskTimer(task.id, st.id || st._id, t._id || t.id)}
                                            title="Stop Task Timer"
                                          >
                                            <Square size={10} /> Stop
                                          </button>
                                        </div>
                                      ) : isTaskPaused ? (
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                          <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', color: 'var(--accent-green)' }}
                                            onClick={() => handleResumeStageTaskTimer(task.id, st.id || st._id, t._id || t.id)}
                                            title="Resume Task Timer"
                                          >
                                            <Play size={10} fill="currentColor" /> Resume
                                          </button>
                                          <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                            onClick={() => handleStopStageTaskTimer(task.id, st.id || st._id, t._id || t.id)}
                                            title="Stop Task Timer"
                                          >
                                            <Square size={10} /> Stop
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          className="btn btn-secondary"
                                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                                          onClick={() => handleStartStageTaskTimer(task.id, st.id || st._id, t._id || t.id)}
                                          title="Start Task Focus Timer"
                                        >
                                          <Play size={10} fill="currentColor" /> Timer
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
