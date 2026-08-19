import React, { useState, useEffect } from 'react';
import { Repeat, Play, Plus, Calendar, CheckCircle2 } from 'lucide-react';

export default function RecurrenceView({ onTriggerRecurrence }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processes, setProcesses] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [processId, setProcessId] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('Monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState('Sat');
  const [assignee, setAssignee] = useState('Varun');

  const fetchTemplates = () => {
    fetch('/api/recurrence')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTemplates();
    fetch('/api/processes')
      .then((res) => res.json())
      .then((data) => {
        setProcesses(data);
        if (data.length > 0) setProcessId(data[0].id);
      });
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    fetch('/api/recurrence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        process_id: processId,
        recurrence_type: recurrenceType,
        day_of_month: recurrenceType === 'Monthly' ? Number(dayOfMonth) : null,
        day_of_week: recurrenceType === 'Weekly' ? dayOfWeek : null,
        assignee
      })
    })
      .then((res) => res.json())
      .then(() => {
        setShowModal(false);
        setTitle('');
        fetchTemplates();
      });
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Rules & Engine</h1>
          <p className="page-subtitle">Automated monthly bills, weekly routines & recurring maintenance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onTriggerRecurrence}>
            <Play size={16} /> Run Generator Now
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Rule Template
          </button>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div>Loading recurrence rules...</div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Master Template Title</th>
                  <th>Project & Process</th>
                  <th>Recurrence Pattern</th>
                  <th>Default Assignee</th>
                  <th>Last Generated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td><strong>#{tpl.id}</strong></td>
                    <td style={{ fontWeight: '600' }}>{tpl.title}</td>
                    <td>{tpl.project_name} → {tpl.process_name}</td>
                    <td>
                      <span className="badge badge-status">
                        {tpl.recurrence_type}{' '}
                        {tpl.recurrence_type === 'Monthly' ? `(Day ${tpl.day_of_month})` : ''}
                        {tpl.recurrence_type === 'Weekly' ? `(${tpl.day_of_week})` : ''}
                      </span>
                    </td>
                    <td>{tpl.assignee}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tpl.last_generated || 'Never'}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Rule Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Recurrence Rule Template</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Template Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Internet Broadband Bill Payment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Process</label>
                <select
                  className="form-select"
                  value={processId}
                  onChange={(e) => setProcessId(e.target.value)}
                  required
                >
                  {processes.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.project_name} → {pr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Recurrence Type</label>
                  <select
                    className="form-select"
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                {recurrenceType === 'Monthly' && (
                  <div className="form-group">
                    <label className="form-label">Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="form-input"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                    />
                  </div>
                )}

                {recurrenceType === 'Weekly' && (
                  <div className="form-group">
                    <label className="form-label">Day of Week</label>
                    <select
                      className="form-select"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                    >
                      <option value="Mon">Monday</option>
                      <option value="Tue">Tuesday</option>
                      <option value="Wed">Wednesday</option>
                      <option value="Thu">Thursday</option>
                      <option value="Fri">Friday</option>
                      <option value="Sat">Saturday</option>
                      <option value="Sun">Sunday</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <input
                  type="text"
                  className="form-input"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
