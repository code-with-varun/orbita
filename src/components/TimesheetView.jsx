import React, { useState, useEffect } from 'react';
import { Clock, Calendar, User, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import { exportToCsv, exportToJson } from '../utils/exportUtils';
import { TableSkeleton } from './SkeletonLoader';

export default function TimesheetView({ currentUser, onSelectTask }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = '/api/timesheets?';
    if (currentUser) {
      url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&user_name=${encodeURIComponent(currentUser.name || '')}&`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUser]);

  const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
  const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

  const handleExportCsv = () => {
    const columns = [
      { header: 'Ticket Key', accessor: 'ticket_key' },
      { header: 'Task / Item Title', accessor: 'task_title' },
      { header: 'Orbita Type', accessor: (row) => row.orbita_type || 'Goal' },
      { header: 'Workspace', accessor: (row) => row.workspace || 'Personal' },
      { header: 'Tags', accessor: (row) => row.tags || '' },
      { header: 'User', accessor: 'user_name' },
      { header: 'Start Time', accessor: 'start_time' },
      { header: 'End Time', accessor: (row) => row.end_time || 'Running' },
      { header: 'Duration (Seconds)', accessor: 'duration_seconds' },
      { header: 'Duration (Hours)', accessor: (row) => Math.round(((row.duration_seconds || 0) / 3600) * 100) / 100 },
      { header: 'Notes', accessor: 'notes' }
    ];
    exportToCsv('orbita_timesheet_sessions', columns, sessions);
  };

  const handleExportJson = () => {
    exportToJson('orbita_timesheet_sessions', sessions);
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timesheet & Work Sessions</h1>
          <p className="page-subtitle">Detailed focus effort audit (Toggl/Clockify style logging & data export)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Dump / Export Buttons */}
          <button className="btn btn-secondary" onClick={handleExportCsv} title="Export timesheet sessions to CSV">
            <FileSpreadsheet size={15} color="var(--accent-green)" /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJson} title="Export full timesheet data dump to JSON">
            <FileCode size={15} color="var(--accent-blue)" /> Export JSON
          </button>

          <div className="glass-card" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} color="var(--accent-green)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Logged Effort</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{totalHours} Hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No focus sessions logged yet. Start a focus timer on any Goal or Project to record deep work effort!
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket Key</th>
                  <th>Item Title</th>
                  <th>Orbita Type</th>
                  <th>Workspace</th>
                  <th>Tags</th>
                  <th>User</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess) => {
                  const hrs = Math.round((sess.duration_seconds / 3600) * 100) / 100;
                  const mins = Math.floor(sess.duration_seconds / 60);
                  const secs = sess.duration_seconds % 60;

                  return (
                    <tr key={sess.id || sess._id}>
                      <td>
                        <span
                          style={{ fontWeight: '800', color: 'var(--accent-blue)', cursor: 'pointer' }}
                          onClick={() => onSelectTask(sess.task_id)}
                        >
                          {sess.ticket_key}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{sess.task_title}</td>
                      <td>
                        <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                          {sess.orbita_type || 'Goal'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                          {sess.workspace || 'Personal'}
                        </span>
                      </td>
                      <td>{sess.tags || '-'}</td>
                      <td>{sess.user_name}</td>
                      <td style={{ fontSize: '0.8rem' }}>{sess.start_time ? String(sess.start_time).substring(0, 19).replace('T', ' ') : '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{sess.end_time ? String(sess.end_time).substring(0, 19).replace('T', ' ') : 'Running...'}</td>
                      <td>
                        <span className="badge badge-success">
                          {hrs}h ({mins}m {secs}s)
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sess.notes || 'Focus session'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
