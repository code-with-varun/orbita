import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Star,
  CheckSquare,
  Repeat,
  Target,
  FolderGit2,
  Tag,
  Clock,
  Layers
} from 'lucide-react';

export default function TaskFormModal({ isOpen, onClose, onRefresh, currentUser, defaultScheduledDate }) {
  // 4 Core Types
  const [orbitaType, setOrbitaType] = useState('Task'); // 'Task' | 'Routine' | 'Goal' | 'Project'
  const [workspace, setWorkspace] = useState('Personal'); // 'Personal' | 'Work'

  // Eisenhower Priority Quadrant
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(true);
  const [isStarred, setIsStarred] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [assignee, setAssignee] = useState(currentUser?.name || '');
  const [scheduledDate, setScheduledDate] = useState(defaultScheduledDate || '');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Routine Specific
  const [recurrenceType, setRecurrenceType] = useState('Monthly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDay, setRecurrenceDay] = useState('1');

  // Goal Specific
  const [targetHours, setTargetHours] = useState(20);

  // Project Specific: Stages & Tasks Hierarchy
  const [stages, setStages] = useState([
    {
      title: 'Planning & Setup',
      tasks: [{ title: 'Requirements & Architecture' }, { title: 'Environment Setup' }]
    },
    {
      title: 'Execution & Development',
      tasks: [{ title: 'Core Implementation' }, { title: 'Testing & QA' }]
    }
  ]);

  useEffect(() => {
    if (defaultScheduledDate) {
      setScheduledDate(defaultScheduledDate);
    }
  }, [defaultScheduledDate]);

  useEffect(() => {
    if (currentUser?.name && !assignee) {
      setAssignee(currentUser.name);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const getQuadrant = () => {
    if (isImportant && isUrgent) return 'Q1: Do Now (Critical)';
    if (isImportant && !isUrgent) return 'Q2: Plan & Schedule (High)';
    if (!isImportant && isUrgent) return 'Q3: Quick Action (Medium)';
    return 'Q4: Optional (Low)';
  };

  const getDerivedPriority = () => {
    if (isImportant && isUrgent) return 'Critical';
    if (isImportant && !isUrgent) return 'High';
    if (!isImportant && isUrgent) return 'Medium';
    return 'Low';
  };

  // Stage builder helpers
  const handleAddStage = () => {
    setStages([...stages, { title: `Stage ${stages.length + 1}`, tasks: [{ title: '' }] }]);
  };

  const handleStageTitleChange = (sIdx, value) => {
    const updated = [...stages];
    updated[sIdx].title = value;
    setStages(updated);
  };

  const handleRemoveStage = (sIdx) => {
    setStages(stages.filter((_, i) => i !== sIdx));
  };

  const handleAddTaskToStage = (sIdx) => {
    const updated = [...stages];
    updated[sIdx].tasks.push({ title: '' });
    setStages(updated);
  };

  const handleStageTaskChange = (sIdx, tIdx, value) => {
    const updated = [...stages];
    updated[sIdx].tasks[tIdx].title = value;
    setStages(updated);
  };

  const handleRemoveTaskFromStage = (sIdx, tIdx) => {
    const updated = [...stages];
    updated[sIdx].tasks = updated[sIdx].tasks.filter((_, i) => i !== tIdx);
    setStages(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    const payload = {
      title: title.trim(),
      description,
      tags: tags.trim(),
      orbita_type: orbitaType,
      workspace,
      is_urgent: isUrgent ? 1 : 0,
      is_important: isImportant ? 1 : 0,
      priority: getDerivedPriority(),
      status: 'Active',
      assignee: assignee.trim() || currentUser?.name || 'User',
      created_by: currentUser?.name || 'User',
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || null,
      scheduled_date: scheduledDate || null,
      due_date: dueDate || null,
      recurrence_type: orbitaType === 'Routine' ? recurrenceType : null,
      recurrence_interval: orbitaType === 'Routine' ? parseInt(recurrenceInterval) || 1 : null,
      recurrence_day: orbitaType === 'Routine' ? recurrenceDay : null,
      target_hours: orbitaType === 'Goal' ? parseFloat(targetHours) || 0 : 0,
      estimated_hours: 0,
      is_starred: isStarred ? 1 : 0,
      notes,
      stages: orbitaType === 'Project' ? stages.filter((st) => st.title.trim() !== '') : []
    };

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        onRefresh();
        onClose();
        setTitle('');
        setDescription('');
        setTags('');
        setIsStarred(false);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Create {orbitaType}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Classify, prioritize, and schedule into Orbita</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. 4-Type Selector */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Orbita Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${orbitaType === 'Task' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.2rem' }}
                onClick={() => setOrbitaType('Task')}
              >
                <CheckSquare size={14} /> Task
              </button>
              <button
                type="button"
                className={`btn ${orbitaType === 'Routine' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.2rem' }}
                onClick={() => setOrbitaType('Routine')}
              >
                <Repeat size={14} /> Routine
              </button>
              <button
                type="button"
                className={`btn ${orbitaType === 'Goal' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.2rem' }}
                onClick={() => setOrbitaType('Goal')}
              >
                <Target size={14} /> Goal
              </button>
              <button
                type="button"
                className={`btn ${orbitaType === 'Project' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.2rem' }}
                onClick={() => setOrbitaType('Project')}
              >
                <FolderGit2 size={14} /> Project
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {orbitaType === 'Task' && '• Single-action completion (e.g. Buy groceries, search doc)'}
              {orbitaType === 'Routine' && '• Recurring automatically on schedule (e.g. Weekly meeting, EB bill)'}
              {orbitaType === 'Goal' && '• Ongoing time-tracked focus effort with timer (e.g. Learning JavaScript)'}
              {orbitaType === 'Project' && '• Structured multistep delivery with Stage -> Task hierarchy'}
            </div>
          </div>

          {/* 2. Workspace & Priority Quadrant */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Workspace</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${workspace === 'Personal' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                  onClick={() => setWorkspace('Personal')}
                >
                  Personal
                </button>
                <button
                  type="button"
                  className={`btn ${workspace === 'Work' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                  onClick={() => setWorkspace('Work')}
                >
                  Work
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-hover)', margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '700', fontSize: '0.8rem' }}>
                  Priority Quadrant: <span style={{ color: 'var(--accent-blue)' }}>{getQuadrant()}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', color: isStarred ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                  <input type="checkbox" checked={isStarred} onChange={(e) => setIsStarred(e.target.checked)} />
                  <Star size={12} fill={isStarred ? 'currentColor' : 'none'} />
                  <span>Star</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
                  <span>Important</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
                  <span>Urgent</span>
                </label>
              </div>
            </div>
          </div>

          {/* 3. Title & Tags (Clean full-width layout without duplicate priority input) */}
          <div className="form-group">
            <label className="form-label">{orbitaType} Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder={`e.g. ${orbitaType === 'Task' ? 'Buy groceries' : orbitaType === 'Routine' ? 'Pay electricity bill' : orbitaType === 'Goal' ? 'Learning JavaScript' : 'Building MERN CRM App'}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Tags (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Career, Engineering, Personal, Finance"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* 4. Type Specific Settings */}
          {orbitaType === 'Routine' && (
            <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '0.85rem' }}>
              <label className="form-label" style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
                <Repeat size={14} color="var(--accent-purple)" /> Recurrence Settings
              </label>
              <div className="form-row">
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Frequency</label>
                  <select className="form-select" value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)}>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Repeat Interval</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Day / Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1st or Monday"
                    value={recurrenceDay}
                    onChange={(e) => setRecurrenceDay(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {orbitaType === 'Goal' && (
            <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--accent-amber)', fontWeight: '700', fontSize: '0.85rem' }}>
                <Clock size={16} /> Focus Goal Track
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                This goal is a dedicated focus track. You can start, pause, and log focus stopwatch sessions anytime.
              </p>
            </div>
          )}

          {orbitaType === 'Project' && (
            <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '700' }}>
                  <Layers size={14} color="var(--accent-blue)" /> Project Stages & Stage-Tasks
                </label>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddStage}>
                  <Plus size={12} /> Add Stage
                </button>
              </div>

              {stages.map((st, sIdx) => (
                <div key={sIdx} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>Stage {sIdx + 1}:</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Stage Title (e.g. Backend API)"
                      value={st.title}
                      onChange={(e) => handleStageTitleChange(sIdx, e.target.value)}
                      style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                    />
                    {stages.length > 1 && (
                      <button type="button" className="btn btn-danger" style={{ padding: '0.35rem' }} onClick={() => handleRemoveStage(sIdx)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Tasks inside this Stage */}
                  <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {st.tasks.map((t, tIdx) => (
                      <div key={tIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>•</span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Task title"
                          value={t.title}
                          onChange={(e) => handleStageTaskChange(sIdx, tIdx, e.target.value)}
                          style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        />
                        {st.tasks.length > 1 && (
                          <button type="button" className="btn btn-danger" style={{ padding: '0.25rem' }} onClick={() => handleRemoveTaskFromStage(sIdx, tIdx)}>
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start', padding: '0.15rem 0.45rem', fontSize: '0.7rem', marginTop: '0.2rem' }}
                      onClick={() => handleAddTaskToStage(sIdx)}
                    >
                      <Plus size={10} /> Add Task to Stage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Dates (Hidden for Routine as requested) */}
          {orbitaType !== 'Routine' && (
            <div className="form-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Due Date (Deadline)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create {orbitaType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
