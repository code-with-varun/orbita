import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  CheckCircle2,
  Circle,
  Clock,
  History,
  Trash2,
  Plus,
  Edit3,
  Star,
  CheckSquare,
  Repeat,
  Target,
  FolderGit2,
  Tag,
  Layers
} from 'lucide-react';

export default function TaskDetailModal({
  taskId,
  onClose,
  onRefresh,
  onStartTimer,
  onStopTimer,
  runningTask,
  currentUser
}) {
  const [task, setTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'sessions' | 'logs'
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editWorkspace, setEditWorkspace] = useState('Personal');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Active');
  const [editAssignee, setEditAssignee] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTargetHours, setEditTargetHours] = useState(0);

  const fetchTaskDetails = () => {
    if (!taskId) return;
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setEditTitle(data.title || '');
        setEditDescription(data.description || '');
        setEditTags(data.tags || '');
        setEditWorkspace(data.workspace || 'Personal');
        setEditPriority(data.priority || 'Medium');
        setEditStatus(data.status || 'Active');
        setEditAssignee(data.assignee || '');
        setEditScheduledDate(data.scheduled_date || '');
        setEditDueDate(data.due_date || '');
        setEditTargetHours(data.target_hours || 0);
        if (data.stages?.length > 0) {
          setSelectedStageId(data.stages[0].id);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  if (!taskId || !task) return null;

  const isTimerRunning = runningTask && runningTask.id === task.id;

  const handleToggleStar = () => {
    fetch(`/api/tasks/${task.id}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        fetchTaskDetails();
        onRefresh();
      });
  };

  const handleToggleStageTask = (stageTaskId, currentCompleted) => {
    fetch(`/api/stage-tasks/${stageTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentCompleted, user_name: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        fetchTaskDetails();
        onRefresh();
      });
  };

  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    fetch(`/api/projects/${task.id}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newStageTitle.trim() })
    })
      .then((res) => res.json())
      .then(() => {
        setNewStageTitle('');
        fetchTaskDetails();
        onRefresh();
      });
  };

  const handleAddTaskToStage = (stageId) => {
    if (!newTaskTitle.trim()) return;
    fetch(`/api/stages/${stageId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim(), assignee: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        setNewTaskTitle('');
        fetchTaskDetails();
        onRefresh();
      });
  };

  const handleDeleteStageTask = (taskId) => {
    fetch(`/api/stage-tasks/${taskId}`, { method: 'DELETE' })
      .then(() => {
        fetchTaskDetails();
        onRefresh();
      });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        tags: editTags,
        workspace: editWorkspace,
        priority: editPriority,
        status: editStatus,
        assignee: editAssignee,
        scheduled_date: editScheduledDate || null,
        due_date: editDueDate || null,
        target_hours: parseFloat(editTargetHours) || 0,
        updated_by: currentUser?.name || 'User'
      })
    })
      .then((res) => res.json())
      .then(() => {
        fetchTaskDetails();
        onRefresh();
        setActiveTab('overview');
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: '800',
                fontSize: '0.95rem',
                color: 'var(--accent-blue)',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px'
              }}
            >
              {task.ticket_key}
            </span>

            <button
              onClick={handleToggleStar}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)',
                padding: 0
              }}
              title={task.is_starred ? 'Starred milestone' : 'Mark as milestone'}
            >
              <Star size={18} fill={task.is_starred ? 'currentColor' : 'none'} />
            </button>

            <span className="badge badge-status">
              {task.orbita_type} • {task.workspace}
            </span>

            <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
              {task.priority}
            </span>

            <span className="badge badge-status">
              {task.priority_quadrant || 'Q2'}
            </span>
          </div>

          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('overview')}
          >
            Overview {task.orbita_type === 'Project' ? '& Stages' : ''}
          </button>
          <button
            className={`btn ${activeTab === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('edit')}
          >
            <Edit3 size={12} /> Edit Item
          </button>
          {task.is_timer_allowed ? (
            <button
              className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('sessions')}
            >
              <Clock size={12} /> Focus Sessions ({task.sessions?.length || 0})
            </button>
          ) : null}
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setActiveTab('logs')}
          >
            <History size={12} /> Timeline ({task.logs?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {task.title}
            </h3>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <div>Workspace: <strong style={{ color: 'var(--text-main)' }}>{task.workspace}</strong></div>
              <div>Assignee: <strong style={{ color: 'var(--text-main)' }}>{task.assignee}</strong></div>
              <div>Scheduled: <strong style={{ color: 'var(--text-main)' }}>{task.scheduled_date || '-'}</strong></div>
              <div>Due Date: <strong style={{ color: 'var(--text-main)' }}>{task.due_date || '-'}</strong></div>
              {task.recurrence_type && <div>Repeats: <strong style={{ color: 'var(--accent-purple)' }}>{task.recurrence_type} ({task.recurrence_day || 'Interval: ' + task.recurrence_interval})</strong></div>}
              {task.completed_at && <div>Completed: <strong style={{ color: 'var(--accent-green)' }}>{task.completed_at.substring(0, 10)}</strong></div>}
              {task.tags && <div>Tags: <span className="badge badge-status">{task.tags}</span></div>}
            </div>

            {task.description && (
              <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '0.85rem', fontSize: '0.85rem' }}>
                <p>{task.description}</p>
              </div>
            )}

            {/* Goal Focus Progress */}
            {task.orbita_type === 'Goal' && (
              <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Goal Focus Hours Progress</span>
                  <span style={{ fontWeight: '800', color: 'var(--accent-amber)' }}>
                    {task.actual_hours || 0}h / {task.target_hours || 0}h Target ({task.target_hours > 0 ? Math.min(100, Math.round(((task.actual_hours || 0) / task.target_hours) * 100)) : 0}%)
                  </span>
                </div>
                <div className="mini-progress-bar-container">
                  <div
                    className="mini-progress-bar-fill"
                    style={{
                      width: `${task.target_hours > 0 ? Math.min(100, ((task.actual_hours || 0) / task.target_hours) * 100) : 0}%`,
                      background: 'var(--accent-amber)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Project Stages & Stage-Tasks Hierarchy */}
            {task.orbita_type === 'Project' && (
              <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={16} color="var(--accent-blue)" /> Project Stages & Stage-Tasks
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {task.stages && task.stages.map((st, sIdx) => {
                    const doneCount = st.tasks?.filter((t) => t.is_completed).length || 0;
                    const totalCount = st.tasks?.length || 0;
                    const isStageDone = Boolean(st.is_completed);

                    return (
                      <div key={st.id} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: isStageDone ? 'var(--accent-green)' : 'var(--text-main)' }}>
                            Stage {sIdx + 1}: {st.title} {isStageDone ? '✓ (Completed)' : `(${doneCount}/${totalCount})`}
                          </span>
                        </div>

                        {/* Stage Tasks Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1rem' }}>
                          {st.tasks?.map((t) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(t.is_completed)}
                                  onChange={() => handleToggleStageTask(t.id, t.is_completed)}
                                />
                                <span style={{ fontSize: '0.85rem', textDecoration: t.is_completed ? 'line-through' : 'none', color: t.is_completed ? 'var(--text-dim)' : 'var(--text-main)' }}>
                                  {t.title}
                                </span>
                              </label>
                              <button
                                onClick={() => handleDeleteStageTask(t.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.15rem' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}

                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Add task to this stage..."
                              value={selectedStageId === st.id ? newTaskTitle : ''}
                              onChange={(e) => {
                                setSelectedStageId(st.id);
                                setNewTaskTitle(e.target.value);
                              }}
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            />
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleAddTaskToStage(st.id)}
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Stage */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Stage Title (e.g. Deployment & Launch)..."
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                  />
                  <button className="btn btn-secondary" onClick={handleAddStage} style={{ fontSize: '0.8rem' }}>
                    <Plus size={14} /> Add Stage
                  </button>
                </div>
              </div>
            )}

            {/* Timer Actions for Goal & Project */}
            {task.is_timer_allowed ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Total Focus Logged: <strong style={{ color: 'var(--accent-blue)' }}>{task.actual_hours || 0}h</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {isTimerRunning ? (
                    <button className="btn btn-danger" onClick={() => onStopTimer(task.id)}>
                      <Square size={14} /> Stop Focus Timer
                    </button>
                  ) : (
                    task.status !== 'Completed' ? (
                      <button className="btn btn-primary" onClick={() => onStartTimer(task.id)}>
                        <Play size={14} /> Start Focus Timer
                      </button>
                    ) : null
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: Edit Item */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows="3" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <input type="text" className="form-input" value={editTags} onChange={(e) => setEditTags(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Workspace</label>
                <select className="form-select" value={editWorkspace} onChange={(e) => setEditWorkspace(e.target.value)}>
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <input type="text" className="form-input" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input type="date" className="form-input" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
            </div>

            {task.orbita_type === 'Goal' && (
              <div className="form-group">
                <label className="form-label">Target Focus Hours</label>
                <input type="number" step="0.5" className="form-input" value={editTargetHours} onChange={(e) => setEditTargetHours(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('overview')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Work Sessions */}
        {activeTab === 'sessions' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {task.sessions?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No focus sessions logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {task.sessions?.map((s) => (
                  <div key={s.id} className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.notes || 'Focus Session'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        By {s.user_name} • {s.start_time} to {s.end_time || 'Running'}
                      </div>
                    </div>
                    <span className="badge badge-priority-medium">
                      {Math.round((s.duration_seconds / 3600) * 100) / 100} hrs ({Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'logs' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {task.logs?.map((l) => (
              <div key={l.id} style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-card-hover)', borderRadius: '4px', borderLeft: '3px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>{l.action}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{l.created_at}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {l.details} — <em>{l.user_name}</em>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
