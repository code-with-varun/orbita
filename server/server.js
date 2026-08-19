import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  connectDb,
  User,
  Task,
  TimeSession,
  AuditLog,
  cleanResetDatabase
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
await connectDb();

// -------------------------------------------------------------
// SYSTEM RESET (SUPERADMIN ONLY)
// -------------------------------------------------------------

app.post('/api/system/reset', async (req, res) => {
  try {
    const { user_email, user_role, user_name } = req.body;

    if (user_email) {
      const user = await User.findOne({ email: user_email.toLowerCase().trim() });
      if (!user || user.role !== 'Superadmin') {
        return res.status(403).json({ error: 'Access Denied: Only a Super Admin can reset the system.' });
      }
    } else if (user_role && user_role !== 'Superadmin') {
      return res.status(403).json({ error: 'Access Denied: Only a Super Admin can reset the system.' });
    }

    await cleanResetDatabase(user_name || 'Super Admin');
    res.json({
      message: 'Fresh setup complete! System reset to initial state with Super Admin preserved.',
      superadmin: 'superadmin@orbita.com'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password_hash: password.trim(),
      role: role || 'Member'
    });

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || user.password_hash !== password.trim()) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role createdAt').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// WORK ITEMS (TASK | ROUTINE | GOAL | PROJECT)
// -------------------------------------------------------------

app.get('/api/tasks', async (req, res) => {
  try {
    const { orbita_type, workspace, priority_quadrant, status, search, is_starred } = req.query;
    const query = {};

    if (orbita_type) {
      query.orbita_type = new RegExp(`^${orbita_type}$`, 'i');
    }
    if (workspace && workspace !== 'All') {
      query.workspace = new RegExp(`^${workspace}$`, 'i');
    }
    if (priority_quadrant) {
      query.priority_quadrant = priority_quadrant;
    }
    if (status) {
      query.status = status;
    }
    if (is_starred !== undefined && is_starred !== '') {
      query.is_starred = is_starred === '1' || is_starred === 'true';
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
        { ticket_key: new RegExp(search, 'i') }
      ];
    }

    const items = await Task.find(query).sort({ is_starred: -1, _id: -1 });

    const enriched = items.map((doc) => {
      const item = doc.toObject();
      item.id = item._id.toString();

      if (item.orbita_type === 'Project' && item.stages) {
        let total = 0;
        let completed = 0;

        item.stages = item.stages.map((st) => {
          const sTotal = st.tasks?.length || 0;
          const sDone = st.tasks?.filter((t) => t.is_completed).length || 0;
          total += sTotal;
          completed += sDone;
          return {
            ...st,
            id: st._id?.toString(),
            total_tasks: sTotal,
            completed_tasks: sDone,
            is_completed: sTotal > 0 && sDone === sTotal
          };
        });

        item.total_tasks = total;
        item.completed_tasks = completed;
        item.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : (item.status === 'Completed' ? 100 : 0);
      }

      return item;
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const doc = await Task.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Item not found' });

    const item = doc.toObject();
    item.id = item._id.toString();

    if (item.orbita_type === 'Project' && item.stages) {
      let total = 0;
      let completed = 0;
      item.stages = item.stages.map((st) => {
        const sTotal = st.tasks?.length || 0;
        const sDone = st.tasks?.filter((t) => t.is_completed).length || 0;
        total += sTotal;
        completed += sDone;
        return {
          ...st,
          id: st._id?.toString(),
          total_tasks: sTotal,
          completed_tasks: sDone,
          is_completed: sTotal > 0 && sDone === sTotal
        };
      });
      item.total_tasks = total;
      item.completed_tasks = completed;
      item.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : (item.status === 'Completed' ? 100 : 0);
    }

    const sessions = await TimeSession.find({ task_id: doc._id }).sort({ _id: -1 });
    const logs = await AuditLog.find({ task_id: doc._id }).sort({ _id: -1 });

    item.sessions = sessions.map((s) => ({ ...s.toObject(), id: s._id.toString() }));
    item.logs = logs.map((l) => ({ ...l.toObject(), id: l._id.toString() }));

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const {
      title,
      description = '',
      tags = '',
      orbita_type = 'Task',
      workspace = 'Personal',
      is_urgent = false,
      is_important = true,
      priority,
      status = 'Active',
      assignee = 'Unassigned',
      created_by = 'User',
      scheduled_date,
      due_date,
      recurrence_type,
      recurrence_interval = 1,
      recurrence_day,
      target_hours = 0,
      estimated_hours = 0,
      is_starred = false,
      notes = '',
      stages = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Determine Quadrant & Derived Priority
    let priority_quadrant = 'Q2';
    let computed_priority = 'High';
    const urg = Boolean(is_urgent);
    const imp = Boolean(is_important);

    if (imp && urg) {
      priority_quadrant = 'Q1';
      computed_priority = 'Critical';
    } else if (imp && !urg) {
      priority_quadrant = 'Q2';
      computed_priority = 'High';
    } else if (!imp && urg) {
      priority_quadrant = 'Q3';
      computed_priority = 'Medium';
    } else {
      priority_quadrant = 'Q4';
      computed_priority = 'Low';
    }

    const final_priority = priority || computed_priority;

    // Generate Prefix & Key
    let prefix = 'TSK';
    if (orbita_type === 'Routine') prefix = 'RTN';
    else if (orbita_type === 'Goal') prefix = 'GOL';
    else if (orbita_type === 'Project') prefix = 'PRJ';

    const count = await Task.countDocuments({ orbita_type });
    const ticket_key = `${prefix}-${String(count + 1).padStart(3, '0')}`;

    const isTimerAllowed = orbita_type === 'Goal' || orbita_type === 'Project';

    // Format Stages & Sub-Tasks for Projects
    let formattedStages = [];
    if (orbita_type === 'Project' && Array.isArray(stages)) {
      formattedStages = stages
        .filter((st) => st.title && st.title.trim() !== '')
        .map((st, sIdx) => ({
          title: st.title.trim(),
          order_index: sIdx + 1,
          is_completed: false,
          tasks: (st.tasks || [])
            .filter((t) => t.title && t.title.trim() !== '')
            .map((t, tIdx) => ({
              ticket_key: `${ticket_key}-T${tIdx + 1}`,
              title: t.title.trim(),
              is_completed: false,
              assignee: t.assignee || assignee,
              due_date: t.due_date || due_date || null,
              is_urgent: urg,
              is_important: imp,
              priority_quadrant,
              priority: final_priority,
              is_timer_allowed: true,
              order_index: tIdx + 1
            }))
        }));
    }

    const task = await Task.create({
      ticket_key,
      orbita_type,
      workspace,
      title: title.trim(),
      description,
      tags,
      is_urgent: urg,
      is_important: imp,
      priority_quadrant,
      priority: final_priority,
      status,
      assignee,
      created_by,
      scheduled_date: scheduled_date || null,
      due_date: due_date || null,
      recurrence_type: orbita_type === 'Routine' ? recurrence_type : null,
      recurrence_interval: orbita_type === 'Routine' ? parseInt(recurrence_interval) || 1 : null,
      recurrence_day: orbita_type === 'Routine' ? recurrence_day : null,
      target_hours: orbita_type === 'Goal' ? parseFloat(target_hours) || 0 : 0,
      estimated_hours: parseFloat(estimated_hours) || 0,
      is_timer_allowed: isTimerAllowed,
      is_starred: Boolean(is_starred),
      notes,
      stages: formattedStages
    });

    await AuditLog.create({
      task_id: task._id,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      user_name: created_by,
      action: `${orbita_type} Created`,
      details: `Created ${ticket_key}: ${title} (${workspace} • ${orbita_type})`
    });

    const resObj = task.toObject();
    resObj.id = resObj._id.toString();
    res.status(201).json(resObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    const updates = req.body;
    const prevStatus = task.status;

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.tags !== undefined) task.tags = updates.tags;
    if (updates.workspace !== undefined) task.workspace = updates.workspace;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.assignee !== undefined) task.assignee = updates.assignee;
    if (updates.scheduled_date !== undefined) task.scheduled_date = updates.scheduled_date;
    if (updates.due_date !== undefined) task.due_date = updates.due_date;
    if (updates.notes !== undefined) task.notes = updates.notes;
    if (updates.target_hours !== undefined) task.target_hours = parseFloat(updates.target_hours) || 0;
    if (updates.is_starred !== undefined) task.is_starred = Boolean(updates.is_starred);

    if (updates.is_urgent !== undefined || updates.is_important !== undefined) {
      const urg = updates.is_urgent !== undefined ? Boolean(updates.is_urgent) : task.is_urgent;
      const imp = updates.is_important !== undefined ? Boolean(updates.is_important) : task.is_important;
      task.is_urgent = urg;
      task.is_important = imp;
      if (imp && urg) {
        task.priority_quadrant = 'Q1';
        task.priority = 'Critical';
      } else if (imp && !urg) {
        task.priority_quadrant = 'Q2';
        task.priority = 'High';
      } else if (!imp && urg) {
        task.priority_quadrant = 'Q3';
        task.priority = 'Medium';
      } else {
        task.priority_quadrant = 'Q4';
        task.priority = 'Low';
      }
    }

    if (updates.priority !== undefined) {
      task.priority = updates.priority;
    }

    if (task.status === 'Completed' && prevStatus !== 'Completed') {
      task.completed_at = new Date();
      if (task.is_timer_running) {
        task.is_timer_running = false;
        task.timer_started_at = null;
      }
    } else if (task.status !== 'Completed') {
      task.completed_at = null;
    }

    task.updatedAt = new Date();
    await task.save();

    if (task.status !== prevStatus) {
      await AuditLog.create({
        task_id: task._id,
        ticket_key: task.ticket_key,
        task_title: task.title,
        orbita_type: task.orbita_type,
        workspace: task.workspace,
        user_name: updates.updated_by || 'User',
        action: task.status === 'Completed' ? `${task.orbita_type} Completed` : 'Status Changed',
        details: `Status updated from ${prevStatus} to ${task.status}`
      });
    }

    const resObj = task.toObject();
    resObj.id = resObj._id.toString();
    res.json(resObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    await TimeSession.deleteMany({ task_id: req.params.id });
    await AuditLog.deleteMany({ task_id: req.params.id });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Star Milestone
app.post('/api/tasks/:id/star', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    task.is_starred = !task.is_starred;
    await task.save();

    await AuditLog.create({
      task_id: task._id,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      user_name: req.body.user_name || 'User',
      action: task.is_starred ? 'Milestone Starred' : 'Milestone Unstarred',
      details: `${task.is_starred ? 'Starred' : 'Unstarred'} milestone: ${task.title}`
    });

    res.json({ message: task.is_starred ? 'Milestone Starred (★) for Highlights!' : 'Milestone Unstarred', is_starred: task.is_starred });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PROJECT STAGES & STAGE-TASKS (TASK-LEVEL CONTROLLERS)
// -------------------------------------------------------------

app.post('/api/projects/:id/stages', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Stage title is required' });

    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const nextOrder = (project.stages?.length || 0) + 1;
    project.stages.push({
      title: title.trim(),
      order_index: nextOrder,
      is_completed: false,
      tasks: []
    });

    await project.save();
    res.status(201).json({ message: 'Stage added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:id/stages/:stageId/tasks', async (req, res) => {
  try {
    const { title, assignee, due_date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    let totalTasksCount = 0;
    project.stages.forEach((s) => {
      totalTasksCount += s.tasks?.length || 0;
    });

    const taskKey = `${project.ticket_key}-T${totalTasksCount + 1}`;

    stage.tasks.push({
      ticket_key: taskKey,
      title: title.trim(),
      is_completed: false,
      assignee: assignee || project.assignee,
      due_date: due_date || project.due_date,
      is_urgent: project.is_urgent,
      is_important: project.is_important,
      priority_quadrant: project.priority_quadrant,
      priority: project.priority,
      is_timer_allowed: true,
      order_index: (stage.tasks?.length || 0) + 1
    });

    stage.is_completed = false;
    project.status = 'Active';

    await project.save();
    res.status(201).json({ message: 'Stage task created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id/stages/:stageId/tasks/:taskId', async (req, res) => {
  try {
    const { is_completed, user_name = 'User' } = req.body;
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const task = stage.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.is_completed = is_completed;
    task.completed_at = is_completed ? new Date() : null;

    if (is_completed && task.is_timer_running) {
      task.is_timer_running = false;
      task.timer_started_at = null;
    }

    // Check if stage is completed
    const stageDone = stage.tasks.length > 0 && stage.tasks.every((t) => t.is_completed);
    stage.is_completed = stageDone;

    // Check if whole project is completed
    let allProjectTasks = [];
    project.stages.forEach((s) => {
      if (s.tasks) allProjectTasks.push(...s.tasks);
    });

    const projectDone = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.is_completed);
    if (projectDone) {
      project.status = 'Completed';
      project.completed_at = new Date();
    } else if (project.status === 'Completed') {
      project.status = 'In Progress';
      project.completed_at = null;
    }

    await project.save();

    await AuditLog.create({
      task_id: project._id,
      ticket_key: project.ticket_key,
      task_title: project.title,
      orbita_type: project.orbita_type,
      workspace: project.workspace,
      user_name,
      action: 'Project Task Checklist',
      details: `Marked task "${task.title}" as ${is_completed ? 'Completed' : 'Pending'}`
    });

    res.json({
      message: 'Stage task updated',
      is_stage_completed: stageDone,
      is_project_completed: projectDone
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stage task
app.delete('/api/projects/:id/stages/:stageId/tasks/:taskId', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    stage.tasks.pull(req.params.taskId);
    await project.save();

    res.json({ message: 'Stage task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stage
app.delete('/api/projects/:id/stages/:stageId', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.stages.pull(req.params.stageId);
    await project.save();

    res.json({ message: 'Stage deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// FOCUS TIMER & TIME SESSIONS (TASK & STAGE-TASK LEVEL)
// -------------------------------------------------------------

// Start timer on item
app.post('/api/tasks/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    // Check if any other item or stage task is running
    const running = await Task.findOne({ is_timer_running: true });
    if (running && running._id.toString() !== task._id.toString()) {
      return res.status(400).json({ error: `Focus timer already running on ${running.ticket_key}: ${running.title}` });
    }

    task.is_timer_running = true;
    task.timer_started_at = new Date();
    if (task.status === 'Active') task.status = 'In Progress';
    await task.save();

    await TimeSession.create({
      task_id: task._id,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      tags: task.tags,
      user_name: req.body.user_name || 'User',
      start_time: new Date(),
      notes: `${task.orbita_type} Focus Session`
    });

    res.json({ message: 'Focus timer started', started_at: task.timer_started_at.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop timer on item
app.post('/api/tasks/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    const openSession = await TimeSession.findOne({ task_id: task._id, end_time: null }).sort({ _id: -1 });
    const now = new Date();

    let durationSeconds = 0;
    const start = openSession ? openSession.start_time : (task.timer_started_at || now);
    durationSeconds = Math.max(1, Math.floor((now.getTime() - new Date(start).getTime()) / 1000));

    if (openSession) {
      openSession.end_time = now;
      openSession.duration_seconds = durationSeconds;
      openSession.notes = req.body.notes || `${task.orbita_type} Deep Focus Session`;
      await openSession.save();
    }

    const durationHours = Math.round((durationSeconds / 3600) * 100) / 100;
    task.is_timer_running = false;
    task.timer_started_at = null;
    task.actual_hours = Math.round(((task.actual_hours || 0) + durationHours) * 100) / 100;
    await task.save();

    await AuditLog.create({
      task_id: task._id,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      user_name: req.body.user_name || 'User',
      action: 'Focus Session Completed',
      details: `Logged ${durationHours}h focus session (${durationSeconds}s)`
    });

    res.json({
      message: 'Focus timer stopped',
      duration_hours: durationHours,
      duration_seconds: durationSeconds,
      total_actual_hours: task.actual_hours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start timer on specific Stage-Task
app.post('/api/projects/:id/stages/:stageId/tasks/:taskId/timer/start', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const stageTask = stage.tasks.id(req.params.taskId);
    if (!stageTask) return res.status(404).json({ error: 'Task not found' });

    // Mark running
    stageTask.is_timer_running = true;
    stageTask.timer_started_at = new Date();
    project.is_timer_running = true;
    project.timer_started_at = stageTask.timer_started_at;

    if (project.status === 'Active') project.status = 'In Progress';
    await project.save();

    await TimeSession.create({
      task_id: project._id,
      stage_task_id: stageTask._id.toString(),
      ticket_key: stageTask.ticket_key || project.ticket_key,
      task_title: `${stageTask.title} (${project.title})`,
      orbita_type: 'Project',
      workspace: project.workspace,
      tags: project.tags,
      user_name: req.body.user_name || 'User',
      start_time: new Date(),
      notes: `Stage Task Focus: ${stageTask.title}`
    });

    res.json({ message: 'Task focus timer started', started_at: stageTask.timer_started_at.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop timer on specific Stage-Task
app.post('/api/projects/:id/stages/:stageId/tasks/:taskId/timer/stop', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const stageTask = stage.tasks.id(req.params.taskId);
    if (!stageTask) return res.status(404).json({ error: 'Task not found' });

    const openSession = await TimeSession.findOne({
      task_id: project._id,
      stage_task_id: stageTask._id.toString(),
      end_time: null
    }).sort({ _id: -1 });

    const now = new Date();
    const start = openSession ? openSession.start_time : (stageTask.timer_started_at || now);
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - new Date(start).getTime()) / 1000));
    const durationHours = Math.round((durationSeconds / 3600) * 100) / 100;

    if (openSession) {
      openSession.end_time = now;
      openSession.duration_seconds = durationSeconds;
      openSession.notes = req.body.notes || `Task Focus: ${stageTask.title}`;
      await openSession.save();
    }

    stageTask.is_timer_running = false;
    stageTask.timer_started_at = null;
    stageTask.actual_hours = Math.round(((stageTask.actual_hours || 0) + durationHours) * 100) / 100;

    project.is_timer_running = false;
    project.timer_started_at = null;
    project.actual_hours = Math.round(((project.actual_hours || 0) + durationHours) * 100) / 100;

    await project.save();

    await AuditLog.create({
      task_id: project._id,
      ticket_key: stageTask.ticket_key || project.ticket_key,
      task_title: stageTask.title,
      orbita_type: 'Project',
      workspace: project.workspace,
      user_name: req.body.user_name || 'User',
      action: 'Task Focus Session Completed',
      details: `Logged ${durationHours}h focus on "${stageTask.title}" (${durationSeconds}s)`
    });

    res.json({
      message: 'Task focus timer stopped',
      duration_hours: durationHours,
      duration_seconds: durationSeconds,
      task_actual_hours: stageTask.actual_hours,
      project_actual_hours: project.actual_hours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Timesheets
app.get('/api/timesheets', async (req, res) => {
  try {
    const sessions = await TimeSession.find().sort({ _id: -1 });
    const formatted = sessions.map((s) => ({
      ...s.toObject(),
      id: s._id.toString(),
      task_id: s.task_id?.toString()
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// EISENHOWER PRIORITY MATRIX (Q1 - Q4) WITH STAGE-TASKS
// -------------------------------------------------------------

app.get('/api/matrix', async (req, res) => {
  try {
    const { workspace } = req.query;
    const query = { status: { $ne: 'Completed' } };
    if (workspace && workspace !== 'All') {
      query.workspace = new RegExp(`^${workspace}$`, 'i');
    }

    const activeTasks = await Task.find(query).sort({ _id: -1 });

    const matrixItems = [];

    activeTasks.forEach((doc) => {
      const t = doc.toObject();
      t.id = t._id.toString();

      // Top level item (Task, Routine, Goal, or whole Project)
      if (t.orbita_type !== 'Project') {
        matrixItems.push(t);
      } else {
        // For Projects: include individual active stage tasks!
        if (t.stages && t.stages.length > 0) {
          t.stages.forEach((st) => {
            if (st.tasks) {
              st.tasks.forEach((subT) => {
                if (!subT.is_completed) {
                  matrixItems.push({
                    id: subT._id?.toString(),
                    parent_project_id: t.id,
                    parent_stage_id: st._id?.toString(),
                    is_stage_task: true,
                    ticket_key: subT.ticket_key || t.ticket_key,
                    orbita_type: 'Project',
                    project_title: t.title,
                    stage_title: st.title,
                    title: `${subT.title} (${t.title})`,
                    workspace: t.workspace,
                    tags: t.tags,
                    is_urgent: subT.is_urgent !== undefined ? subT.is_urgent : t.is_urgent,
                    is_important: subT.is_important !== undefined ? subT.is_important : t.is_important,
                    priority_quadrant: subT.priority_quadrant || t.priority_quadrant,
                    priority: subT.priority || t.priority,
                    status: 'Active',
                    assignee: subT.assignee || t.assignee,
                    due_date: subT.due_date || t.due_date,
                    is_timer_allowed: true,
                    is_timer_running: Boolean(subT.is_timer_running),
                    timer_started_at: subT.timer_started_at,
                    actual_hours: subT.actual_hours || 0,
                    is_starred: t.is_starred
                  });
                }
              });
            }
          });
        } else {
          matrixItems.push(t);
        }
      }
    });

    const matrix = {
      Q1: matrixItems.filter((t) => t.priority_quadrant === 'Q1'),
      Q2: matrixItems.filter((t) => t.priority_quadrant === 'Q2'),
      Q3: matrixItems.filter((t) => t.priority_quadrant === 'Q3'),
      Q4: matrixItems.filter((t) => t.priority_quadrant === 'Q4')
    };

    res.json(matrix);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MONTHLY HIGHLIGHTS & SCORECARD
// -------------------------------------------------------------

app.get('/api/highlights/month', async (req, res) => {
  try {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const total = await Task.countDocuments();
    const completed = await Task.countDocuments({ status: 'Completed' });
    const tasksDone = await Task.countDocuments({ orbita_type: 'Task', status: 'Completed' });
    const routinesDone = await Task.countDocuments({ orbita_type: 'Routine', status: 'Completed' });
    const goalsDone = await Task.countDocuments({ orbita_type: 'Goal', status: 'Completed' });
    const projectsDone = await Task.countDocuments({ orbita_type: 'Project', status: 'Completed' });

    const totalHoursAgg = await Task.aggregate([
      { $group: { _id: null, total: { $sum: '$actual_hours' } } }
    ]);
    const focusHours = Math.round((totalHoursAgg[0]?.total || 0) * 10) / 10;

    const starredCompleted = await Task.find({ is_starred: true, status: 'Completed' }).sort({ completed_at: -1 });

    const badges = [
      { id: 'task_finisher', title: 'Task Finisher', desc: 'Completed single-action tasks', earned: tasksDone > 0, color: 'var(--accent-green)' },
      { id: 'routine_master', title: 'Routine Master', desc: 'Completed recurring routine tasks', earned: routinesDone > 0, color: 'var(--accent-purple)' },
      { id: 'goal_achiever', title: 'Goal Achiever', desc: 'Completed ongoing focus goals', earned: goalsDone > 0, color: 'var(--accent-amber)' },
      { id: 'project_champion', title: 'Project Champion', desc: 'Delivered multi-stage structured projects', earned: projectsDone > 0, color: 'var(--accent-blue)' },
      { id: 'deep_work', title: 'Deep Work Hero', desc: 'Logged deep focus timer sessions', earned: focusHours >= 2.0, color: 'var(--accent-pink)' }
    ];

    res.json({
      month: currentMonth,
      scorecard: {
        total_items: total,
        total_completed: completed,
        tasks_completed: tasksDone,
        routines_completed: routinesDone,
        goals_completed: goalsDone,
        projects_completed: projectsDone,
        focus_hours: focusHours,
        starred_count: starredCompleted.length,
        achievement_score: total > 0 ? `${Math.min(10, Math.round(((completed / total) * 10) * 10) / 10)}/10` : '0/10'
      },
      starred_items: starredCompleted.map((t) => ({ ...t.toObject(), id: t._id.toString() })),
      badges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DASHBOARD STATS
// -------------------------------------------------------------

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { workspace } = req.query;
    const query = {};
    if (workspace && workspace !== 'All') {
      query.workspace = new RegExp(`^${workspace}$`, 'i');
    }

    const total = await Task.countDocuments(query);
    const completed = await Task.countDocuments({ ...query, status: 'Completed' });
    const tasksCount = await Task.countDocuments({ ...query, orbita_type: 'Task' });
    const routinesCount = await Task.countDocuments({ ...query, orbita_type: 'Routine' });
    const goalsCount = await Task.countDocuments({ ...query, orbita_type: 'Goal' });
    const projectsCount = await Task.countDocuments({ ...query, orbita_type: 'Project' });

    const totalHoursAgg = await Task.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$actual_hours' } } }
    ]);
    const totalHours = Math.round((totalHoursAgg[0]?.total || 0) * 10) / 10;
    const starredCount = await Task.countDocuments({ ...query, is_starred: true });

    const todayStr = new Date().toISOString().substring(0, 10);
    const dueToday = await Task.countDocuments({
      ...query,
      status: { $ne: 'Completed' },
      $or: [{ due_date: todayStr }, { scheduled_date: todayStr }]
    });

    const recent = await Task.find(query).sort({ _id: -1 }).limit(6);

    res.json({
      total_tasks: total,
      completed_tasks: completed,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      tasks_count: tasksCount,
      routines_count: routinesCount,
      goals_count: goalsCount,
      projects_count: projectsCount,
      total_hours_logged: totalHours,
      starred_count: starredCount,
      due_today: dueToday,
      recent_tasks: recent.map((t) => ({ ...t.toObject(), id: t._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------

app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ _id: -1 }).limit(150);
    const formatted = logs.map((l) => ({
      ...l.toObject(),
      id: l._id.toString(),
      task_id: l.task_id?.toString()
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Orbita MERN API Server running on port ${PORT}`);
});
