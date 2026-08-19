import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Calendar, Tag, FileSpreadsheet, FileCode } from 'lucide-react';
import { exportToCsv, exportToJson } from '../utils/exportUtils';

export default function AuditLogsView({ onSelectTask }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleExportCsv = () => {
    const columns = [
      { header: 'Timestamp', accessor: (row) => row.createdAt || row.created_at },
      { header: 'Ticket Key', accessor: (row) => row.ticket_key || 'System' },
      { header: 'Task Title', accessor: 'task_title' },
      { header: 'User', accessor: 'user_name' },
      { header: 'Action', accessor: 'action' },
      { header: 'Details', accessor: 'details' }
    ];
    exportToCsv('orbita_audit_logs', columns, logs);
  };

  const handleExportJson = () => {
    exportToJson('orbita_audit_logs', logs);
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Audit Trail</h1>
          <p className="page-subtitle">Immutable system-generated event records for compliance & history tracking</p>
        </div>

        {/* Dump / Export Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv} title="Export audit logs to CSV">
            <FileSpreadsheet size={15} color="var(--accent-green)" /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJson} title="Export full audit trail to JSON">
            <FileCode size={15} color="var(--accent-blue)" /> Export JSON
          </button>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div>Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No audit records yet.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Ticket Key</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id || log._id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {log.createdAt ? String(log.createdAt).substring(0, 19).replace('T', ' ') : log.created_at}
                    </td>
                    <td>
                      {log.ticket_key ? (
                        <span
                          style={{ fontWeight: '700', color: 'var(--accent-blue)', cursor: 'pointer' }}
                          onClick={() => onSelectTask(log.task_id)}
                        >
                          {log.ticket_key}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>System</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{log.user_name}</span>
                    </td>
                    <td>
                      <span className="badge badge-status">
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
