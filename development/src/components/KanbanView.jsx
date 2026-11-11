import React, { useState } from 'react';
import { Play, ArrowUpRight, Plus, Star, Repeat, Target, FolderGit2, CheckSquare, Lock } from 'lucide-react';
import { KanbanSkeleton } from './SkeletonLoader';

export default function KanbanView({
  tasks = [],
  loading = false,
  onUpdateTaskStatus,
  onSelectTask,
  onStartTimer,
  onToggleStar
}) {
  const [filterType, setFilterType] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const columns = [
    { id: 'Active', title: 'Active / Backlog', color: 'var(--accent-blue)' },
    { id: 'In Progress', title: 'In Progress', color: 'var(--accent-purple)' },
    { id: 'Paused', title: 'Paused', color: 'var(--accent-amber)' },
    { id: 'Completed', title: 'Completed', color: 'var(--accent-green)' }
  ];

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const filteredTasks = safeTasks.filter((t) => {
    // Master routines appear only in the Routines page; their generated actionable tasks appear here
    if (t.orbita_type === 'Routine') return false;
    if (filterType && t.orbita_type !== filterType) return false;
    if (filterWorkspace && t.workspace !== filterWorkspace) return false;
    return true;
  });

  const getTypeIcon = (type) => {
    if (type === 'Goal') return <Target size={12} color="var(--accent-amber)" />;
    if (type === 'Project') return <FolderGit2 size={12} color="var(--accent-blue)" />;
    return <CheckSquare size={12} color="var(--accent-green)" />;
  };

  const isDraggableTask = (task) => {
    return task.orbita_type === 'Task';
  };

  const handleDragStart = (e, task) => {
    if (!isDraggableTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!isDraggableTask(task)) {
      alert('Note: Goals & Projects are progression-locked (progress is tracked via focus timer & stage completion).');
      return;
    }

    if (task.status !== targetColId) {
      onUpdateTaskStatus(taskId, targetColId);
    }
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kanban Flow Board</h1>
          <p className="page-subtitle">Interactive drag & drop board (Drag supported for Tasks & Routines, Scrollable Columns)</p>
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

      {loading ? (
        <KanbanSkeleton />
      ) : (
        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isColumnOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`kanban-col ${isColumnOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isColumnOver ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '560px'
                }}
              >
                <div
                  className="kanban-col-header"
                  style={{
                    borderBottom: `3px solid ${col.color}`,
                    paddingBottom: '0.5rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span className="kanban-col-title" style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '0.92rem' }}>
                    {col.title}
                  </span>
                  <span className="nav-item-badge">{colTasks.length}</span>
                </div>

                {/* Scrollable Card Container */}
                <div
                  className="scrollable-section"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    flex: 1
                  }}
                >
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      Drop items here
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const canDrag = isDraggableTask(task);
                      const isDragging = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          className={`task-card kanban-card ${canDrag ? 'draggable' : ''} ${isDragging ? 'dragging' : ''}`}
                          draggable={canDrag}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => onSelectTask(task.id)}
                          style={{
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem',
                            cursor: canDrag ? 'grab' : 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                              {task.ticket_key}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {!canDrag && (
                                <span title="Progression managed via Timer / Stages" style={{ color: 'var(--text-dim)' }}>
                                  <Lock size={12} />
                                </span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStar(task.id);
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.is_starred ? 'var(--accent-amber)' : 'var(--text-dim)', padding: 0 }}
                              >
                                <Star size={14} fill={task.is_starred ? 'currentColor' : 'none'} />
                              </button>
                              <span className={`badge badge-priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`} style={{ fontSize: '0.62rem' }}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                            {task.title}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <span className="badge badge-status" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                              {getTypeIcon(task.orbita_type)} {task.orbita_type}
                            </span>
                            <span className="badge badge-status" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                              {task.workspace}
                            </span>
                            <span className="badge badge-status" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                              {task.priority_quadrant}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '0.35rem', borderTop: '1px solid var(--border-color)' }}>
                            <span>Due: {task.due_date || task.scheduled_date || '-'}</span>

                            {task.is_timer_allowed && task.status !== 'Completed' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem' }}
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
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
