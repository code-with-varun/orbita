import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import {
  connectDb,
  User,
  Task,
  TimeSession,
  AuditLog,
  Subscription,
  Warranty,
  Credential,
  Contact,
  cleanResetDatabase
} from './db.js';
import {
  encryptPassword,
  decryptPassword,
  hashCyberFingerprint
} from './cryptoUtils.js';
import XLSX from 'xlsx';

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
// SUPERADMIN COMMAND CENTER & GOVERNANCE
// -------------------------------------------------------------

app.get('/api/admin/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const membersCount = await User.countDocuments({ role: 'Member' });
    const adminCount = await User.countDocuments({ role: 'Admin' });
    const superadminCount = await User.countDocuments({ role: 'Superadmin' });

    const totalTasks = await Task.countDocuments();
    const tasksCount = await Task.countDocuments({ orbita_type: 'Task' });
    const routinesCount = await Task.countDocuments({ orbita_type: 'Routine' });
    const goalsCount = await Task.countDocuments({ orbita_type: 'Goal' });
    const projectsCount = await Task.countDocuments({ orbita_type: 'Project' });

    const totalSessions = await TimeSession.countDocuments();
    const sessions = await TimeSession.find();
    const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    const totalFocusHours = Math.round((totalSeconds / 3600) * 100) / 100;

    const totalAuditLogs = await AuditLog.countDocuments();
    const activeTimers = await Task.countDocuments({ is_timer_running: true });

    const totalSubscriptions = await Subscription.countDocuments();
    const totalWarranties = await Warranty.countDocuments();
    const totalCredentials = await Credential.countDocuments();
    const totalContacts = await Contact.countDocuments();

    res.json({
      system_health: 'Optimal',
      database_status: 'Connected (MongoDB Atlas)',
      database_name: 'orbita',
      users: {
        total: totalUsers,
        member: membersCount,
        admin: adminCount,
        superadmin: superadminCount
      },
      work_items: {
        total: totalTasks,
        tasks: tasksCount,
        routines: routinesCount,
        goals: goalsCount,
        projects: projectsCount
      },
      effort: {
        total_sessions: totalSessions,
        total_focus_hours: totalFocusHours,
        active_running_timers: activeTimers
      },
      assets_and_vault: {
        subscriptions: totalSubscriptions,
        warranties: totalWarranties,
        credentials: totalCredentials,
        contacts: totalContacts
      },
      governance: {
        total_audit_logs: totalAuditLogs
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const enriched = await Promise.all(
      users.map(async (u) => {
        const uidStr = u._id.toString();
        const taskCount = await Task.countDocuments({
          $or: [{ user_id: uidStr }, { user_email: u.email }, { created_by: u.name }]
        });
        const sessions = await TimeSession.find({
          $or: [{ user_id: uidStr }, { user_email: u.email }, { user_name: u.name }]
        });
        const totalSecs = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

        return {
          id: uidStr,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          task_count: taskCount,
          logged_hours: Math.round((totalSecs / 3600) * 100) / 100
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id/role', async (req, res) => {
  try {
    const { role, updated_by } = req.body;
    if (!['Member', 'Admin', 'Superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const prevRole = user.role;
    user.role = role;
    await user.save();

    await AuditLog.create({
      user_id: user._id.toString(),
      user_email: user.email,
      user_name: updated_by || 'Super Admin',
      action: 'User Role Updated',
      details: `Changed role for user ${user.email} from ${prevRole} to ${role}`
    });

    res.json({ message: 'User role updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { updated_by } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.email.toLowerCase() === 'superadmin@orbita.com') {
      return res.status(400).json({ error: 'Primary Superadmin account cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user_name: updated_by || 'Super Admin',
      action: 'User Account Deleted',
      details: `Deleted user account: ${user.name} (${user.email})`
    });

    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/backups/dump', async (req, res) => {
  try {
    const users = await User.find({}, '-password_hash');
    const tasks = await Task.find();
    const sessions = await TimeSession.find();
    const logs = await AuditLog.find();

    res.json({
      backup_timestamp: new Date().toISOString(),
      platform: 'Orbita Work Management Platform',
      provider: 'Runit Infotech',
      database: 'orbita (MongoDB Atlas)',
      record_counts: {
        users: users.length,
        work_items: tasks.length,
        focus_sessions: sessions.length,
        audit_logs: logs.length
      },
      data: {
        users,
        work_items: tasks,
        focus_sessions: sessions,
        audit_logs: logs
      }
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

// Password Reset / Change Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, current_password, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (new_password.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // If current_password is provided, verify it against existing password
    if (current_password !== undefined && current_password !== null && current_password !== '') {
      if (user.password_hash !== current_password.trim()) {
        return res.status(401).json({ error: 'Current password does not match' });
      }
    }

    user.password_hash = new_password.trim();
    await user.save();

    await AuditLog.create({
      user_id: user._id,
      user_email: user.email,
      user_name: user.name,
      action: 'Password Reset',
      details: `Password was successfully updated for ${user.email}`
    });

    res.json({ message: 'Password has been successfully updated. You can now use your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { user_id, email, current_password, new_password } = req.body;
    if ((!user_id && !email) || !new_password) {
      return res.status(400).json({ error: 'User identifier and new password are required' });
    }

    if (new_password.trim().length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    let user = null;
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      user = await User.findById(user_id);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (current_password !== undefined && current_password !== null && current_password !== '') {
      if (user.password_hash !== current_password.trim()) {
        return res.status(401).json({ error: 'Current password does not match' });
      }
    }

    user.password_hash = new_password.trim();
    await user.save();

    await AuditLog.create({
      user_id: user._id,
      user_email: user.email,
      user_name: user.name,
      action: 'Password Change',
      details: `Password changed for user ${user.name} (${user.email})`
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to construct user-specific filter for exports across all tables
function getExportFilter(req) {
  const { user_id, user_email, user_role, user_name, scope } = req.query;

  // Superadmin global dump if scope=all
  if (user_role === 'Superadmin' && scope === 'all') {
    return {};
  }

  const conditions = [];
  if (user_id && user_id !== 'undefined' && user_id !== 'null' && user_id !== '') {
    conditions.push({ user_id });
    if (mongoose.Types.ObjectId.isValid(user_id)) {
      conditions.push({ user_id: new mongoose.Types.ObjectId(user_id) });
    }
  }
  if (user_email && user_email !== 'undefined' && user_email !== 'null' && user_email !== '') {
    const cleanEmail = user_email.toLowerCase().trim();
    conditions.push({ user_email: new RegExp(`^${cleanEmail}$`, 'i') });
  }
  if (user_name && user_name !== 'undefined' && user_name !== 'null' && user_name !== '') {
    const cleanName = user_name.trim();
    const nameRegex = new RegExp(`^${cleanName}$`, 'i');
    conditions.push({ created_by: nameRegex });
    conditions.push({ assignee: nameRegex });
    conditions.push({ user_name: nameRegex });
  }

  if (conditions.length > 0) {
    return { $or: conditions };
  }
  return {};
}

// -------------------------------------------------------------
// USER DATA DUMP & EXCEL EXPORT (MULTI-SHEET WORKBOOK)
// -------------------------------------------------------------

// 1. Data summary API for Profile Settings preview
app.get('/api/user/export-data', async (req, res) => {
  try {
    const filter = getExportFilter(req);
    const { user_id, user_email, user_name, user_role } = req.query;

    let userDoc = null;
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      userDoc = await User.findById(user_id);
    }
    if (!userDoc && user_email) {
      userDoc = await User.findOne({ email: user_email.toLowerCase().trim() });
    }

    const [
      tasksCount,
      routinesCount,
      goalsCount,
      projectsCount,
      sessionsCount,
      subscriptionsCount,
      warrantiesCount,
      credentialsCount,
      contactsCount,
      auditLogsCount
    ] = await Promise.all([
      Task.countDocuments({ ...filter, orbita_type: 'Task' }),
      Task.countDocuments({ ...filter, orbita_type: 'Routine' }),
      Task.countDocuments({ ...filter, orbita_type: 'Goal' }),
      Task.countDocuments({ ...filter, orbita_type: 'Project' }),
      TimeSession.countDocuments(filter),
      Subscription.countDocuments(filter),
      Warranty.countDocuments(filter),
      Credential.countDocuments(filter),
      Contact.countDocuments(filter),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      user: {
        id: userDoc?._id || user_id,
        name: userDoc?.name || user_name,
        email: userDoc?.email || user_email,
        role: userDoc?.role || user_role || 'Member',
        createdAt: userDoc?.createdAt || null
      },
      counts: {
        tasks: tasksCount,
        routines: routinesCount,
        goals: goalsCount,
        projects: projectsCount,
        total_work_items: tasksCount + routinesCount + goalsCount + projectsCount,
        focus_sessions: sessionsCount,
        subscriptions: subscriptionsCount,
        warranties: warrantiesCount,
        credentials: credentialsCount,
        contacts: contactsCount,
        audit_logs: auditLogsCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to auto-format worksheet column widths
function createWorksheetWithWidths(data) {
  if (!data || data.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Status: 'No records found for current user' }]);
    ws['!cols'] = [{ wch: 45 }];
    return ws;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(data.length, 300); i++) {
      const val = data[i][key];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
  });
  ws['!cols'] = colWidths;
  return ws;
}

// 2. Multi-Sheet Excel File Export Endpoint
app.get('/api/user/export-excel', async (req, res) => {
  try {
    const filter = getExportFilter(req);
    const { user_id, user_email, user_name, user_role } = req.query;

    let userDoc = null;
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      userDoc = await User.findById(user_id);
    }
    if (!userDoc && user_email) {
      userDoc = await User.findOne({ email: user_email.toLowerCase().trim() });
    }

    // Parallel fetch across all tables
    const [
      tasks,
      sessions,
      subscriptions,
      warranties,
      credentials,
      contacts,
      auditLogs
    ] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }),
      TimeSession.find(filter).sort({ start_time: -1 }),
      Subscription.find(filter).sort({ renewal_date: 1 }),
      Warranty.find(filter).sort({ expiry_date: 1 }),
      Credential.find(filter).sort({ site_or_app: 1 }),
      Contact.find(filter).sort({ mobile_name: 1 }),
      AuditLog.find(filter).sort({ createdAt: -1 }).limit(500)
    ]);

    // 1. Table 1: Profile Details Sheet
    const profileData = [
      {
        'User ID': userDoc?._id ? userDoc._id.toString() : (user_id || 'N/A'),
        'Full Name': userDoc?.name || user_name || 'User',
        'Email Address': userDoc?.email || user_email || 'N/A',
        'Role': userDoc?.role || user_role || 'Member',
        'Account Created': userDoc?.createdAt ? new Date(userDoc.createdAt).toISOString().replace('T', ' ').substring(0, 19) : 'N/A',
        'Export Timestamp': new Date().toISOString().replace('T', ' ').substring(0, 19),
        'Exported By': 'Orbita Work Management Platform (Runit Infotech)'
      }
    ];

    // 2. Table 2: Work Items (Tasks, Routines, Goals, Projects)
    const tasksData = tasks.map((t) => ({
      'Ticket Key': t.ticket_key,
      'Work Item Type': t.orbita_type,
      'Workspace': t.workspace || 'Personal',
      'Title': t.title,
      'Description': t.description || '',
      'Status': t.status,
      'Priority': t.priority,
      'Priority Quadrant': t.priority_quadrant,
      'Assignee': t.assignee || 'Unassigned',
      'Scheduled Date': t.scheduled_date || '',
      'Due Date': t.due_date || '',
      'Completed Date': t.completed_at ? new Date(t.completed_at).toISOString().replace('T', ' ').substring(0, 19) : '',
      'Target Hours': t.target_hours || 0,
      'Estimated Hours': t.estimated_hours || 0,
      'Actual Hours Logged': t.actual_hours || 0,
      'Recurrence Type': t.recurrence_type || 'None',
      'Recurrence Interval': t.recurrence_interval || 1,
      'Recurrence Day': t.recurrence_day || '',
      'Starred': t.is_starred ? 'Yes' : 'No',
      'Tags': t.tags || '',
      'Notes': t.notes || '',
      'Created By': t.created_by || '',
      'Created Date': t.createdAt ? new Date(t.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
    }));

    // 3. Table 3: Project Stages & Subtasks (Nested Project items)
    const projectStagesData = [];
    tasks.filter((t) => t.orbita_type === 'Project' && Array.isArray(t.stages)).forEach((p) => {
      p.stages.forEach((st, stIdx) => {
        if (Array.isArray(st.tasks) && st.tasks.length > 0) {
          st.tasks.forEach((subT, subIdx) => {
            projectStagesData.push({
              'Project Ticket': p.ticket_key,
              'Project Title': p.title,
              'Stage Order': stIdx + 1,
              'Stage Title': st.title,
              'Stage Completed': st.is_completed ? 'Yes' : 'No',
              'Subtask Ticket': subT.ticket_key || `${p.ticket_key}-S${stIdx + 1}.${subIdx + 1}`,
              'Subtask Title': subT.title,
              'Subtask Assignee': subT.assignee || 'Unassigned',
              'Subtask Status': subT.is_completed ? 'Completed' : 'Pending',
              'Due Date': subT.due_date || '',
              'Priority': subT.priority || 'High',
              'Priority Quadrant': subT.priority_quadrant || 'Q2',
              'Actual Hours': subT.actual_hours || 0,
              'Completed At': subT.completed_at ? new Date(subT.completed_at).toISOString().replace('T', ' ').substring(0, 19) : ''
            });
          });
        } else {
          projectStagesData.push({
            'Project Ticket': p.ticket_key,
            'Project Title': p.title,
            'Stage Order': stIdx + 1,
            'Stage Title': st.title,
            'Stage Completed': st.is_completed ? 'Yes' : 'No',
            'Subtask Ticket': 'N/A',
            'Subtask Title': '(Empty stage - No subtasks)',
            'Subtask Assignee': '',
            'Subtask Status': '',
            'Due Date': '',
            'Priority': '',
            'Priority Quadrant': '',
            'Actual Hours': 0,
            'Completed At': ''
          });
        }
      });
    });

    // 4. Table 4: Focus & Time Tracking Sessions
    const sessionsData = sessions.map((s) => ({
      'Ticket Key': s.ticket_key || '',
      'Task Title': s.task_title || '',
      'Type': s.orbita_type || 'Task',
      'Workspace': s.workspace || 'Personal',
      'Tags': s.tags || '',
      'User Name': s.user_name || '',
      'Start Time': s.start_time ? new Date(s.start_time).toISOString().replace('T', ' ').substring(0, 19) : '',
      'End Time': s.end_time ? new Date(s.end_time).toISOString().replace('T', ' ').substring(0, 19) : 'In Progress',
      'Duration (Seconds)': s.duration_seconds || 0,
      'Duration (Hours)': s.duration_seconds ? Math.round((s.duration_seconds / 3600) * 100) / 100 : 0,
      'Notes': s.notes || ''
    }));

    // 5. Table 5: Subscriptions
    const subscriptionsData = subscriptions.map((sub) => ({
      'Application / Service': sub.app_name,
      'Website / URL': sub.site,
      'Workspace': sub.workspace || 'Personal',
      'Category': sub.category || 'SaaS / Tools',
      'Cost': sub.cost,
      'Currency': sub.currency || 'USD',
      'Billing Cycle': sub.billing_cycle || 'Monthly',
      'Status': sub.status,
      'Auto Renew': sub.auto_renew ? 'Yes' : 'No',
      'Start Date': sub.start_date || '',
      'Renewal Date': sub.renewal_date || '',
      'Expiry Date': sub.expiry_date || '',
      'Payment Method': sub.payment_method || 'Credit Card',
      'Past Billing Cycles Count': (sub.past_billing_cycles || []).length,
      'Notes': sub.notes || '',
      'Created Date': sub.createdAt ? new Date(sub.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
    }));

    // 6. Table 6: Past Billing Cycles
    const billingCyclesData = [];
    subscriptions.forEach((sub) => {
      if (Array.isArray(sub.past_billing_cycles) && sub.past_billing_cycles.length > 0) {
        sub.past_billing_cycles.forEach((cycle) => {
          billingCyclesData.push({
            'Application / Service': sub.app_name,
            'Cycle Date': cycle.cycle_date,
            'Amount Paid': cycle.amount_paid || 0,
            'Currency': cycle.currency || sub.currency || 'USD',
            'Period Start': cycle.period_start || '',
            'Period End': cycle.period_end || '',
            'Payment Method': cycle.payment_method || sub.payment_method || 'Credit Card',
            'Status': cycle.status || 'Paid',
            'Invoice Number': cycle.invoice_number || '',
            'Cycle Notes': cycle.notes || '',
            'Recorded At': cycle.createdAt ? new Date(cycle.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
          });
        });
      }
    });

    // 7. Table 7: Product Warranties
    const warrantiesData = warranties.map((w) => ({
      'Product Name': w.product_name,
      'Workspace': w.workspace || 'Personal',
      'Category': w.category || 'Electronics',
      'Cost Paid': w.cost_paid,
      'Number of Warranties': w.number_of_warranties || 1,
      'Condition': w.condition,
      'Purchase Date': w.purchase_date || '',
      'Expiry Date': w.expiry_date || '',
      'Status': w.status,
      'Warranty Provider': w.warranty_provider || '',
      'Serial Number': w.serial_number || '',
      'Invoice Number': w.invoice_number || '',
      'Notes': w.notes || '',
      'Created Date': w.createdAt ? new Date(w.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
    }));

    // 8. Table 8: Credential Vault (With safely decrypted passwords for user recovery)
    const credentialsData = credentials.map((c) => {
      let plainPass = '';
      try {
        plainPass = decryptPassword(c.encrypted_password, c.password_iv, c.password_tag, c.cyber_code);
      } catch (err) {
        plainPass = '[Decryption Failed]';
      }
      return {
        'Site or Application': c.site_or_app,
        'Workspace': c.workspace || 'Personal',
        'Category': c.category || 'General',
        'URL / Login Link': c.url || '',
        'Registered Email': c.registered_email || '',
        'Username / User ID': c.user_id_name || '',
        'Decrypted Password': plainPass,
        'Cyber Code Fingerprint': c.cyber_code || '',
        'MFA Tool': c.mfa_tool || 'None',
        'MFA Configuration': c.mfa_details || '',
        'Notes': c.notes || '',
        'Created Date': c.createdAt ? new Date(c.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
      };
    });

    // 9. Table 9: Contact Directory
    const contactsData = contacts.map((c) => ({
      'Contact Name': c.mobile_name,
      'Primary Phone Number': c.mobile_number,
      'Secondary Phone': c.secondary_number || '',
      'Primary Email': c.mail_id || '',
      'Secondary Email': c.secondary_email || '',
      'Company': c.company || '',
      'Job Title': c.job_title || '',
      'Workspace': c.workspace || 'Personal',
      'LinkedIn': c.social_ids?.linkedin || '',
      'Twitter / X': c.social_ids?.twitter || '',
      'GitHub': c.social_ids?.github || '',
      'Instagram': c.social_ids?.instagram || '',
      'WhatsApp': c.social_ids?.whatsapp || '',
      'Other Social': c.social_ids?.other || '',
      'Tags': Array.isArray(c.tags) ? c.tags.join(', ') : '',
      'Context Notes': c.context_notes || '',
      'Google Synced': c.google_synced ? 'Yes' : 'No',
      'Created Date': c.createdAt ? new Date(c.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
    }));

    // 10. Table 10: Activity & Audit Logs
    const auditLogsData = auditLogs.map((a) => ({
      'Timestamp': a.createdAt ? new Date(a.createdAt).toISOString().replace('T', ' ').substring(0, 19) : '',
      'Action': a.action,
      'User Name': a.user_name || '',
      'Ticket Key': a.ticket_key || '',
      'Item Title': a.task_title || '',
      'Workspace': a.workspace || '',
      'Details': a.details || ''
    }));

    // Build Excel Workbook
    const wb = XLSX.utils.book_new();

    const sheetsToAppend = [
      { name: 'Profile Details', data: profileData },
      { name: 'Work Items (Tasks)', data: tasksData },
      { name: 'Project Stages & Tasks', data: projectStagesData },
      { name: 'Focus & Time Sessions', data: sessionsData },
      { name: 'Subscriptions', data: subscriptionsData },
      { name: 'Past Billing Cycles', data: billingCyclesData },
      { name: 'Product Warranties', data: warrantiesData },
      { name: 'Credential Vault', data: credentialsData },
      { name: 'Contact Directory', data: contactsData },
      { name: 'Activity & Audit Logs', data: auditLogsData }
    ];

    sheetsToAppend.forEach((sheet) => {
      const ws = createWorksheetWithWidths(sheet.data);
      // Sheet names in Excel cannot exceed 31 chars
      const safeSheetName = sheet.name.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    // Write binary buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Sanitize user name for filename
    const safeName = (userDoc?.name || user_name || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Orbita_UserData_${safeName}_${dateStr}.xlsx`;

    // Audit log this export
    await AuditLog.create({
      user_id: userDoc?._id,
      user_email: userDoc?.email || user_email,
      user_name: userDoc?.name || user_name || 'User',
      action: 'Data Export (Excel)',
      details: `User exported all personal data table-wise into an Excel sheet (${sheetsToAppend.length} tables/sheets).`
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('Error in export-excel endpoint:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// WORK ITEMS (TASK | ROUTINE | GOAL | PROJECT)
// -------------------------------------------------------------

function buildUserFilter(req, entityType = 'task') {
  const { user_id, user_email, user_role, user_name } = req.query;

  // Superadmin has global visibility
  if (user_role === 'Superadmin') {
    return {};
  }

  const conditions = [];
  if (user_id && user_id !== 'undefined' && user_id !== 'null' && user_id !== '') {
    conditions.push({ user_id });
    if (mongoose.Types.ObjectId.isValid(user_id)) {
      conditions.push({ user_id: new mongoose.Types.ObjectId(user_id) });
    }
  }
  if (user_email && user_email !== 'undefined' && user_email !== 'null' && user_email !== '') {
    const cleanEmail = user_email.toLowerCase().trim();
    conditions.push({ user_email: new RegExp(`^${cleanEmail}$`, 'i') });
  }
  if (user_name && user_name !== 'undefined' && user_name !== 'null' && user_name !== '') {
    const cleanName = user_name.trim();
    const nameRegex = new RegExp(`^${cleanName}$`, 'i');
    if (entityType === 'task') {
      conditions.push({ created_by: nameRegex });
      conditions.push({ assignee: nameRegex });
    } else {
      conditions.push({ user_name: nameRegex });
      conditions.push({ created_by: nameRegex });
    }
  }

  if (conditions.length > 0) {
    return { $or: conditions };
  }
  return {};
}

// Helper to generate unique sequential ticket keys with zero collision
async function getNextTicketKey(prefix = 'TSK') {
  const latest = await Task.findOne({ ticket_key: new RegExp(`^${prefix}-\\d+$`) }).sort({ _id: -1 });
  let nextNum = 1;
  if (latest && latest.ticket_key) {
    const parts = latest.ticket_key.split('-');
    if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
      nextNum = parseInt(parts[1], 10) + 1;
    }
  }
  while (await Task.findOne({ ticket_key: `${prefix}-${String(nextNum).padStart(3, '0')}` })) {
    nextNum++;
  }
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

function formatTaskResponse(taskDoc) {
  if (!taskDoc) return null;
  const resObj = taskDoc.toObject ? taskDoc.toObject() : { ...taskDoc };
  resObj.id = resObj._id ? resObj._id.toString() : resObj.id;
  if (Array.isArray(resObj.stages)) {
    resObj.stages = resObj.stages.map((st) => {
      const stObj = st.toObject ? st.toObject() : { ...st };
      stObj.id = stObj._id ? stObj._id.toString() : stObj.id;
      if (Array.isArray(stObj.tasks)) {
        stObj.tasks = stObj.tasks.map((subT) => {
          const subObj = subT.toObject ? subT.toObject() : { ...subT };
          subObj.id = subObj._id ? subObj._id.toString() : subObj.id;
          return subObj;
        });
      }
      return stObj;
    });
  }
  return resObj;
}

// -------------------------------------------------------------
// ROUTINE AUTO-OCCURRENCE ENGINE
// Automatically evaluates recurring routines and creates actionable
// task instances up to 2 days in advance without duplicates.
// -------------------------------------------------------------
async function generateRoutineOccurrences(userFilter = {}) {
  try {
    const routineQuery = { orbita_type: 'Routine', status: { $ne: 'Completed' }, ...userFilter };
    const routines = await Task.find(routineQuery);
    if (!routines || routines.length === 0) return;

    // Date range: 7 days ago to 2 days in advance (inclusive)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datesToCheck = [];
    for (let offset = -7; offset <= 2; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      datesToCheck.push(d);
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const routine of routines) {
      const recType = (routine.recurrence_type || 'Daily').toLowerCase();
      const interval = Math.max(1, routine.recurrence_interval || 1);
      const recDay = (routine.recurrence_day || '').trim().toLowerCase();
      const createdDate = new Date(routine.createdAt || today);
      createdDate.setHours(0, 0, 0, 0);

      for (const d of datesToCheck) {
        const dateStr = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        let isMatch = false;

        if (recType === 'daily') {
          if (recDay === 'weekdays' || recDay.includes('weekday') || recDay.includes('workday')) {
            isMatch = d.getDay() >= 1 && d.getDay() <= 5;
          } else if (recDay === 'weekends' || recDay.includes('weekend')) {
            isMatch = d.getDay() === 0 || d.getDay() === 6;
          } else if (interval === 1) {
            isMatch = true;
          } else {
            const diffDays = Math.floor((d.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays % interval === 0) {
              isMatch = true;
            }
          }
        } else if (recType === 'weekly') {
          const dayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
          const dayFull = dayNames[d.getDay()].toLowerCase();
          const dayIndexStr = String(d.getDay()); // 0 = Sun, 1 = Mon, ..., 6 = Sat

          let dayMatches = false;
          if (!recDay) {
            const creationDayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][createdDate.getDay()];
            dayMatches = dayShort === creationDayShort;
          } else if (recDay.includes('weekday')) {
            dayMatches = d.getDay() >= 1 && d.getDay() <= 5;
          } else if (recDay.includes('weekend')) {
            dayMatches = d.getDay() === 0 || d.getDay() === 6;
          } else {
            const selectedDays = recDay.split(',').map((s) => s.trim().toLowerCase());
            dayMatches = selectedDays.some((s) =>
              s === dayIndexStr ||
              s === dayShort ||
              s === dayFull ||
              dayFull.startsWith(s) ||
              dayShort.startsWith(s) ||
              s.includes(`(${dayIndexStr})`) ||
              s.startsWith(dayIndexStr)
            );
          }

          if (dayMatches) {
            if (interval === 1) {
              isMatch = true;
            } else {
              const diffWeeks = Math.floor((d.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
              if (diffWeeks >= 0 && diffWeeks % interval === 0) {
                isMatch = true;
              }
            }
          }
        } else if (recType === 'monthly' || recType === 'monthday' || recType === 'month + day') {
          let dayMatches = false;
          const lastDayOfCurMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

          if (recDay === 'last' || recDay === 'last_day' || recDay.includes('last day')) {
            dayMatches = d.getDate() === lastDayOfCurMonth;
          } else if (recDay.startsWith('ordinal_')) {
            // e.g. ordinal_1_sat (1st Saturday) or ordinal_last_sun (last Sunday)
            const parts = recDay.split('_');
            const pos = parts[1]; // 1, 2, 3, 4, or last
            const targetWeekday = parts[2]?.toLowerCase();
            const dayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
            const dayFull = dayNames[d.getDay()].toLowerCase();
            const dayIndexStr = String(d.getDay());

            const weekdayMatches =
              targetWeekday === dayShort ||
              targetWeekday === dayFull ||
              targetWeekday === dayIndexStr ||
              dayFull.startsWith(targetWeekday || '') ||
              dayShort.startsWith(targetWeekday || '');

            if (weekdayMatches) {
              if (pos === 'last') {
                dayMatches = d.getDate() + 7 > lastDayOfCurMonth;
              } else {
                const nth = Math.floor((d.getDate() - 1) / 7) + 1;
                dayMatches = String(nth) === pos;
              }
            }
          } else {
            const targetDayNum = parseInt(recDay, 10);
            if (!isNaN(targetDayNum)) {
              // 31st (or 29th/30th) automatically clamps to last day of shorter months (e.g. Feb 28/29, Apr 30)
              dayMatches = d.getDate() === Math.min(targetDayNum, lastDayOfCurMonth);
            } else {
              dayMatches = d.getDate() === Math.min(createdDate.getDate(), lastDayOfCurMonth);
            }
          }

          if (dayMatches) {
            if (interval === 1) {
              isMatch = true;
            } else {
              const diffMonths = (d.getFullYear() - createdDate.getFullYear()) * 12 + (d.getMonth() - createdDate.getMonth());
              if (diffMonths >= 0 && diffMonths % interval === 0) {
                isMatch = true;
              }
            }
          }
        } else if (recType === 'yearly') {
          let monthMatches = false;
          let dayMatches = false;

          if (recDay.includes('-') || recDay.includes('/')) {
            const separator = recDay.includes('-') ? '-' : '/';
            const parts = recDay.split(separator);
            const targetMonth = parseInt(parts[0], 10) - 1; // 0-indexed (0 = Jan)
            const targetDay = parseInt(parts[1], 10);
            monthMatches = d.getMonth() === targetMonth;

            // Clamping to last day of target month (e.g. Feb 29 on non-leap year or Apr 31)
            const daysInTargetMonth = new Date(d.getFullYear(), targetMonth + 1, 0).getDate();
            const clampedDay = Math.min(targetDay, daysInTargetMonth);
            dayMatches = d.getDate() === clampedDay;
          } else {
            monthMatches = d.getMonth() === createdDate.getMonth();
            const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const clampedDay = Math.min(createdDate.getDate(), daysInTargetMonth);
            dayMatches = d.getDate() === clampedDay;
          }

          if (monthMatches && dayMatches) {
            if (interval === 1) {
              isMatch = true;
            } else {
              const diffYears = d.getFullYear() - createdDate.getFullYear();
              if (diffYears >= 0 && diffYears % interval === 0) {
                isMatch = true;
              }
            }
          }
        }

        if (isMatch) {
          // Check if an occurrence task already exists for this routine and date
          const existing = await Task.findOne({
            routine_id: routine._id,
            routine_occurrence_date: dateStr
          });

          if (!existing) {
            // Generate distinct collision-free ticket key
            const ticket_key = await getNextTicketKey('TSK');

            await Task.create({
              ticket_key,
              orbita_type: 'Task',
              routine_id: routine._id,
              routine_occurrence_date: dateStr,
              title: routine.title,
              description: routine.description || `Routine occurrence for ${dateStr} (${routine.recurrence_type || 'Daily'})`,
              tags: routine.tags ? `${routine.tags}, Routine` : 'Routine',
              workspace: routine.workspace || 'Personal',
              priority_quadrant: routine.priority_quadrant || 'Q3',
              priority: routine.priority || 'Medium',
              status: 'Active',
              assignee: routine.assignee || 'Unassigned',
              user_id: routine.user_id,
              user_email: routine.user_email,
              created_by: routine.created_by || 'User',
              scheduled_date: dateStr,
              due_date: dateStr,
              is_urgent: routine.is_urgent || false,
              is_important: routine.is_important || false,
              is_timer_allowed: false,
              is_starred: false,
              notes: routine.notes || ''
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error generating routine occurrences:', err);
  }
}

app.get('/api/tasks', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'task');
    // Ensure pending routine tasks up to 2 days ahead are generated
    await generateRoutineOccurrences(userFilter);

    const { orbita_type, workspace, priority_quadrant, status, search, is_starred } = req.query;
    const query = { ...userFilter };

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
            id: st._id?.toString() || st.id,
            tasks: (st.tasks || []).map((t) => ({
              ...t,
              id: t._id?.toString() || t.id
            })),
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
          id: st._id?.toString() || st.id,
          tasks: (st.tasks || []).map((t) => ({
            ...t,
            id: t._id?.toString() || t.id
          })),
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

    const ticket_key = await getNextTicketKey(prefix);

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
      user_id: req.body.user_id || null,
      user_email: req.body.user_email ? req.body.user_email.toLowerCase().trim() : null,
      created_by: created_by || req.body.user_name || 'User',
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
      user_id: task.user_id,
      user_email: task.user_email,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      user_name: created_by || req.body.user_name || 'User',
      action: `${orbita_type} Created`,
      details: `Created ${ticket_key}: ${title} (${workspace} • ${orbita_type})`
    });

    if (orbita_type === 'Routine') {
      await generateRoutineOccurrences({ _id: task._id });
    }

    res.status(201).json(formatTaskResponse(task));
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
    if (updates.recurrence_type !== undefined) task.recurrence_type = updates.recurrence_type;
    if (updates.recurrence_interval !== undefined) task.recurrence_interval = parseInt(updates.recurrence_interval) || 1;
    if (updates.recurrence_day !== undefined) task.recurrence_day = updates.recurrence_day;

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
      if (updates.priority === 'Critical') {
        task.priority_quadrant = 'Q1';
        task.is_urgent = true;
        task.is_important = true;
      } else if (updates.priority === 'High') {
        task.priority_quadrant = 'Q2';
        task.is_urgent = false;
        task.is_important = true;
      } else if (updates.priority === 'Medium') {
        task.priority_quadrant = 'Q3';
        task.is_urgent = true;
        task.is_important = false;
      } else if (updates.priority === 'Low') {
        task.priority_quadrant = 'Q4';
        task.is_urgent = false;
        task.is_important = false;
      }
    }

    if (updates.priority_quadrant !== undefined) {
      task.priority_quadrant = updates.priority_quadrant;
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

    if (task.orbita_type === 'Routine') {
      await generateRoutineOccurrences({ _id: task._id });
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

    res.json(formatTaskResponse(project));
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

// Flat stage task endpoints for direct manipulation
app.post('/api/stages/:stageId/tasks', async (req, res) => {
  try {
    const { title, assignee, due_date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

    const project = await Task.findOne({ 'stages._id': req.params.stageId });
    if (!project) return res.status(404).json({ error: 'Stage / Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    let totalTasksCount = 0;
    project.stages.forEach((s) => {
      totalTasksCount += s.tasks?.length || 0;
    });

    stage.tasks.push({
      ticket_key: `${project.ticket_key}-T${totalTasksCount + 1}`,
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
    res.status(201).json(formatTaskResponse(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stage-tasks/:taskId', async (req, res) => {
  try {
    const project = await Task.findOne({ 'stages.tasks._id': req.params.taskId });
    if (!project) return res.status(404).json({ error: 'Stage task not found' });

    let targetStage = null;
    let targetTask = null;

    for (const st of project.stages) {
      const found = st.tasks.id(req.params.taskId);
      if (found) {
        targetStage = st;
        targetTask = found;
        break;
      }
    }

    if (!targetTask) return res.status(404).json({ error: 'Task not found' });

    const { is_completed, title, assignee, due_date } = req.body;
    if (is_completed !== undefined) {
      targetTask.is_completed = Boolean(is_completed);
      targetTask.completed_at = is_completed ? new Date() : null;
    }
    if (title !== undefined) targetTask.title = title.trim();
    if (assignee !== undefined) targetTask.assignee = assignee;
    if (due_date !== undefined) targetTask.due_date = due_date;

    targetStage.is_completed = targetStage.tasks.every((t) => t.is_completed);
    let allProjectTasks = [];
    project.stages.forEach((s) => {
      if (s.tasks) allProjectTasks.push(...s.tasks);
    });
    project.status = allProjectTasks.every((t) => t.is_completed) ? 'Completed' : 'Active';

    await project.save();
    res.json(formatTaskResponse(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stage-tasks/:taskId', async (req, res) => {
  try {
    const project = await Task.findOne({ 'stages.tasks._id': req.params.taskId });
    if (!project) return res.status(404).json({ error: 'Stage task not found' });

    for (const st of project.stages) {
      const found = st.tasks.id(req.params.taskId);
      if (found) {
        st.tasks.pull(req.params.taskId);
        break;
      }
    }

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

// Helper to auto-stop any currently running timer across the entire system
async function autoStopAnyRunningTimer(exceptTaskId = null, exceptStageTaskId = null) {
  const runningTasks = await Task.find({ is_timer_running: true });
  for (const t of runningTasks) {
    let modified = false;
    const now = new Date();

    // Check main task timer
    if (t.timer_started_at && t._id.toString() !== exceptTaskId?.toString()) {
      const startMs = new Date(t.timer_started_at).getTime();
      const elapsed = Math.max(1, Math.floor((now.getTime() - startMs) / 1000));
      const totalSec = (t.timer_accumulated_seconds || 0) + elapsed;
      const totalHours = Math.round((totalSec / 3600) * 100) / 100;
      t.actual_hours = Math.round(((t.actual_hours || 0) + totalHours) * 100) / 100;
      t.is_timer_running = false;
      t.is_timer_paused = false;
      t.timer_started_at = null;
      t.timer_accumulated_seconds = 0;
      modified = true;

      const openSession = await TimeSession.findOne({ task_id: t._id, end_time: null }).sort({ _id: -1 });
      if (openSession) {
        openSession.end_time = now;
        openSession.duration_seconds = totalSec;
        openSession.notes = `${t.orbita_type} Focus Session (Auto-stopped)`;
        if (!openSession.user_id && t.user_id) openSession.user_id = t.user_id;
        if (!openSession.user_email && t.user_email) openSession.user_email = t.user_email;
        await openSession.save();
      }
    }

    // Check stage tasks in this project
    if (t.stages) {
      for (const st of t.stages) {
        for (const subT of (st.tasks || [])) {
          if (subT.is_timer_running && subT._id.toString() !== exceptStageTaskId?.toString()) {
            const startMs = new Date(subT.timer_started_at || now).getTime();
            const elapsed = Math.max(1, Math.floor((now.getTime() - startMs) / 1000));
            const totalSec = (subT.timer_accumulated_seconds || 0) + elapsed;
            const totalHours = Math.round((totalSec / 3600) * 100) / 100;
            subT.actual_hours = Math.round(((subT.actual_hours || 0) + totalHours) * 100) / 100;
            subT.is_timer_running = false;
            subT.is_timer_paused = false;
            subT.timer_started_at = null;
            subT.timer_accumulated_seconds = 0;
            modified = true;

            const openSession = await TimeSession.findOne({
              task_id: t._id,
              stage_task_id: subT._id.toString(),
              end_time: null
            }).sort({ _id: -1 });

            if (openSession) {
              openSession.end_time = now;
              openSession.duration_seconds = totalSec;
              openSession.notes = `Task Focus: ${subT.title} (Auto-stopped)`;
              if (!openSession.user_id && t.user_id) openSession.user_id = t.user_id;
              if (!openSession.user_email && t.user_email) openSession.user_email = t.user_email;
              await openSession.save();
            }
          }
        }
      }
    }

    if (modified) {
      t.is_timer_running = false;
      t.is_timer_paused = false;
      t.timer_started_at = null;
      t.timer_accumulated_seconds = 0;
      await t.save();
    }
  }
}

// 1. Start timer on item
app.post('/api/tasks/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    // Auto-stop any existing running timer
    await autoStopAnyRunningTimer(task._id.toString());

    task.is_timer_running = true;
    task.is_timer_paused = false;
    task.timer_started_at = new Date();
    task.timer_accumulated_seconds = 0;
    if (task.status === 'Active') task.status = 'In Progress';
    await task.save();

    await TimeSession.create({
      task_id: task._id,
      user_id: task.user_id || req.body.user_id || null,
      user_email: task.user_email || req.body.user_email || null,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      tags: task.tags,
      user_name: req.body.user_name || task.created_by || 'User',
      start_time: new Date(),
      notes: `${task.orbita_type} Focus Session`
    });

    res.json({
      message: 'Focus timer started',
      started_at: task.timer_started_at.toISOString(),
      accumulated_seconds: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Pause timer on item
app.post('/api/tasks/:id/timer/pause', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    if (!task.is_timer_running) {
      return res.status(400).json({ error: 'Timer is not currently running' });
    }

    const now = new Date();
    const start = task.timer_started_at || now;
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(start).getTime()) / 1000));
    task.timer_accumulated_seconds = (task.timer_accumulated_seconds || 0) + elapsedSeconds;
    task.is_timer_running = false;
    task.is_timer_paused = true;
    task.timer_started_at = null;
    await task.save();

    res.json({
      message: 'Focus timer paused',
      accumulated_seconds: task.timer_accumulated_seconds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Resume timer on item
app.post('/api/tasks/:id/timer/resume', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    // Auto-stop any other running timer
    await autoStopAnyRunningTimer(task._id.toString());

    task.is_timer_running = true;
    task.is_timer_paused = false;
    task.timer_started_at = new Date();
    await task.save();

    res.json({
      message: 'Focus timer resumed',
      started_at: task.timer_started_at.toISOString(),
      accumulated_seconds: task.timer_accumulated_seconds || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Stop timer on item
app.post('/api/tasks/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Item not found' });

    const openSession = await TimeSession.findOne({ task_id: task._id, end_time: null }).sort({ _id: -1 });
    const now = new Date();

    let additionalSeconds = 0;
    if (task.is_timer_running && task.timer_started_at) {
      additionalSeconds = Math.max(0, Math.floor((now.getTime() - new Date(task.timer_started_at).getTime()) / 1000));
    }

    const totalSeconds = Math.max(1, (task.timer_accumulated_seconds || 0) + additionalSeconds);
    const durationHours = Math.round((totalSeconds / 3600) * 100) / 100;

    if (openSession) {
      openSession.end_time = now;
      openSession.duration_seconds = totalSeconds;
      openSession.notes = req.body.notes || `${task.orbita_type} Deep Focus Session`;
      if (!openSession.user_id && (task.user_id || req.body.user_id)) {
        openSession.user_id = task.user_id || req.body.user_id;
      }
      if (!openSession.user_email && (task.user_email || req.body.user_email)) {
        openSession.user_email = task.user_email || req.body.user_email;
      }
      await openSession.save();
    }

    task.is_timer_running = false;
    task.is_timer_paused = false;
    task.timer_started_at = null;
    task.timer_accumulated_seconds = 0;
    task.actual_hours = Math.round(((task.actual_hours || 0) + durationHours) * 100) / 100;
    await task.save();

    // Ensure all running timers across all goals and tasks are stopped
    await autoStopAnyRunningTimer();

    await AuditLog.create({
      task_id: task._id,
      user_id: task.user_id || req.body.user_id || null,
      user_email: task.user_email || req.body.user_email || null,
      ticket_key: task.ticket_key,
      task_title: task.title,
      orbita_type: task.orbita_type,
      workspace: task.workspace,
      user_name: req.body.user_name || task.created_by || 'User',
      action: 'Focus Session Completed',
      details: `Logged ${durationHours}h focus session (${totalSeconds}s)`
    });

    res.json({
      message: 'Focus timer stopped',
      duration_hours: durationHours,
      duration_seconds: totalSeconds,
      total_actual_hours: task.actual_hours
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Start timer on specific Stage-Task
app.post('/api/projects/:id/stages/:stageId/tasks/:taskId/timer/start', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const stageTask = stage.tasks.id(req.params.taskId);
    if (!stageTask) return res.status(404).json({ error: 'Task not found' });

    // Auto-stop any running timer
    await autoStopAnyRunningTimer(project._id.toString(), stageTask._id.toString());

    stageTask.is_timer_running = true;
    stageTask.is_timer_paused = false;
    stageTask.timer_started_at = new Date();
    stageTask.timer_accumulated_seconds = 0;

    project.is_timer_running = true;
    project.is_timer_paused = false;
    project.timer_started_at = stageTask.timer_started_at;
    project.timer_accumulated_seconds = 0;

    if (project.status === 'Active') project.status = 'In Progress';
    await project.save();

    await TimeSession.create({
      task_id: project._id,
      user_id: project.user_id || req.body.user_id || null,
      user_email: project.user_email || req.body.user_email || null,
      stage_task_id: stageTask._id.toString(),
      ticket_key: stageTask.ticket_key || project.ticket_key,
      task_title: `${stageTask.title} (${project.title})`,
      orbita_type: 'Project',
      workspace: project.workspace,
      tags: project.tags,
      user_name: req.body.user_name || project.created_by || 'User',
      start_time: new Date(),
      notes: `Stage Task Focus: ${stageTask.title}`
    });

    res.json({
      message: 'Task focus timer started',
      started_at: stageTask.timer_started_at.toISOString(),
      accumulated_seconds: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Pause timer on specific Stage-Task
app.post('/api/projects/:id/stages/:stageId/tasks/:taskId/timer/pause', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const stageTask = stage.tasks.id(req.params.taskId);
    if (!stageTask) return res.status(404).json({ error: 'Task not found' });

    const now = new Date();
    const start = stageTask.timer_started_at || now;
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(start).getTime()) / 1000));

    stageTask.timer_accumulated_seconds = (stageTask.timer_accumulated_seconds || 0) + elapsedSeconds;
    stageTask.is_timer_running = false;
    stageTask.is_timer_paused = true;
    stageTask.timer_started_at = null;

    project.is_timer_running = false;
    project.is_timer_paused = true;
    project.timer_started_at = null;
    project.timer_accumulated_seconds = stageTask.timer_accumulated_seconds;

    await project.save();

    res.json({
      message: 'Task focus timer paused',
      accumulated_seconds: stageTask.timer_accumulated_seconds
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Resume timer on specific Stage-Task
app.post('/api/projects/:id/stages/:stageId/tasks/:taskId/timer/resume', async (req, res) => {
  try {
    const project = await Task.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stage = project.stages.id(req.params.stageId);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const stageTask = stage.tasks.id(req.params.taskId);
    if (!stageTask) return res.status(404).json({ error: 'Task not found' });

    // Auto-stop any running timer
    await autoStopAnyRunningTimer(project._id.toString(), stageTask._id.toString());

    stageTask.is_timer_running = true;
    stageTask.is_timer_paused = false;
    stageTask.timer_started_at = new Date();

    project.is_timer_running = true;
    project.is_timer_paused = false;
    project.timer_started_at = stageTask.timer_started_at;

    await project.save();

    res.json({
      message: 'Task focus timer resumed',
      started_at: stageTask.timer_started_at.toISOString(),
      accumulated_seconds: stageTask.timer_accumulated_seconds || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Stop timer on specific Stage-Task
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
    let additionalSeconds = 0;
    if (stageTask.is_timer_running && stageTask.timer_started_at) {
      additionalSeconds = Math.max(0, Math.floor((now.getTime() - new Date(stageTask.timer_started_at).getTime()) / 1000));
    }

    const totalSeconds = Math.max(1, (stageTask.timer_accumulated_seconds || 0) + additionalSeconds);
    const durationHours = Math.round((totalSeconds / 3600) * 100) / 100;

    if (openSession) {
      openSession.end_time = now;
      openSession.duration_seconds = totalSeconds;
      openSession.notes = req.body.notes || `Task Focus: ${stageTask.title}`;
      if (!openSession.user_id && (project.user_id || req.body.user_id)) {
        openSession.user_id = project.user_id || req.body.user_id;
      }
      if (!openSession.user_email && (project.user_email || req.body.user_email)) {
        openSession.user_email = project.user_email || req.body.user_email;
      }
      await openSession.save();
    }

    stageTask.is_timer_running = false;
    stageTask.is_timer_paused = false;
    stageTask.timer_started_at = null;
    stageTask.timer_accumulated_seconds = 0;
    stageTask.actual_hours = Math.round(((stageTask.actual_hours || 0) + durationHours) * 100) / 100;

    project.is_timer_running = false;
    project.is_timer_paused = false;
    project.timer_started_at = null;
    project.timer_accumulated_seconds = 0;
    project.actual_hours = Math.round(((project.actual_hours || 0) + durationHours) * 100) / 100;

    await project.save();

    // Ensure all running timers across the system are stopped
    await autoStopAnyRunningTimer();

    await AuditLog.create({
      task_id: project._id,
      user_id: project.user_id || req.body.user_id || null,
      user_email: project.user_email || req.body.user_email || null,
      ticket_key: stageTask.ticket_key || project.ticket_key,
      task_title: stageTask.title,
      orbita_type: 'Project',
      workspace: project.workspace,
      user_name: req.body.user_name || project.created_by || 'User',
      action: 'Task Focus Session Completed',
      details: `Logged ${durationHours}h focus on "${stageTask.title}" (${totalSeconds}s)`
    });

    res.json({
      message: 'Task focus timer stopped',
      duration_hours: durationHours,
      duration_seconds: totalSeconds,
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
    const userFilter = buildUserFilter(req, 'session');
    const sessions = await TimeSession.find(userFilter).sort({ _id: -1 });
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

// Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'audit');
    const logs = await AuditLog.find(userFilter).sort({ _id: -1 }).limit(300);
    const formatted = logs.map((l) => ({
      ...l.toObject(),
      id: l._id.toString(),
      created_at: l.createdAt
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Highlights & Achievements
app.get('/api/highlights/month', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'task');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allItems = await Task.find(userFilter);
    const completedThisMonth = allItems.filter(
      (t) => t.status === 'Completed' && t.completed_at && new Date(t.completed_at) >= startOfMonth
    );
    const starredItems = allItems.filter((t) => t.is_starred);
    const starredCompleted = starredItems.filter((t) => t.status === 'Completed');
    const starredActive = starredItems.filter((t) => t.status !== 'Completed');

    const sessionFilter = buildUserFilter(req, 'session');
    const sessions = await TimeSession.find(sessionFilter);
    const sessionsThisMonth = sessions.filter((s) => new Date(s.start_time) >= startOfMonth);
    const totalFocusSeconds = sessionsThisMonth.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
    const totalFocusHours = Math.round((totalFocusSeconds / 3600) * 100) / 100;

    const projectsCompleted = completedThisMonth.filter((t) => t.orbita_type === 'Project').length;
    const routinesKept = completedThisMonth.filter((t) => t.routine_id || t.orbita_type === 'Routine').length;
    const goalsTracked = allItems.filter((t) => t.orbita_type === 'Goal' && (t.actual_hours || 0) > 0).length;

    const achievementScore = completedThisMonth.length * 10 + Math.round(totalFocusHours * 5) + starredItems.length * 15;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const badges = [];
    if (totalFocusHours >= 10) {
      badges.push({ id: 'b1', title: 'Deep Work Champion', description: 'Logged 10+ hours of focused deep work', icon: 'Clock' });
    }
    if (completedThisMonth.length >= 5) {
      badges.push({ id: 'b2', title: 'Execution Machine', description: 'Completed 5+ work items this month', icon: 'CheckCircle2' });
    }
    if (projectsCompleted >= 1) {
      badges.push({ id: 'b3', title: 'Project Shipper', description: 'Successfully delivered a structured project', icon: 'FolderGit2' });
    }
    if (starredItems.length >= 1) {
      badges.push({ id: 'b4', title: 'Priority Master', description: 'Maintained high focus on starred items', icon: 'Star' });
    }

    res.json({
      month: monthStr,
      scorecard: {
        achievement_score: achievementScore,
        total_completed: completedThisMonth.length,
        projects_completed: projectsCompleted,
        routines_kept: routinesKept,
        focus_hours: totalFocusHours,
        goals_tracked: goalsTracked,
        starred_count: starredItems.length,
        starred_completed_count: starredCompleted.length,
        starred_active_count: starredActive.length
      },
      starred_items: starredItems.map((t) => ({ ...t.toObject(), id: t._id.toString() })),
      badges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger Routine Generation Endpoint
app.post('/api/routines/generate', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'task');
    await generateRoutineOccurrences(userFilter);
    res.json({ message: 'Routines evaluated and occurrences created up to 2 days in advance.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// EISENHOWER PRIORITY MATRIX (Q1 - Q4) WITH STAGE-TASKS
// -------------------------------------------------------------

app.get('/api/matrix', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'task');
    await generateRoutineOccurrences(userFilter);

    const { workspace } = req.query;
    const query = { ...userFilter, orbita_type: { $ne: 'Routine' }, status: { $ne: 'Completed' } };
    if (workspace && workspace !== 'All') {
      query.workspace = new RegExp(`^${workspace}$`, 'i');
    }

    const activeTasks = await Task.find(query).sort({ _id: -1 });

    const matrixItems = [];

    activeTasks.forEach((doc) => {
      const t = doc.toObject();
      t.id = t._id.toString();

      // Top level item (Task, Goal, or whole Project)
      if (t.orbita_type !== 'Project' && t.orbita_type !== 'Routine') {
        matrixItems.push(t);
      } else if (t.orbita_type === 'Project') {
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
// DASHBOARD STATS
// -------------------------------------------------------------

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const userFilter = buildUserFilter(req, 'task');
    await generateRoutineOccurrences(userFilter);

    const { workspace } = req.query;
    const query = { ...userFilter };
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
    const userFilter = buildUserFilter(req, 'audit');
    const logs = await AuditLog.find(userFilter).sort({ _id: -1 }).limit(150);
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

// Helper for asset filters (Subscriptions, Warranties, Credentials, Contacts)
function buildAssetUserFilter(req) {
  const { user_id, user_email, user_role, workspace } = req.query;
  const filter = {};

  if (workspace && workspace !== 'All') {
    filter.workspace = workspace;
  }

  if (user_role === 'Superadmin') {
    return filter;
  }

  const conditions = [];
  if (user_id && user_id !== 'undefined' && user_id !== 'null' && user_id !== '') {
    conditions.push({ user_id });
    if (mongoose.Types.ObjectId.isValid(user_id)) {
      conditions.push({ user_id: new mongoose.Types.ObjectId(user_id) });
    }
  }
  if (user_email && user_email !== 'undefined' && user_email !== 'null' && user_email !== '') {
    const cleanEmail = user_email.toLowerCase().trim();
    conditions.push({ user_email: new RegExp(`^${cleanEmail}$`, 'i') });
  }

  if (conditions.length > 0) {
    filter.$or = conditions;
  }

  return filter;
}

// -------------------------------------------------------------
// 1. SUBSCRIPTION MANAGER ENDPOINTS
// -------------------------------------------------------------

app.get('/api/subscriptions', async (req, res) => {
  try {
    const filter = buildAssetUserFilter(req);
    const { search, status, category } = req.query;

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { site: sRegex },
          { app_name: sRegex },
          { category: sRegex },
          { notes: sRegex }
        ]
      });
    }

    const subscriptions = await Subscription.find(filter).sort({ renewal_date: 1, expiry_date: 1 });
    const formatted = subscriptions.map((sub) => ({
      ...sub.toObject(),
      id: sub._id.toString(),
      past_cycles_count: sub.past_billing_cycles?.length || 0
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subscriptions/:id', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    res.json({
      ...sub.toObject(),
      id: sub._id.toString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const {
      site,
      app_name,
      category,
      cost,
      currency,
      billing_cycle,
      start_date,
      expiry_date,
      renewal_date,
      auto_renew,
      payment_method,
      notes,
      workspace,
      user_id,
      user_email,
      user_name,
      initial_cycle
    } = req.body;

    if (!site || !app_name || !expiry_date || !renewal_date) {
      return res.status(400).json({ error: 'Site, app name, expiry date and renewal date are required' });
    }

    const past_billing_cycles = [];
    if (initial_cycle && initial_cycle.cycle_date) {
      past_billing_cycles.push({
        cycle_date: initial_cycle.cycle_date,
        amount_paid: Number(initial_cycle.amount_paid || cost || 0),
        currency: currency || 'USD',
        invoice_number: initial_cycle.invoice_number || '',
        period_start: initial_cycle.period_start || start_date || '',
        period_end: initial_cycle.period_end || expiry_date || '',
        payment_method: payment_method || 'Credit Card',
        status: initial_cycle.status || 'Paid',
        notes: initial_cycle.notes || 'Initial subscription billing record'
      });
    }

    const subscription = new Subscription({
      site,
      app_name,
      category: category || 'SaaS / Tools',
      cost: Number(cost || 0),
      currency: currency || 'USD',
      billing_cycle: billing_cycle || 'Monthly',
      start_date: start_date || '',
      expiry_date,
      renewal_date,
      auto_renew: auto_renew !== undefined ? Boolean(auto_renew) : true,
      payment_method: payment_method || 'Credit Card',
      notes: notes || '',
      workspace: workspace || 'Personal',
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || '',
      past_billing_cycles
    });

    await subscription.save();

    await AuditLog.create({
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || '',
      user_name: user_name || 'User',
      action: 'Create Subscription',
      details: `Added subscription for ${app_name} on ${site} (${currency || 'USD'} ${cost} / ${billing_cycle || 'Monthly'})`
    });

    res.status(201).json({
      ...subscription.toObject(),
      id: subscription._id.toString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/subscriptions/:id', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const fields = [
      'site', 'app_name', 'category', 'cost', 'currency', 'billing_cycle',
      'start_date', 'expiry_date', 'renewal_date', 'auto_renew', 'status',
      'payment_method', 'notes', 'workspace'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) sub[f] = req.body[f];
    });
    sub.updatedAt = new Date();

    await sub.save();

    await AuditLog.create({
      user_name: req.body.user_name || 'User',
      action: 'Update Subscription',
      details: `Updated subscription: ${sub.app_name} (${sub.site})`
    });

    res.json({ ...sub.toObject(), id: sub._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    await AuditLog.create({
      user_name: req.query.user_name || 'User',
      action: 'Delete Subscription',
      details: `Removed subscription for ${sub.app_name} (${sub.site})`
    });

    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscriptions/:id/billing-cycles', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const {
      cycle_date,
      amount_paid,
      currency,
      invoice_number,
      period_start,
      period_end,
      payment_method,
      status,
      notes,
      next_renewal_date,
      next_expiry_date,
      user_name
    } = req.body;

    if (!cycle_date) {
      return res.status(400).json({ error: 'Cycle date is required' });
    }

    const newCycle = {
      cycle_date,
      amount_paid: Number(amount_paid || sub.cost || 0),
      currency: currency || sub.currency || 'USD',
      invoice_number: invoice_number || '',
      period_start: period_start || '',
      period_end: period_end || '',
      payment_method: payment_method || sub.payment_method || 'Credit Card',
      status: status || 'Paid',
      notes: notes || ''
    };

    sub.past_billing_cycles.unshift(newCycle);

    if (next_renewal_date) sub.renewal_date = next_renewal_date;
    if (next_expiry_date) sub.expiry_date = next_expiry_date;
    sub.updatedAt = new Date();

    await sub.save();

    await AuditLog.create({
      user_name: user_name || 'User',
      action: 'Log Billing Cycle',
      details: `Recorded billing cycle for ${sub.app_name}: ${newCycle.currency} ${newCycle.amount_paid} on ${cycle_date}`
    });

    res.status(201).json({
      ...sub.toObject(),
      id: sub._id.toString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subscriptions/:id/billing-cycles/:cycleId', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    sub.past_billing_cycles = sub.past_billing_cycles.filter(
      (c) => c._id.toString() !== req.params.cycleId
    );
    sub.updatedAt = new Date();
    await sub.save();

    res.json({ ...sub.toObject(), id: sub._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. WARRANTY MANAGER ENDPOINTS
// -------------------------------------------------------------

app.get('/api/warranties', async (req, res) => {
  try {
    const filter = buildAssetUserFilter(req);
    const { search, condition, status, category } = req.query;

    if (condition && condition !== 'All') {
      filter.condition = condition;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { product_name: sRegex },
          { category: sRegex },
          { serial_number: sRegex },
          { warranty_provider: sRegex },
          { invoice_number: sRegex },
          { notes: sRegex }
        ]
      });
    }

    const warranties = await Warranty.find(filter).sort({ expiry_date: 1 });
    const formatted = warranties.map((w) => ({
      ...w.toObject(),
      id: w._id.toString()
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/warranties/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });
    res.json({ ...warranty.toObject(), id: warranty._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warranties', async (req, res) => {
  try {
    const {
      product_name,
      category,
      cost_paid,
      number_of_warranties,
      expiry_date,
      purchase_date,
      condition,
      warranty_provider,
      serial_number,
      invoice_number,
      status,
      notes,
      workspace,
      user_id,
      user_email,
      user_name
    } = req.body;

    if (!product_name || !expiry_date) {
      return res.status(400).json({ error: 'Product name and expiry date are required' });
    }

    const validConditions = [
      'Refurbished condition',
      'Active condition',
      'Beyond repair condition',
      'Bad condition'
    ];
    const conditionValue = validConditions.includes(condition) ? condition : 'Active condition';

    const warranty = new Warranty({
      product_name,
      category: category || 'Electronics',
      cost_paid: Number(cost_paid || 0),
      number_of_warranties: Number(number_of_warranties || 1),
      expiry_date,
      purchase_date: purchase_date || '',
      condition: conditionValue,
      warranty_provider: warranty_provider || '',
      serial_number: serial_number || '',
      invoice_number: invoice_number || '',
      status: status || 'Under Warranty',
      notes: notes || '',
      workspace: workspace || 'Personal',
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || ''
    });

    await warranty.save();

    await AuditLog.create({
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || '',
      user_name: user_name || 'User',
      action: 'Create Warranty',
      details: `Registered warranty for ${product_name} (${conditionValue}, paid: $${cost_paid || 0}, expires: ${expiry_date})`
    });

    res.status(201).json({ ...warranty.toObject(), id: warranty._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/warranties/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    const fields = [
      'product_name', 'category', 'cost_paid', 'number_of_warranties',
      'expiry_date', 'purchase_date', 'condition', 'warranty_provider',
      'serial_number', 'invoice_number', 'status', 'notes', 'workspace'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) warranty[f] = req.body[f];
    });
    warranty.updatedAt = new Date();

    await warranty.save();

    await AuditLog.create({
      user_name: req.body.user_name || 'User',
      action: 'Update Warranty',
      details: `Updated warranty for ${warranty.product_name} (${warranty.condition})`
    });

    res.json({ ...warranty.toObject(), id: warranty._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/warranties/:id', async (req, res) => {
  try {
    const warranty = await Warranty.findByIdAndDelete(req.params.id);
    if (!warranty) return res.status(404).json({ error: 'Warranty not found' });

    await AuditLog.create({
      user_name: req.query.user_name || 'User',
      action: 'Delete Warranty',
      details: `Removed warranty record for ${warranty.product_name}`
    });

    res.json({ message: 'Warranty deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. MASTER CREDENTIAL MANAGER & REVEAL ENDPOINTS
// -------------------------------------------------------------

app.get('/api/credentials', async (req, res) => {
  try {
    const filter = buildAssetUserFilter(req);
    const { search, mfa_tool, category } = req.query;

    if (mfa_tool && mfa_tool !== 'All') {
      filter.mfa_tool = mfa_tool;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { site_or_app: sRegex },
          { registered_email: sRegex },
          { mobile_number: sRegex },
          { user_id_name: sRegex },
          { mfa_tool: sRegex },
          { category: sRegex },
          { notes: sRegex }
        ]
      });
    }

    // Exclude plaintext and raw crypto tag/iv from standard list for maximum cyber security
    const credentials = await Credential.find(filter).sort({ site_or_app: 1 });

    const safeList = credentials.map((c) => ({
      id: c._id.toString(),
      site_or_app: c.site_or_app,
      category: c.category || 'General',
      url: c.url || '',
      registered_email: c.registered_email || '',
      mobile_number: c.mobile_number || '',
      user_id_name: c.user_id_name || '',
      password_masked: '••••••••••••',
      has_password: Boolean(c.encrypted_password),
      cyber_encrypted: true,
      cyber_code_hash: hashCyberFingerprint(c.encrypted_password),
      mfa_tool: c.mfa_tool || 'None',
      mfa_details: c.mfa_details || '',
      workspace: c.workspace || 'Personal',
      notes: c.notes || '',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(safeList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/credentials', async (req, res) => {
  try {
    const {
      site_or_app,
      category,
      url,
      registered_email,
      mobile_number,
      user_id_name,
      password,
      mfa_tool,
      mfa_details,
      notes,
      workspace,
      user_id,
      user_email,
      user_name
    } = req.body;

    if (!site_or_app) {
      return res.status(400).json({ error: 'Site or application name is required' });
    }

    // Encrypt password using AES-256 cyber code
    const cryptoResult = encryptPassword(password || '');

    const credential = new Credential({
      site_or_app,
      category: category || 'General',
      url: url || '',
      registered_email: registered_email || '',
      mobile_number: mobile_number || '',
      user_id_name: user_id_name || '',
      encrypted_password: cryptoResult.encrypted,
      password_iv: cryptoResult.iv,
      password_tag: cryptoResult.tag,
      cyber_code: cryptoResult.cyberCode,
      mfa_tool: mfa_tool || 'None',
      mfa_details: mfa_details || '',
      notes: notes || '',
      workspace: workspace || 'Personal',
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || ''
    });

    await credential.save();

    await AuditLog.create({
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || '',
      user_name: user_name || 'User',
      action: 'Create Credential Vault Entry',
      details: `Stored cyber-encrypted credentials for ${site_or_app} (${user_id_name || registered_email}) with 2FA: ${mfa_tool || 'None'}`
    });

    res.status(201).json({
      id: credential._id.toString(),
      site_or_app: credential.site_or_app,
      category: credential.category,
      registered_email: credential.registered_email,
      mobile_number: credential.mobile_number,
      user_id_name: credential.user_id_name,
      password_masked: '••••••••••••',
      has_password: true,
      cyber_encrypted: true,
      mfa_tool: credential.mfa_tool,
      mfa_details: credential.mfa_details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/credentials/:id', async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const fields = [
      'site_or_app', 'category', 'url', 'registered_email', 'mobile_number',
      'user_id_name', 'mfa_tool', 'mfa_details', 'notes', 'workspace'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) cred[f] = req.body[f];
    });

    // If new password provided, re-encrypt
    if (req.body.password !== undefined && req.body.password.trim() !== '') {
      const cryptoResult = encryptPassword(req.body.password);
      cred.encrypted_password = cryptoResult.encrypted;
      cred.password_iv = cryptoResult.iv;
      cred.password_tag = cryptoResult.tag;
      cred.cyber_code = cryptoResult.cyberCode;
    }

    cred.updatedAt = new Date();
    await cred.save();

    await AuditLog.create({
      user_name: req.body.user_name || 'User',
      action: 'Update Credential',
      details: `Updated vault credentials for ${cred.site_or_app} (${cred.user_id_name})`
    });

    res.json({
      id: cred._id.toString(),
      site_or_app: cred.site_or_app,
      category: cred.category,
      registered_email: cred.registered_email,
      mobile_number: cred.mobile_number,
      user_id_name: cred.user_id_name,
      password_masked: '••••••••••••',
      has_password: true,
      mfa_tool: cred.mfa_tool,
      mfa_details: cred.mfa_details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/credentials/:id', async (req, res) => {
  try {
    const cred = await Credential.findByIdAndDelete(req.params.id);
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    await AuditLog.create({
      user_name: req.query.user_name || 'User',
      action: 'Delete Credential',
      details: `Deleted vault credential for ${cred.site_or_app} (${cred.user_id_name})`
    });

    res.json({ message: 'Credential deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reveal - strictly decrypts only this line item and logs security audit trail
app.post('/api/credentials/:id/reveal', async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const decryptedPassword = decryptPassword(
      cred.encrypted_password,
      cred.password_iv,
      cred.password_tag,
      cred.cyber_code
    );

    await AuditLog.create({
      user_id: cred.user_id,
      user_email: cred.user_email,
      user_name: req.body.user_name || 'Authorized User',
      action: 'Password Reveal Requested',
      details: `Password revealed for ${cred.site_or_app} (User ID: ${cred.user_id_name || cred.registered_email})`
    });

    res.json({
      id: cred._id.toString(),
      site_or_app: cred.site_or_app,
      user_id_name: cred.user_id_name,
      password: decryptedPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. CONTACT MANAGER, MERGE & GOOGLE SYNC ENDPOINTS
// -------------------------------------------------------------

app.get('/api/contacts', async (req, res) => {
  try {
    const filter = buildAssetUserFilter(req);
    const { search, google_synced } = req.query;

    if (google_synced !== undefined && google_synced !== 'All') {
      filter.google_synced = google_synced === 'true';
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { mobile_name: sRegex },
          { mobile_number: sRegex },
          { secondary_number: sRegex },
          { mail_id: sRegex },
          { secondary_email: sRegex },
          { company: sRegex },
          { job_title: sRegex },
          { context_notes: sRegex },
          { tags: sRegex }
        ]
      });
    }

    const contacts = await Contact.find(filter).sort({ mobile_name: 1 });
    const formatted = contacts.map((c) => ({
      ...c.toObject(),
      id: c._id.toString()
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function makePhoneRegex(phoneStr) {
  const digits = (phoneStr || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 7) return null;
  // Match digits with optional non-digits between them so formatted numbers like "+1 650-555-0188" match
  return new RegExp(digits.split('').join('\\D*'), 'i');
}

// Check potential duplicate contacts by phone, email, or name
app.post('/api/contacts/check-duplicate', async (req, res) => {
  try {
    const { mobile_number, mail_id, mobile_name, exclude_id } = req.body;
    const conditions = [];

    const phoneRegex = makePhoneRegex(mobile_number);
    if (phoneRegex) {
      conditions.push({
        $or: [
          { mobile_number: phoneRegex },
          { secondary_number: phoneRegex }
        ]
      });
    }

    if (mail_id && mail_id.trim()) {
      const cleanEmail = mail_id.trim().toLowerCase();
      conditions.push({
        $or: [
          { mail_id: new RegExp(`^${cleanEmail}$`, 'i') },
          { secondary_email: new RegExp(`^${cleanEmail}$`, 'i') }
        ]
      });
    }

    if (mobile_name && mobile_name.trim().length >= 3) {
      conditions.push({
        mobile_name: new RegExp(`^${mobile_name.trim()}$`, 'i')
      });
    }

    if (conditions.length === 0) {
      return res.json({ isDuplicate: false, duplicates: [] });
    }

    const query = { $or: conditions };
    if (exclude_id && mongoose.Types.ObjectId.isValid(exclude_id)) {
      query._id = { $ne: new mongoose.Types.ObjectId(exclude_id) };
    }

    const duplicates = await Contact.find(query).limit(5);
    res.json({
      isDuplicate: duplicates.length > 0,
      duplicates: duplicates.map((d) => ({ ...d.toObject(), id: d._id.toString() }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Contact (with auto-duplicate detection)
app.post('/api/contacts', async (req, res) => {
  try {
    const {
      mobile_name,
      mobile_number,
      secondary_number,
      mail_id,
      secondary_email,
      social_ids,
      company,
      job_title,
      context_notes,
      tags,
      workspace,
      user_id,
      user_email,
      user_name,
      force
    } = req.body;

    if (!mobile_name || !mobile_number) {
      return res.status(400).json({ error: 'Contact name and mobile number are required' });
    }

    // Unless client explicitly asked to bypass duplicate check (force = true)
    if (!force) {
      const phoneRegex = makePhoneRegex(mobile_number);
      const orClauses = [];
      if (phoneRegex) {
        orClauses.push({ mobile_number: phoneRegex });
        orClauses.push({ secondary_number: phoneRegex });
      }
      if (mail_id && mail_id.trim()) {
        orClauses.push({ mail_id: new RegExp(`^${mail_id.trim()}$`, 'i') });
        orClauses.push({ secondary_email: new RegExp(`^${mail_id.trim()}$`, 'i') });
      }
      if (orClauses.length > 0) {
        const existing = await Contact.find({ $or: orClauses });
        if (existing.length > 0) {
          return res.status(409).json({
            duplicateDetected: true,
            message: 'Duplicate contact detected with matching phone number or email.',
            duplicates: existing.map((e) => ({ ...e.toObject(), id: e._id.toString() }))
          });
        }
      }
    }

    const contact = new Contact({
      mobile_name,
      mobile_number,
      secondary_number: secondary_number || '',
      mail_id: mail_id || '',
      secondary_email: secondary_email || '',
      social_ids: {
        linkedin: social_ids?.linkedin || '',
        twitter: social_ids?.twitter || '',
        github: social_ids?.github || '',
        instagram: social_ids?.instagram || '',
        whatsapp: social_ids?.whatsapp || '',
        other: social_ids?.other || ''
      },
      company: company || '',
      job_title: job_title || '',
      context_notes: context_notes || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      workspace: workspace || 'Personal',
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || ''
    });

    await contact.save();

    await AuditLog.create({
      user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
      user_email: user_email || '',
      user_name: user_name || 'User',
      action: 'Create Contact',
      details: `Added contact ${mobile_name} (${mobile_number})`
    });

    res.status(201).json({ ...contact.toObject(), id: contact._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const fields = [
      'mobile_name', 'mobile_number', 'secondary_number', 'mail_id', 'secondary_email',
      'company', 'job_title', 'context_notes', 'workspace', 'google_synced'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) contact[f] = req.body[f];
    });

    if (req.body.social_ids) {
      contact.social_ids = {
        ...contact.social_ids?.toObject(),
        ...req.body.social_ids
      };
    }

    if (req.body.tags) {
      contact.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map((t) => t.trim());
    }

    contact.updatedAt = new Date();
    await contact.save();

    await AuditLog.create({
      user_name: req.body.user_name || 'User',
      action: 'Update Contact',
      details: `Updated contact ${contact.mobile_name} (${contact.mobile_number})`
    });

    res.json({ ...contact.toObject(), id: contact._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    await AuditLog.create({
      user_name: req.query.user_name || 'User',
      action: 'Delete Contact',
      details: `Deleted contact ${contact.mobile_name} (${contact.mobile_number})`
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan all contacts for duplicates
app.get('/api/contacts-scan/duplicates', async (req, res) => {
  try {
    const filter = buildAssetUserFilter(req);
    const contacts = await Contact.find(filter);

    const phoneMap = new Map();
    const emailMap = new Map();
    const duplicateClusters = [];
    const seenIds = new Set();

    contacts.forEach((c) => {
      const cleanPhone = (c.mobile_number || '').replace(/[\s\-\(\)\+]/g, '').slice(-10);
      if (cleanPhone.length >= 7) {
        if (!phoneMap.has(cleanPhone)) phoneMap.set(cleanPhone, []);
        phoneMap.get(cleanPhone).push(c);
      }

      const cleanEmail = (c.mail_id || '').trim().toLowerCase();
      if (cleanEmail && cleanEmail.includes('@')) {
        if (!emailMap.has(cleanEmail)) emailMap.set(cleanEmail, []);
        emailMap.get(cleanEmail).push(c);
      }
    });

    // Collect phone duplicates
    phoneMap.forEach((list, phone) => {
      if (list.length > 1) {
        const clusterIds = list.map((item) => item._id.toString()).sort().join('-');
        if (!seenIds.has(clusterIds)) {
          seenIds.add(clusterIds);
          duplicateClusters.push({
            reason: `Matching phone number: ${phone}`,
            contacts: list.map((item) => ({ ...item.toObject(), id: item._id.toString() }))
          });
        }
      }
    });

    // Collect email duplicates
    emailMap.forEach((list, email) => {
      if (list.length > 1) {
        const clusterIds = list.map((item) => item._id.toString()).sort().join('-');
        if (!seenIds.has(clusterIds)) {
          seenIds.add(clusterIds);
          duplicateClusters.push({
            reason: `Matching email address: ${email}`,
            contacts: list.map((item) => ({ ...item.toObject(), id: item._id.toString() }))
          });
        }
      }
    });

    res.json(duplicateClusters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Merge duplicate contacts and merge their context
app.post('/api/contacts/merge', async (req, res) => {
  try {
    const { primaryContactId, duplicateContactIds, mergedData, user_name } = req.body;

    if (!primaryContactId || !duplicateContactIds || duplicateContactIds.length === 0) {
      return res.status(400).json({ error: 'Primary contact ID and duplicate contact IDs are required' });
    }

    const primary = await Contact.findById(primaryContactId);
    if (!primary) return res.status(404).json({ error: 'Primary contact not found' });

    const duplicates = await Contact.find({ _id: { $in: duplicateContactIds } });

    // Combine context notes intelligently
    let mergedContext = mergedData?.context_notes !== undefined ? mergedData.context_notes : (primary.context_notes || '');
    duplicates.forEach((dup) => {
      if (dup.context_notes && dup.context_notes.trim() && !mergedContext.includes(dup.context_notes.trim())) {
        mergedContext += `\n[Merged from ${dup.mobile_name} (${new Date().toLocaleDateString()})]: ${dup.context_notes.trim()}`;
      }
    });

    // Combine social IDs
    const combinedSocial = {
      linkedin: mergedData?.social_ids?.linkedin || primary.social_ids?.linkedin || '',
      twitter: mergedData?.social_ids?.twitter || primary.social_ids?.twitter || '',
      github: mergedData?.social_ids?.github || primary.social_ids?.github || '',
      instagram: mergedData?.social_ids?.instagram || primary.social_ids?.instagram || '',
      whatsapp: mergedData?.social_ids?.whatsapp || primary.social_ids?.whatsapp || '',
      other: mergedData?.social_ids?.other || primary.social_ids?.other || ''
    };

    duplicates.forEach((dup) => {
      ['linkedin', 'twitter', 'github', 'instagram', 'whatsapp', 'other'].forEach((k) => {
        if (!combinedSocial[k] && dup.social_ids?.[k]) {
          combinedSocial[k] = dup.social_ids[k];
        }
      });
    });

    // Secondary phone & secondary email
    let secPhone = mergedData?.secondary_number || primary.secondary_number || '';
    if (!secPhone) {
      for (const dup of duplicates) {
        if (dup.mobile_number && dup.mobile_number !== primary.mobile_number) {
          secPhone = dup.mobile_number;
          break;
        }
        if (dup.secondary_number && dup.secondary_number !== primary.mobile_number) {
          secPhone = dup.secondary_number;
          break;
        }
      }
    }

    let secEmail = mergedData?.secondary_email || primary.secondary_email || '';
    if (!secEmail) {
      for (const dup of duplicates) {
        if (dup.mail_id && dup.mail_id !== primary.mail_id) {
          secEmail = dup.mail_id;
          break;
        }
        if (dup.secondary_email && dup.secondary_email !== primary.mail_id) {
          secEmail = dup.secondary_email;
          break;
        }
      }
    }

    // Apply merged updates to primary
    primary.mobile_name = mergedData?.mobile_name || primary.mobile_name;
    primary.mobile_number = mergedData?.mobile_number || primary.mobile_number;
    primary.secondary_number = secPhone;
    primary.mail_id = mergedData?.mail_id || primary.mail_id;
    primary.secondary_email = secEmail;
    primary.company = mergedData?.company || primary.company || duplicates.find((d) => d.company)?.company || '';
    primary.job_title = mergedData?.job_title || primary.job_title || duplicates.find((d) => d.job_title)?.job_title || '';
    primary.social_ids = combinedSocial;
    primary.context_notes = mergedContext.trim();
    primary.updatedAt = new Date();

    await primary.save();

    // Delete duplicates that were merged
    await Contact.deleteMany({ _id: { $in: duplicateContactIds } });

    await AuditLog.create({
      user_name: user_name || 'User',
      action: 'Merge Contacts & Context',
      details: `Merged ${duplicates.length} duplicate contact(s) into primary contact: ${primary.mobile_name} (${primary.mobile_number})`
    });

    res.json({
      success: true,
      message: `Successfully merged into ${primary.mobile_name}`,
      contact: { ...primary.toObject(), id: primary._id.toString() }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Sync endpoint (sync contacts with Google Contacts metadata/API)
app.post('/api/contacts/google-sync', async (req, res) => {
  try {
    const { contact_ids, user_name, sync_all } = req.body;
    const filter = buildAssetUserFilter(req);

    let targetQuery = filter;
    if (!sync_all && Array.isArray(contact_ids) && contact_ids.length > 0) {
      targetQuery._id = { $in: contact_ids.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const now = new Date();
    const result = await Contact.updateMany(
      targetQuery,
      {
        $set: {
          google_synced: true,
          last_synced_with_google: now
        }
      }
    );

    await AuditLog.create({
      user_name: user_name || 'User',
      action: 'Google Contacts Sync',
      details: `Synchronized ${result.modifiedCount} contact(s) with Google Contacts`
    });

    res.json({
      success: true,
      synced_count: result.modifiedCount,
      last_synced_at: now.toISOString(),
      message: `Successfully synchronized ${result.modifiedCount} contact(s) with Google Contacts cloud context`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Contacts Import endpoint (handles array of contacts and merges/adds)
app.post('/api/contacts/google-import', async (req, res) => {
  try {
    const { contacts, user_id, user_email, user_name, workspace } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts provided for import' });
    }

    let addedCount = 0;
    let mergedCount = 0;

    for (const item of contacts) {
      const name = item.mobile_name || item.name || 'Unnamed Contact';
      const phone = item.mobile_number || item.phone || '';
      const email = item.mail_id || item.email || '';

      if (!phone && !email && !name) continue;

      // Duplicate check
      let existing = null;
      if (phone) {
        const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '').slice(-10);
        if (cleanPhone.length >= 7) {
          existing = await Contact.findOne({
            $or: [
              { mobile_number: new RegExp(cleanPhone, 'i') },
              { secondary_number: new RegExp(cleanPhone, 'i') }
            ]
          });
        }
      }
      if (!existing && email) {
        existing = await Contact.findOne({
          $or: [
            { mail_id: new RegExp(`^${email.trim()}$`, 'i') },
            { secondary_email: new RegExp(`^${email.trim()}$`, 'i') }
          ]
        });
      }

      if (existing) {
        // Merge Google info into existing
        if (!existing.secondary_number && phone && phone !== existing.mobile_number) {
          existing.secondary_number = phone;
        }
        if (!existing.secondary_email && email && email !== existing.mail_id) {
          existing.secondary_email = email;
        }
        if (item.company && !existing.company) existing.company = item.company;
        if (item.notes && !existing.context_notes.includes(item.notes)) {
          existing.context_notes += `\n[Google Sync]: ${item.notes}`;
        }
        existing.google_synced = true;
        existing.last_synced_with_google = new Date();
        await existing.save();
        mergedCount++;
      } else {
        await Contact.create({
          mobile_name: name,
          mobile_number: phone || 'N/A',
          mail_id: email || '',
          company: item.company || '',
          job_title: item.job_title || '',
          context_notes: item.notes || 'Imported from Google Contacts',
          google_synced: true,
          last_synced_with_google: new Date(),
          workspace: workspace || 'Personal',
          user_id: user_id && mongoose.Types.ObjectId.isValid(user_id) ? user_id : undefined,
          user_email: user_email || ''
        });
        addedCount++;
      }
    }

    await AuditLog.create({
      user_name: user_name || 'User',
      action: 'Google Contacts Import',
      details: `Imported ${addedCount} new contact(s), merged ${mergedCount} existing contact(s) from Google Contacts`
    });

    res.json({
      success: true,
      added: addedCount,
      merged: mergedCount,
      message: `Successfully processed Google Contacts: ${addedCount} created, ${mergedCount} merged`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// One-time non-destructive backfill for existing sessions without user_id
async function backfillSessionUserData() {
  try {
    const sessionsWithoutUser = await TimeSession.find({
      $or: [{ user_id: null }, { user_email: null }, { user_id: { $exists: false } }]
    });
    for (const session of sessionsWithoutUser) {
      if (session.task_id) {
        const task = await Task.findById(session.task_id);
        if (task) {
          let updated = false;
          if (!session.user_id && task.user_id) {
            session.user_id = task.user_id;
            updated = true;
          }
          if (!session.user_email && task.user_email) {
            session.user_email = task.user_email;
            updated = true;
          }
          if (updated) await session.save();
        }
      }
    }
  } catch (e) {
    console.error('Backfill sessions notice:', e.message);
  }
}

async function backfillTaskUserData() {
  try {
    const users = await User.find({});
    for (const user of users) {
      if (user.email) {
        const cleanEmail = user.email.toLowerCase().trim();
        const emailRegex = new RegExp(`^${cleanEmail}$`, 'i');
        await Task.updateMany(
          { user_email: emailRegex, $or: [{ user_id: null }, { user_id: { $exists: false } }] },
          { $set: { user_id: user._id } }
        );
      }
    }
  } catch (e) {
    console.error('Backfill tasks notice:', e.message);
  }
}

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

app.listen(PORT, async () => {
  console.log(`Orbita MERN API Server running on port ${PORT}`);
  await backfillSessionUserData();
  await backfillTaskUserData();
});
