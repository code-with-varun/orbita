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

  // Routine Specific (Recurrence Edit State)
  const [editRecurrenceType, setEditRecurrenceType] = useState('Monthly');
  const [editRecurrenceInterval, setEditRecurrenceInterval] = useState(1);
  const [editDailyOption, setEditDailyOption] = useState('every_day');
  const [editWeeklyDays, setEditWeeklyDays] = useState(['Mon']);
  const [editMonthlyMode, setEditMonthlyMode] = useState('day_of_month');
  const [editMonthlyDay, setEditMonthlyDay] = useState('1');
  const [editMonthlyOrdinalPos, setEditMonthlyOrdinalPos] = useState('1');
  const [editMonthlyOrdinalDay, setEditMonthlyOrdinalDay] = useState('mon');
  const [editYearlyMonth, setEditYearlyMonth] = useState(1);
  const [editYearlyDay, setEditYearlyDay] = useState(1);

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

        if (data.orbita_type === 'Routine') {
          const recT = data.recurrence_type || 'Monthly';
          setEditRecurrenceType(recT);
          setEditRecurrenceInterval(data.recurrence_interval || 1);
          const rDay = (data.recurrence_day || '').trim();

          if (recT === 'Daily') {
            if (rDay === 'weekdays') setEditDailyOption('weekdays');
            else if (rDay === 'weekends') setEditDailyOption('weekends');
            else if (data.recurrence_interval > 1) setEditDailyOption('every_n_days');
            else setEditDailyOption('every_day');
          } else if (recT === 'Weekly') {
            if (rDay) {
              setEditWeeklyDays(rDay.split(',').map((s) => s.trim()));
            } else {
              setEditWeeklyDays(['Mon']);
            }
          } else if (recT === 'Monthly') {
            if (rDay.startsWith('ordinal_')) {
              setEditMonthlyMode('ordinal');
              const p = rDay.split('_');
              setEditMonthlyOrdinalPos(p[1] || '1');
              setEditMonthlyOrdinalDay(p[2] || 'mon');
            } else {
              setEditMonthlyMode('day_of_month');
              setEditMonthlyDay(rDay || '1');
            }
          } else if (recT === 'Yearly') {
            if (rDay.includes('-')) {
              const p = rDay.split('-');
              setEditYearlyMonth(parseInt(p[0], 10) || 1);
              setEditYearlyDay(parseInt(p[1], 10) || 1);
            }
          }
        }

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

    let finalRecurrenceDay = null;
    let finalRecurrenceInterval = parseInt(editRecurrenceInterval) || 1;

    if (task.orbita_type === 'Routine') {
      if (editRecurrenceType === 'Daily') {
        if (editDailyOption === 'weekdays') finalRecurrenceDay = 'weekdays';
        else if (editDailyOption === 'weekends') finalRecurrenceDay = 'weekends';
        else if (editDailyOption === 'every_n_days') {
          finalRecurrenceDay = '';
          finalRecurrenceInterval = Math.max(1, parseInt(editRecurrenceInterval) || 1);
        } else {
          finalRecurrenceDay = '';
          finalRecurrenceInterval = 1;
        }
      } else if (editRecurrenceType === 'Weekly') {
        finalRecurrenceDay = editWeeklyDays.length > 0 ? editWeeklyDays.join(', ') : 'Mon';
        finalRecurrenceInterval = Math.max(1, parseInt(editRecurrenceInterval) || 1);
      } else if (editRecurrenceType === 'Monthly') {
        if (editMonthlyMode === 'ordinal') {
          finalRecurrenceDay = `ordinal_${editMonthlyOrdinalPos}_${editMonthlyOrdinalDay}`;
        } else {
          finalRecurrenceDay = editMonthlyDay;
        }
        finalRecurrenceInterval = Math.max(1, parseInt(editRecurrenceInterval) || 1);
      } else if (editRecurrenceType === 'Yearly') {
        finalRecurrenceDay = `${String(editYearlyMonth).padStart(2, '0')}-${String(editYearlyDay).padStart(2, '0')}`;
        finalRecurrenceInterval = Math.max(1, parseInt(editRecurrenceInterval) || 1);
      }
    }

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
        recurrence_type: task.orbita_type === 'Routine' ? editRecurrenceType : null,
        recurrence_interval: task.orbita_type === 'Routine' ? finalRecurrenceInterval : null,
        recurrence_day: task.orbita_type === 'Routine' ? finalRecurrenceDay : null,
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
                <label className="form-label">Priority (Eisenhower Quadrant)</label>
                <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                  <option value="Critical">Critical (Q1: Do Now)</option>
                  <option value="High">High (Q2: Plan & Schedule)</option>
                  <option value="Medium">Medium (Q3: Quick Action)</option>
                  <option value="Low">Low (Q4: Optional)</option>
                </select>
              </div>

              {task.orbita_type !== 'Routine' && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <input type="text" className="form-input" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} />
            </div>

            {task.orbita_type !== 'Routine' && (
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
            )}

            {task.orbita_type === 'Routine' && (
              <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                    <Repeat size={16} color="var(--accent-purple)" /> Recurrence Frequency & Rules
                  </label>
                  <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent-purple)', fontSize: '0.7rem' }}>
                    Auto-Creates 2 Days Ahead
                  </span>
                </div>

                {/* Frequency Selector Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`btn ${editRecurrenceType === f ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem',
                        fontSize: '0.8rem',
                        justifyContent: 'center',
                        background: editRecurrenceType === f ? 'var(--accent-purple)' : undefined
                      }}
                      onClick={() => setEditRecurrenceType(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Dynamic Sub-Options */}
                {/* DAILY OPTIONS */}
                {editRecurrenceType === 'Daily' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={`btn ${editDailyOption === 'every_day' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                        onClick={() => setEditDailyOption('every_day')}
                      >
                        Every Day
                      </button>
                      <button
                        type="button"
                        className={`btn ${editDailyOption === 'weekdays' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                        onClick={() => setEditDailyOption('weekdays')}
                      >
                        Weekdays (Mon - Fri)
                      </button>
                      <button
                        type="button"
                        className={`btn ${editDailyOption === 'weekends' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                        onClick={() => setEditDailyOption('weekends')}
                      >
                        Weekends (Sat - Sun)
                      </button>
                      <button
                        type="button"
                        className={`btn ${editDailyOption === 'every_n_days' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                        onClick={() => setEditDailyOption('every_n_days')}
                      >
                        Custom Interval (N Days)
                      </button>
                    </div>

                    {editDailyOption === 'every_n_days' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repeat every</span>
                        <input
                          type="number"
                          min="2"
                          max="365"
                          className="form-input"
                          style={{ width: '80px', padding: '0.35rem' }}
                          value={editRecurrenceInterval}
                          onChange={(e) => setEditRecurrenceInterval(e.target.value)}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WEEKLY OPTIONS */}
                {editRecurrenceType === 'Weekly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Days of the Week (Multi-select)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Repeat every</span>
                        <select
                          className="select-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          value={editRecurrenceInterval}
                          onChange={(e) => setEditRecurrenceInterval(e.target.value)}
                        >
                          <option value="1">1 week</option>
                          <option value="2">2 weeks (Bi-weekly)</option>
                          <option value="3">3 weeks</option>
                          <option value="4">4 weeks</option>
                        </select>
                      </div>
                    </div>

                    {/* Day Pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const isSelected = editWeeklyDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              padding: '0.35rem 0.2rem',
                              fontSize: '0.75rem',
                              justifyContent: 'center',
                              fontWeight: isSelected ? '800' : '500'
                            }}
                            onClick={() => {
                              if (isSelected) {
                                if (editWeeklyDays.length > 1) {
                                  setEditWeeklyDays(editWeeklyDays.filter((d) => d !== day));
                                }
                              } else {
                                setEditWeeklyDays([...editWeeklyDays, day]);
                              }
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MONTHLY OPTIONS */}
                {editRecurrenceType === 'Monthly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className={`btn ${editMonthlyMode === 'day_of_month' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setEditMonthlyMode('day_of_month')}
                        >
                          Specific Day
                        </button>
                        <button
                          type="button"
                          className={`btn ${editMonthlyMode === 'ordinal' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setEditMonthlyMode('ordinal')}
                        >
                          Relative Weekday
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Every</span>
                        <select
                          className="select-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          value={editRecurrenceInterval}
                          onChange={(e) => setEditRecurrenceInterval(e.target.value)}
                        >
                          <option value="1">1 month (Monthly)</option>
                          <option value="2">2 months (Bi-monthly)</option>
                          <option value="3">3 months (Quarterly)</option>
                          <option value="6">6 months (Semi-annually)</option>
                        </select>
                      </div>
                    </div>

                    {editMonthlyMode === 'day_of_month' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Day of Month:</span>
                        <select
                          className="select-input"
                          style={{ flex: 1, padding: '0.35rem 0.6rem' }}
                          value={editMonthlyDay}
                          onChange={(e) => setEditMonthlyDay(e.target.value)}
                        >
                          {Array.from({ length: 31 }).map((_, i) => (
                            <option key={i + 1} value={String(i + 1)}>
                              {i + 1}{i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : i + 1 === 3 ? 'rd' : 'th'} day of month
                            </option>
                          ))}
                          <option value="last">Last Day of Month (e.g. 28th/30th/31st)</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>On the:</span>
                        <select
                          className="select-input"
                          value={editMonthlyOrdinalPos}
                          onChange={(e) => setEditMonthlyOrdinalPos(e.target.value)}
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <option value="1">1st (First)</option>
                          <option value="2">2nd (Second)</option>
                          <option value="3">3rd (Third)</option>
                          <option value="4">4th (Fourth)</option>
                          <option value="last">Last</option>
                        </select>
                        <select
                          className="select-input"
                          value={editMonthlyOrdinalDay}
                          onChange={(e) => setEditMonthlyOrdinalDay(e.target.value)}
                          style={{ flex: 1, padding: '0.35rem 0.5rem' }}
                        >
                          <option value="mon">Monday</option>
                          <option value="tue">Tuesday</option>
                          <option value="wed">Wednesday</option>
                          <option value="thu">Thursday</option>
                          <option value="fri">Friday</option>
                          <option value="sat">Saturday</option>
                          <option value="sun">Sunday</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* YEARLY OPTIONS */}
                {editRecurrenceType === 'Yearly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="form-label" style={{ margin: 0, fontSize: '0.75rem' }}>Annual Schedule</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Repeat every</span>
                        <select
                          className="select-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          value={editRecurrenceInterval}
                          onChange={(e) => setEditRecurrenceInterval(e.target.value)}
                        >
                          <option value="1">1 year</option>
                          <option value="2">2 years</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Month</label>
                        <select
                          className="select-input"
                          style={{ width: '100%', padding: '0.35rem 0.6rem' }}
                          value={editYearlyMonth}
                          onChange={(e) => setEditYearlyMonth(Number(e.target.value))}
                        >
                          {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((m, idx) => (
                            <option key={idx + 1} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Day</label>
                        <select
                          className="select-input"
                          style={{ width: '100%', padding: '0.35rem 0.6rem' }}
                          value={editYearlyDay}
                          onChange={(e) => setEditYearlyDay(Number(e.target.value))}
                        >
                          {Array.from({ length: 31 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {task.orbita_type === 'Goal' && (
              <div className="form-group">
                <label className="form-label">Optional Target Hours (Leave 0 for open focus track)</label>
                <input type="number" step="0.5" className="form-input" value={editTargetHours} onChange={(e) => setEditTargetHours(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
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
