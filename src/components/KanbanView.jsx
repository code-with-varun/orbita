import React, { useState } from 'react';
import { Play, ArrowUpRight, Plus, Star, Repeat, Target, FolderGit2, CheckSquare } from 'lucide-react';

export default function KanbanView({ tasks, onUpdateTaskStatus, onSelectTask, onStartTimer, onToggleStar }) {
  const [filterType, setFilterType] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');

  const columns = [
    { id: 'Active', title: 'Active / Backlog', color: 'var(--accent-blue)' },
    { id: 'In Progress', title: 'In Progress', color: 'var(--accent-purple)' },
    { id: 'Paused', title: 'Paused', color: 'var(--accent-amber)' },
    { id: 'Completed', title: 'Completed', color: 'var(--accent-green)' }
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filterType && t.orbita_type !== filterType) return false;
    if (filterWorkspace && t.workspace !== filterWorkspace) return false;
    return true;
  });

  const getTypeIcon = (type) => {
    if (type === 'Routine') return <Repeat size={12} color="var(--accent-purple)" />;
    if (type === 'Goal') return <Target size={12} color="var(--accent-amber)" />;
    if (type === 'Project') return <FolderGit2 size={12} color="var(--accent-blue)" />;
    return <CheckSquare size={12} color="var(--accent-green)" />;
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kanban Flow Board</h1>
          <p className="page-subtitle">Visual workflow progression across Tasks, Routines, Goals & Projects</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select className="select-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types (Task, Routine, Goal, Project)</option>
            <option value="Task">Tasks</option>
            <option value="Routine">Routines</option>
            <option value="Goal">Goals</option>
            <option value="Project">Projects</option>
          </select>

          <select className="select-input" value={filterWorkspace} onChange={(e) => setFilterWorkspace(e.target.value)}>
            <option value="">All Workspaces</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header" style={{ borderBottomColor: col.color }}>
                <span className="kanban-col-title" style={{ color: 'var(--text-main)' }}>
                  {col.title}
                </span>
                <span className="nav-item-badge">{colTasks.length}</span>
              </div>

              <div className="kanban-card-list">
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    Empty
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-card"
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                          {task.ticket_key}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStar(task.id);
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)', padding: 0 }}
                          >
                            <Star size={14} fill={task.is_starred ? 'currentColor' : 'none'} />
                          </button>
                          <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`} style={{ fontSize: '0.65rem' }}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        {task.title}
                      </h4>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span className="badge badge-status" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem' }}>
                          {getTypeIcon(task.orbita_type)} {task.orbita_type}
                        </span>
                        <span className="badge badge-status" style={{ fontSize: '0.65rem' }}>
                          {task.workspace}
                        </span>
                        <span className="badge badge-status" style={{ fontSize: '0.65rem' }}>
                          {task.priority_quadrant}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                        <span>Due: {task.due_date || task.scheduled_date || '-'}</span>

                        {task.is_timer_allowed && task.status !== 'Completed' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTimer(task.id);
                            }}
                          >
                            <Play size={10} fill="currentColor" /> Timer
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
