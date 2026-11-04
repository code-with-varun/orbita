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

  // Routine Specific (Enhanced Recurrence State)
  const [recurrenceType, setRecurrenceType] = useState('Monthly'); // 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [dailyOption, setDailyOption] = useState('every_day'); // 'every_day' | 'weekdays' | 'weekends' | 'every_n_days'
  const [weeklyDays, setWeeklyDays] = useState(['Mon']);
  const [monthlyMode, setMonthlyMode] = useState('day_of_month'); // 'day_of_month' | 'ordinal'
  const [monthlyDay, setMonthlyDay] = useState('1'); // '1'..'31' | 'last'
  const [monthlyOrdinalPos, setMonthlyOrdinalPos] = useState('1'); // '1' | '2' | '3' | '4' | 'last'
  const [monthlyOrdinalDay, setMonthlyOrdinalDay] = useState('mon'); // 'mon'..'sun'
  const [yearlyMonth, setYearlyMonth] = useState(1); // 1..12
  const [yearlyDay, setYearlyDay] = useState(1); // 1..31

  // Goal Specific
  const [targetHours, setTargetHours] = useState(0);

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

    let finalRecurrenceDay = null;
    let finalRecurrenceInterval = parseInt(recurrenceInterval) || 1;

    if (orbitaType === 'Routine') {
      if (recurrenceType === 'Yearly') {
        finalRecurrenceDay = `${String(yearlyMonth).padStart(2, '0')}-${String(yearlyDay).padStart(2, '0')}`;
        finalRecurrenceInterval = Math.max(1, parseInt(recurrenceInterval) || 1);
      } else if (recurrenceType === 'Monthly') {
        finalRecurrenceDay = monthlyDay;
        finalRecurrenceInterval = Math.max(1, parseInt(recurrenceInterval) || 1);
      } else if (recurrenceType === 'Weekly') {
        finalRecurrenceDay = weeklyDays.length > 0 ? weeklyDays.join(', ') : 'Mon';
        finalRecurrenceInterval = Math.max(1, parseInt(recurrenceInterval) || 1);
      } else if (recurrenceType === 'MonthDay') {
        finalRecurrenceDay = `ordinal_${monthlyOrdinalPos}_${monthlyOrdinalDay}`;
        finalRecurrenceInterval = Math.max(1, parseInt(recurrenceInterval) || 1);
      } else if (recurrenceType === 'Daily') {
        if (dailyOption === 'weekdays') finalRecurrenceDay = 'weekdays';
        else if (dailyOption === 'weekends') finalRecurrenceDay = 'weekends';
        else if (dailyOption === 'every_n_days') {
          finalRecurrenceDay = '';
          finalRecurrenceInterval = Math.max(1, parseInt(recurrenceInterval) || 1);
        } else {
          finalRecurrenceDay = '';
          finalRecurrenceInterval = 1;
        }
      }
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
      recurrence_type: orbitaType === 'Routine' ? (recurrenceType === 'MonthDay' ? 'Monthly' : recurrenceType) : null,
      recurrence_interval: orbitaType === 'Routine' ? finalRecurrenceInterval : null,
      recurrence_day: orbitaType === 'Routine' ? finalRecurrenceDay : null,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${orbitaType === 'Task' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.5rem', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}
              onClick={() => setOrbitaType('Task')}
            >
              <CheckSquare size={18} color="var(--accent-green)" />
              <span>Task</span>
            </button>

            <button
              type="button"
              className={`btn ${orbitaType === 'Routine' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.5rem', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}
              onClick={() => setOrbitaType('Routine')}
            >
              <Repeat size={18} color="var(--accent-purple)" />
              <span>Routine</span>
            </button>

            <button
              type="button"
              className={`btn ${orbitaType === 'Goal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.5rem', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}
              onClick={() => setOrbitaType('Goal')}
            >
              <Target size={18} color="var(--accent-amber)" />
              <span>Goal</span>
            </button>

            <button
              type="button"
              className={`btn ${orbitaType === 'Project' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.5rem', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}
              onClick={() => setOrbitaType('Project')}
            >
              <FolderGit2 size={18} color="var(--accent-blue)" />
              <span>Project</span>
            </button>
          </div>

          {/* 2. Workspace & Eisenhower Priority Quadrant */}
          <div className="form-row" style={{ marginBottom: '1.25rem' }}>
            <div>
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

          {/* 3. Title & Tags */}
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

          {/* 4. Type Specific Settings: Enhanced Recurrence */}
          {orbitaType === 'Routine' && (
            <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                  <Repeat size={16} color="var(--accent-purple)" /> Recurrence Frequency & Rules
                </label>
                <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent-purple)', fontSize: '0.7rem' }}>
                  Auto-Creates 2 Days Ahead
                </span>
              </div>

              {/* Frequency Selector Pills - 5 Explicit Modes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', marginBottom: '1rem' }}>
                {[
                  { id: 'Yearly', label: '1. Yearly' },
                  { id: 'Monthly', label: '2. Monthly' },
                  { id: 'Weekly', label: '3. Weekly' },
                  { id: 'MonthDay', label: '4. Month + Day' },
                  { id: 'Daily', label: '5. Daily (Opt)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn ${recurrenceType === item.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '0.45rem 0.2rem',
                      fontSize: '0.76rem',
                      justifyContent: 'center',
                      fontWeight: recurrenceType === item.id ? '700' : '500',
                      background: recurrenceType === item.id ? 'var(--accent-purple)' : undefined
                    }}
                    onClick={() => setRecurrenceType(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Sub-Options for the 5 Modes */}

              {/* 1. YEARLY RECURRENCE */}
              {recurrenceType === 'Yearly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>
                      Yearly Specific Date (Month & Day)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Repeat every</span>
                      <select
                        className="select-input"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                      >
                        <option value="1">1 year (Annual)</option>
                        <option value="2">2 years</option>
                        <option value="3">3 years</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Month</label>
                      <select
                        className="select-input"
                        style={{ width: '100%', padding: '0.4rem 0.6rem' }}
                        value={yearlyMonth}
                        onChange={(e) => setYearlyMonth(Number(e.target.value))}
                      >
                        {[
                          'January (01)', 'February (02)', 'March (03)', 'April (04)', 'May (05)', 'June (06)',
                          'July (07)', 'August (08)', 'September (09)', 'October (10)', 'November (11)', 'December (12)'
                        ].map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Specific Date / Day</label>
                      <select
                        className="select-input"
                        style={{ width: '100%', padding: '0.4rem 0.6rem' }}
                        value={yearlyDay}
                        onChange={(e) => setYearlyDay(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}{i + 1 === 1 || i + 1 === 21 || i + 1 === 31 ? 'st' : i + 1 === 2 || i + 1 === 22 ? 'nd' : i + 1 === 3 || i + 1 === 23 ? 'rd' : 'th'} of month
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(124, 58, 237, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124, 58, 237, 0.2)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    📅 <strong>Annual Schedule:</strong> Occurs every year on <strong>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][yearlyMonth - 1]} {yearlyDay}</strong>. The task is created automatically <strong>2 days ahead</strong>. Shorter months automatically clamp to their last valid day (e.g. Feb 28/29).
                  </div>
                </div>
              )}

              {/* 2. MONTHLY RECURRENCE */}
              {recurrenceType === 'Monthly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>
                      Nth Day of Every Month
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Repeat every</span>
                      <select
                        className="select-input"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                      >
                        <option value="1">1 month (Monthly)</option>
                        <option value="2">2 months (Bi-monthly)</option>
                        <option value="3">3 months (Quarterly)</option>
                        <option value="6">6 months (Semi-annually)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Occurs on:</span>
                    <select
                      className="select-input"
                      style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(e.target.value)}
                    >
                      {Array.from({ length: 31 }).map((_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          {i + 1}{i + 1 === 1 || i + 1 === 21 || i + 1 === 31 ? 'st' : i + 1 === 2 || i + 1 === 22 ? 'nd' : i + 1 === 3 || i + 1 === 23 ? 'rd' : 'th'} day of month
                        </option>
                      ))}
                      <option value="last">Last Day of Month (28th / 29th / 30th / 31st)</option>
                    </select>
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    🗓️ <strong>Monthly Logic:</strong> Set to day <strong>{monthlyDay === 'last' ? 'Last Day' : `${monthlyDay}th`}</strong> of every month. If the 31st is selected, Orbita automatically clamps to the 28th/29th in February or 30th in 30-day months. Auto-created <strong>2 days ahead</strong>.
                  </div>
                </div>
              )}

              {/* 3. WEEKLY RECURRENCE */}
              {recurrenceType === 'Weekly' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>
                      Day of the Week (0 = Sun, 1 = Mon ... 6 = Sat)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Repeat every</span>
                      <select
                        className="select-input"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                      >
                        <option value="1">1 week</option>
                        <option value="2">2 weeks (Bi-weekly)</option>
                        <option value="3">3 weeks</option>
                        <option value="4">4 weeks</option>
                      </select>
                    </div>
                  </div>

                  {/* Day Pills with full name & index */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
                    {[
                      { key: 'Sun', num: '0', label: 'Sun (0)' },
                      { key: 'Mon', num: '1', label: 'Mon (1)' },
                      { key: 'Tue', num: '2', label: 'Tue (2)' },
                      { key: 'Wed', num: '3', label: 'Wed (3)' },
                      { key: 'Thu', num: '4', label: 'Thu (4)' },
                      { key: 'Fri', num: '5', label: 'Fri (5)' },
                      { key: 'Sat', num: '6', label: 'Sat (6)' }
                    ].map((d) => {
                      const isSelected = weeklyDays.includes(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.45rem 0.15rem',
                            fontSize: '0.72rem',
                            flexDirection: 'column',
                            gap: '0.1rem',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontWeight: isSelected ? '800' : '500',
                            background: isSelected ? 'var(--accent-purple)' : undefined
                          }}
                          onClick={() => {
                            if (isSelected) {
                              if (weeklyDays.length > 1) {
                                setWeeklyDays(weeklyDays.filter((x) => x !== d.key));
                              }
                            } else {
                              setWeeklyDays([...weeklyDays, d.key]);
                            }
                          }}
                        >
                          <span>{d.key}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>[{d.num}]</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    📆 <strong>Weekly Cycle:</strong> Occurs on <strong>{weeklyDays.join(', ')}</strong> every {recurrenceInterval === '1' || recurrenceInterval === 1 ? 'week' : `${recurrenceInterval} weeks`}. Auto-creates <strong>2 days ahead</strong>.
                  </div>
                </div>
              )}

              {/* 4. MONTH + DAY (ORDINAL) */}
              {recurrenceType === 'MonthDay' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>
                      Month + Day Relative Cycle (e.g. 1st Saturday, Last Sunday)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Repeat every</span>
                      <select
                        className="select-input"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                      >
                        <option value="1">1 month (Monthly)</option>
                        <option value="2">2 months (Bi-monthly)</option>
                        <option value="3">3 months (Quarterly)</option>
                        <option value="6">6 months (Semi-annually)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Occurrence in Month</label>
                      <select
                        className="select-input"
                        value={monthlyOrdinalPos}
                        onChange={(e) => setMonthlyOrdinalPos(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.6rem' }}
                      >
                        <option value="1">1st (First)</option>
                        <option value="2">2nd (Second)</option>
                        <option value="3">3rd (Third)</option>
                        <option value="4">4th (Fourth)</option>
                        <option value="last">Last</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Weekday</label>
                      <select
                        className="select-input"
                        value={monthlyOrdinalDay}
                        onChange={(e) => setMonthlyOrdinalDay(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.6rem' }}
                      >
                        <option value="sun">Sunday (0)</option>
                        <option value="mon">Monday (1)</option>
                        <option value="tue">Tuesday (2)</option>
                        <option value="wed">Wednesday (3)</option>
                        <option value="thu">Thursday (4)</option>
                        <option value="fri">Friday (5)</option>
                        <option value="sat">Saturday (6)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    🔄 <strong>Month + Day Rule:</strong> Occurs on the <strong>{monthlyOrdinalPos === 'last' ? 'Last' : `${monthlyOrdinalPos}th`} {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(monthlyOrdinalDay)]}</strong> of every month. Auto-creates <strong>2 days ahead</strong>.
                  </div>
                </div>
              )}

              {/* 5. DAILY RECURRENCE (OPTIONAL) */}
              {recurrenceType === 'Daily' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>
                      Daily Schedule (Optional)
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${dailyOption === 'every_day' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                      onClick={() => setDailyOption('every_day')}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      className={`btn ${dailyOption === 'weekdays' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                      onClick={() => setDailyOption('weekdays')}
                    >
                      Weekdays (Mon - Fri)
                    </button>
                    <button
                      type="button"
                      className={`btn ${dailyOption === 'weekends' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                      onClick={() => setDailyOption('weekends')}
                    >
                      Weekends (Sat - Sun)
                    </button>
                    <button
                      type="button"
                      className={`btn ${dailyOption === 'every_n_days' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', justifyContent: 'center' }}
                      onClick={() => setDailyOption('every_n_days')}
                    >
                      Custom Interval (N Days)
                    </button>
                  </div>

                  {dailyOption === 'every_n_days' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Repeat every</span>
                      <input
                        type="number"
                        min="2"
                        max="365"
                        className="form-input"
                        style={{ width: '80px', padding: '0.35rem' }}
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
                    </div>
                  )}

                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(100, 116, 139, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(100, 116, 139, 0.2)', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    ⏰ <strong>Daily Recurrence (Optional):</strong> Tasks repeat on the selected daily cadence. Auto-creates <strong>2 days ahead</strong>.
                  </div>
                </div>
              )}
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
