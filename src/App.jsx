import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PriorityMatrixView from './components/PriorityMatrixView';
import MonthlyHighlightsView from './components/MonthlyHighlightsView';
import TodoView from './components/TodoView';
import KanbanView from './components/KanbanView';
import TicketGridView from './components/TicketGridView';
import CalendarView from './components/CalendarView';
import TimesheetView from './components/TimesheetView';
import AuditLogsView from './components/AuditLogsView';

import TaskFormModal from './components/TaskFormModal';
import TaskDetailModal from './components/TaskDetailModal';
import AuthModal from './components/AuthModal';
import ToastNotification from './components/ToastNotification';
import LandingPage from './components/LandingPage';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('All'); // 'All' | 'Personal' | 'Work'
  const [toast, setToast] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('orbita_theme') || 'dark');

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('orbita_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialRegister, setAuthInitialRegister] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [defaultScheduledDate, setDefaultScheduledDate] = useState('');

  // Active Running Timer
  const [runningTask, setRunningTask] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('orbita_theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'light' ? 'Light' : 'Dark'} Mode`, 'info');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('orbita_user', JSON.stringify(user));
    setIsAuthModalOpen(false);
    showToast(`Welcome to Orbita, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('orbita_user');
    showToast('Signed out', 'info');
  };

  const fetchStats = () => {
    let url = '/api/dashboard/stats?';
    if (workspaceFilter && workspaceFilter !== 'All') {
      url += `workspace=${workspaceFilter}&`;
    }
    if (currentUser) {
      url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&user_name=${encodeURIComponent(currentUser.name || '')}&`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  };

  const fetchTasks = () => {
    let url = `/api/tasks?`;
    if (workspaceFilter && workspaceFilter !== 'All') {
      url += `workspace=${workspaceFilter}&`;
    }
    if (searchTerm) {
      url += `search=${encodeURIComponent(searchTerm)}&`;
    }
    if (currentUser) {
      url += `user_id=${currentUser.id || ''}&user_email=${encodeURIComponent(currentUser.email || '')}&user_role=${currentUser.role || ''}&user_name=${encodeURIComponent(currentUser.name || '')}&`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        const running = data.find((t) => t.is_timer_running);
        setRunningTask(running || null);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, workspaceFilter]);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser, searchTerm, workspaceFilter, refreshTrigger]);

  const refreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchTasks();
    fetchStats();
  };

  const handleResetDatabase = () => {
    if (!currentUser || currentUser.role !== 'Superadmin') {
      showToast('Access Denied: Only a Super Admin can reset the system.', 'danger');
      return;
    }

    fetch('/api/system/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: currentUser.email,
        user_role: currentUser.role,
        user_name: currentUser.name
      })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => Promise.reject(new Error(d.error || 'Failed to reset')));
        }
        return res.json();
      })
      .then((data) => {
        showToast(data.message || 'System reset to fresh setup by Super Admin!', 'success');
        refreshAll();
      })
      .catch((err) => showToast(err.message || 'Failed to reset', 'danger'));
  };

  // Star Toggle
  const handleToggleStar = (taskId) => {
    fetch(`/api/tasks/${taskId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message, 'success');
        refreshAll();
      })
      .catch((err) => showToast(err.error || 'Failed to toggle star', 'danger'));
  };

  // Timer Handlers
  const handleStartTimer = (taskId) => {
    fetch(`/api/tasks/${taskId}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User' })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e));
        return res.json();
      })
      .then(() => {
        showToast('Focus timer started!', 'success');
        refreshAll();
      })
      .catch((err) => showToast(err.error || 'Failed to start timer', 'danger'));
  };

  const handlePauseTimer = (taskId) => {
    fetch(`/api/tasks/${taskId}/timer/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Focus timer paused', 'info');
        refreshAll();
      })
      .catch((err) => showToast(err.error || 'Failed to pause timer', 'danger'));
  };

  const handleResumeTimer = (taskId) => {
    fetch(`/api/tasks/${taskId}/timer/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Focus timer resumed!', 'success');
        refreshAll();
      })
      .catch((err) => showToast(err.error || 'Failed to resume timer', 'danger'));
  };

  const handleStopTimer = (taskId) => {
    fetch(`/api/tasks/${taskId}/timer/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: currentUser?.name || 'User', notes: 'Focus Session Logged' })
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(`Timer stopped. Logged ${data.duration_hours || 0}h focus session!`, 'success');
        refreshAll();
      })
      .catch((err) => showToast(err.error || 'Failed to stop timer', 'danger'));
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, updated_by: currentUser?.name || 'User' })
    })
      .then((res) => res.json())
      .then(() => {
        showToast(`Status updated to ${newStatus}`, 'info');
        refreshAll();
      });
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      .then(() => {
        showToast('Item deleted', 'danger');
        refreshAll();
      });
  };

  const handleCreateOnDate = (dateStr) => {
    setDefaultScheduledDate(dateStr);
    setIsTaskModalOpen(true);
  };

  // If user is not authenticated, render the Landing Page as the Home Page
  if (!currentUser) {
    return (
      <div className="landing-root">
        <LandingPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAuth={(isRegister) => {
            setAuthInitialRegister(Boolean(isRegister));
            setIsAuthModalOpen(true);
          }}
          onExploreApp={() => {
            setAuthInitialRegister(false);
            setIsAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialIsRegister={authInitialRegister}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {toast && (
          <ToastNotification toast={toast} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} stats={stats} />

      <div className="main-wrapper">
        <Header
          runningTask={runningTask}
          onStopTimer={handleStopTimer}
          onPauseTimer={handlePauseTimer}
          onResumeTimer={handleResumeTimer}
          onOpenTaskModal={() => {
            setDefaultScheduledDate('');
            setIsTaskModalOpen(true);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          workspaceFilter={workspaceFilter}
          setWorkspaceFilter={setWorkspaceFilter}
          onResetDatabase={handleResetDatabase}
        />

        {activeView === 'dashboard' && (
          <DashboardView
            stats={stats}
            onSelectTask={(id) => setSelectedTaskId(id)}
            setActiveView={setActiveView}
          />
        )}

        {/* 1. Tasks (Single Action) */}
        {activeView === 'tasks' && (
          <TodoView
            title="Tasks (Single Action Items)"
            description="One-time simple completion tasks (e.g. Buy groceries, search document)"
            typeFilterDefault="Task"
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onToggleStar={handleToggleStar}
            onRefresh={refreshAll}
            runningTask={runningTask}
          />
        )}

        {/* 2. Routines (Recurring) */}
        {activeView === 'routines' && (
          <TodoView
            title="Routines (Recurring Schedules)"
            description="Automated recurring activities (e.g. Weekly meeting, electricity bill, nth day of month)"
            typeFilterDefault="Routine"
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onToggleStar={handleToggleStar}
            onRefresh={refreshAll}
            runningTask={runningTask}
          />
        )}

        {/* 3. Goals (Focus Efforts) */}
        {activeView === 'goals' && (
          <TodoView
            title="Goals (Time-Tracked Focus Efforts)"
            description="Ongoing focus goals tracked with stopwatch sessions and hours targets (e.g. Learning JavaScript, YouTube content)"
            typeFilterDefault="Goal"
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onToggleStar={handleToggleStar}
            onRefresh={refreshAll}
            runningTask={runningTask}
          />
        )}

        {/* 4. Projects (Multi-Stage Delivery) */}
        {activeView === 'projects' && (
          <TodoView
            title="Projects (Structured Multi-Stage Delivery)"
            description="Structured execution with Stage -> Task hierarchy (e.g. Building CRM app, MERN project, Website)"
            typeFilterDefault="Project"
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onToggleStar={handleToggleStar}
            onRefresh={refreshAll}
            runningTask={runningTask}
          />
        )}

        {/* Priority Matrix */}
        {activeView === 'matrix' && (
          <PriorityMatrixView
            currentUser={currentUser}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResumeTimer={handleResumeTimer}
            onStopTimer={handleStopTimer}
            onToggleStar={handleToggleStar}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            refreshTrigger={refreshTrigger}
            workspaceFilter={workspaceFilter}
            onRefresh={refreshAll}
          />
        )}

        {/* Monthly Highlights */}
        {activeView === 'highlights' && (
          <MonthlyHighlightsView
            currentUser={currentUser}
            onSelectTask={(id) => setSelectedTaskId(id)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {/* Data Grid */}
        {activeView === 'grid' && (
          <TicketGridView
            tasks={tasks}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onStartTimer={handleStartTimer}
            onToggleStar={handleToggleStar}
          />
        )}

        {/* Kanban Board */}
        {activeView === 'kanban' && (
          <KanbanView
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onToggleStar={handleToggleStar}
          />
        )}

        {/* Calendar Planner */}
        {activeView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onStartTimer={handleStartTimer}
            onToggleStar={handleToggleStar}
            onCreateOnDate={handleCreateOnDate}
          />
        )}

        {/* Timesheet Log */}
        {activeView === 'timesheet' && (
          <TimesheetView currentUser={currentUser} onSelectTask={(id) => setSelectedTaskId(id)} />
        )}

        {/* Audit Logs */}
        {activeView === 'audit_logs' && (
          <AuditLogsView currentUser={currentUser} onSelectTask={(id) => setSelectedTaskId(id)} />
        )}
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setDefaultScheduledDate('');
        }}
        onRefresh={refreshAll}
        currentUser={currentUser}
        defaultScheduledDate={defaultScheduledDate}
      />

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onRefresh={refreshAll}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
        runningTask={runningTask}
        currentUser={currentUser}
      />

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
