import React, { useState } from 'react';
import { ArrowUpDown, Play, ArrowUpRight, Trash2, ArrowUp, ArrowDown, Star, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { exportToCsv, exportToJson } from '../utils/exportUtils';
import { TableSkeleton } from './SkeletonLoader';

export default function TicketGridView({ tasks, loading = false, onSelectTask, onUpdateTaskStatus, onDeleteTask, onStartTimer, onToggleStar }) {
  const [filterType, setFilterType] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterQuadrant, setFilterQuadrant] = useState('');
  const [sortField, setSortField] = useState('ticket_key');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = safeTasks.filter((t) => {
    if (filterType && t.orbita_type !== filterType) return false;
    if (filterWorkspace && t.workspace !== filterWorkspace) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterQuadrant && t.priority_quadrant !== filterQuadrant) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} color="var(--text-dim)" />;
    return sortAsc ? <ArrowUp size={12} color="var(--accent-blue)" /> : <ArrowDown size={12} color="var(--accent-blue)" />;
  };

  const handleExportCsv = () => {
    const columns = [
      { header: 'Ticket Key', accessor: 'ticket_key' },
      { header: 'Title', accessor: 'title' },
      { header: 'Orbita Type', accessor: 'orbita_type' },
      { header: 'Workspace', accessor: 'workspace' },
      { header: 'Tags', accessor: 'tags' },
      { header: 'Quadrant', accessor: 'priority_quadrant' },
      { header: 'Priority', accessor: 'priority' },
      { header: 'Status', accessor: 'status' },
      { header: 'Assignee', accessor: 'assignee' },
      { header: 'Scheduled Date', accessor: 'scheduled_date' },
      { header: 'Due Date', accessor: 'due_date' },
      { header: 'Target Hours', accessor: 'target_hours' },
      { header: 'Actual Hours', accessor: 'actual_hours' },
      { header: 'Starred', accessor: (row) => (row.is_starred ? 'Yes' : 'No') },
      { header: 'Created At', accessor: 'createdAt' }
    ];
    exportToCsv('orbita_work_items', columns, sortedTasks);
  };

  const handleExportJson = () => {
    exportToJson('orbita_work_items', sortedTasks);
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Grid View</h1>
          <p className="page-subtitle">Excel / Monday.com style data grid with sorting, quick actions & data dump</p>
        </div>

        {/* Dump / Export Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCsv} title="Export current table to CSV">
            <FileSpreadsheet size={15} color="var(--accent-green)" /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportJson} title="Export full data dump to JSON">
            <FileCode size={15} color="var(--accent-blue)" /> Export JSON
          </button>
        </div>
      </div>

      {/* Grid Filters */}
      <div className="filter-bar">
        <select className="select-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types (Task, Routine, Goal, Project)</option>
          <option value="Task">Task</option>
          <option value="Routine">Routine</option>
          <option value="Goal">Goal</option>
          <option value="Project">Project</option>
        </select>

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

        <select className="select-input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('ticket_key')} style={{ cursor: 'pointer' }}>
                  ID {renderSortIcon('ticket_key')}
                </th>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Title {renderSortIcon('title')}
              </th>
              <th>Type</th>
              <th>Workspace</th>
              <th>Tags</th>
              <th>Quadrant</th>
              <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                Priority {renderSortIcon('priority')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status {renderSortIcon('status')}
              </th>
              <th>Assignee</th>
              <th>Focus Effort</th>
              <th onClick={() => handleSort('due_date')} style={{ cursor: 'pointer' }}>
                Due Date {renderSortIcon('due_date')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No items found in grid.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <span
                      style={{ fontWeight: '800', color: 'var(--accent-blue)', cursor: 'pointer' }}
                      onClick={() => onSelectTask(task.id)}
                    >
                      {task.ticket_key}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', maxWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => onToggleStar && onToggleStar(task.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)', padding: 0 }}
                      >
                        <Star size={14} fill={task.is_starred ? 'currentColor' : 'none'} />
                      </button>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                      {task.orbita_type}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                      {task.workspace}
                    </span>
                  </td>
                  <td>
                    {task.tags ? <span className="badge badge-status" style={{ fontSize: '0.65rem' }}>{task.tags}</span> : '-'}
                  </td>
                  <td>
                    <span className="badge badge-status" style={{ fontSize: '0.7rem' }}>
                      {task.priority_quadrant || 'Q2'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className="select-input"
                      value={task.status}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                    >
                      <option value="Active">Active</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>{task.assignee || 'Unassigned'}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {task.orbita_type === 'Goal' ? `${task.actual_hours || 0}h / ${task.target_hours || 0}h` : (task.is_timer_allowed ? `${task.actual_hours || 0}h` : '-')}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{task.due_date || task.scheduled_date || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {task.is_timer_allowed && task.status !== 'Completed' && task.orbita_type === 'Goal' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => onStartTimer(task.id)}
                          title="Start Focus Timer"
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      ) : null}

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => onSelectTask(task.id)}
                        title="View / Edit Item"
                      >
                        <ArrowUpRight size={12} />
                      </button>

                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete Item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
