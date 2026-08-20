import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Star, Repeat, Target, FolderGit2, CheckSquare } from 'lucide-react';
import { CalendarSkeleton } from './SkeletonLoader';

export default function CalendarView({
  tasks = [],
  loading = false,
  onSelectTask,
  onCreateOnDate,
  onToggleStar
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar cells
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const getTasksForDate = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return safeTasks.filter((t) => t.orbita_type !== 'Routine' && (t.scheduled_date === dateStr || t.due_date === dateStr));
  };

  const getTypeBorder = (type) => {
    if (type === 'Project') return 'var(--accent-blue)';
    if (type === 'Goal') return 'var(--accent-amber)';
    if (type === 'Routine') return 'var(--accent-purple)';
    return 'var(--accent-green)';
  };

  const getTypeLabel = (type) => {
    if (type === 'Project') return 'PRJ';
    if (type === 'Goal') return 'GOL';
    if (type === 'Routine') return 'RTN';
    return 'TSK';
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar Planner</h1>
          <p className="page-subtitle">Schedule and view Tasks, Routines, Goals & Projects by date</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleToday}>
            Today
          </button>
          <button className="btn btn-secondary" onClick={handlePrevMonth} style={{ padding: '0.5rem' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: '700', fontSize: '1rem', minWidth: '140px', textAlign: 'center', color: 'var(--text-main)' }}>
            {monthNames[month]} {year}
          </span>
          <button className="btn btn-secondary" onClick={handleNextMonth} style={{ padding: '0.5rem' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <CalendarSkeleton />
      ) : (
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const dateTasks = getTasksForDate(day);
          const isToday =
            day &&
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : null;

          return (
            <div
              key={idx}
              className={`calendar-cell ${isToday ? 'today' : ''} ${!day ? 'empty' : ''}`}
              onClick={() => {
                if (day && onCreateOnDate) {
                  onCreateOnDate(dateStr);
                }
              }}
            >
              {day && (
                <>
                  <div className="calendar-date-number">
                    <span>{day}</span>
                    <button
                      className="add-task-day-btn"
                      title="Add item on this date"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateOnDate(dateStr);
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="calendar-events">
                    {dateTasks.map((task) => (
                      <div
                        key={task.id}
                        className="calendar-event-pill"
                        style={{
                          borderLeft: `3px solid ${getTypeBorder(task.orbita_type)}`,
                          background: 'var(--bg-card-hover)',
                          color: 'var(--text-main)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task.id);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '105px' }}>
                            {task.is_starred ? '★ ' : ''}{task.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.8, color: getTypeBorder(task.orbita_type), fontWeight: '700' }}>
                            {getTypeLabel(task.orbita_type)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
