import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://varunakshay23:VAva2323@varunfsd.67yjhgw.mongodb.net/orbita';

export async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('Connected to MongoDB Atlas successfully (orbita database)');
    await ensureSuperadmin();
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err.message);
  }
}

// -------------------------------------------------------------
// DEFAULT SUPERADMIN ACCOUNT
// -------------------------------------------------------------
export const DEFAULT_SUPERADMIN = {
  name: 'Super Admin',
  email: 'superadmin@orbita.com',
  password_hash: 'superadmin123',
  role: 'Superadmin'
};

// -------------------------------------------------------------
// SCHEMAS & MODELS
// -------------------------------------------------------------

// 1. User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'Member', enum: ['Member', 'Admin', 'Superadmin'] },
  createdAt: { type: Date, default: Date.now }
});

// 2. Stage Task Schema (Nested inside stages of Projects)
const StageTaskSchema = new mongoose.Schema({
  ticket_key: { type: String },
  title: { type: String, required: true },
  is_completed: { type: Boolean, default: false },
  completed_at: { type: Date },
  assignee: { type: String, default: 'Unassigned' },
  due_date: { type: String },
  is_urgent: { type: Boolean, default: false },
  is_important: { type: Boolean, default: true },
  priority_quadrant: { type: String, default: 'Q2' },
  priority: { type: String, default: 'High' },
  is_timer_allowed: { type: Boolean, default: true },
  is_timer_running: { type: Boolean, default: false },
  is_timer_paused: { type: Boolean, default: false },
  timer_started_at: { type: Date },
  timer_accumulated_seconds: { type: Number, default: 0 },
  actual_hours: { type: Number, default: 0 },
  order_index: { type: Number, default: 0 }
});

// 3. Project Stage Schema
const ProjectStageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  order_index: { type: Number, default: 0 },
  is_completed: { type: Boolean, default: false },
  tasks: [StageTaskSchema]
});

// 4. Unified Task Schema (Task, Routine, Goal, Project)
const TaskSchema = new mongoose.Schema({
  ticket_key: { type: String, required: true, unique: true },
  orbita_type: { type: String, required: true, enum: ['Task', 'Routine', 'Goal', 'Project'] },
  workspace: { type: String, default: 'Personal', enum: ['Personal', 'Work'] },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  tags: { type: String, default: '' },
  is_urgent: { type: Boolean, default: false },
  is_important: { type: Boolean, default: true },
  priority_quadrant: { type: String, default: 'Q2' },
  priority: { type: String, default: 'High' },
  status: { type: String, default: 'Active', enum: ['Active', 'In Progress', 'Paused', 'Completed'] },
  assignee: { type: String, default: 'Unassigned' },
  created_by: { type: String, default: 'User' },
  scheduled_date: { type: String },
  due_date: { type: String },
  completed_at: { type: Date },
  recurrence_type: { type: String },
  recurrence_interval: { type: Number, default: 1 },
  recurrence_day: { type: String },
  target_hours: { type: Number, default: 0 },
  estimated_hours: { type: Number, default: 0 },
  actual_hours: { type: Number, default: 0 },
  is_timer_allowed: { type: Boolean, default: false },
  is_timer_running: { type: Boolean, default: false },
  is_timer_paused: { type: Boolean, default: false },
  timer_started_at: { type: Date },
  timer_accumulated_seconds: { type: Number, default: 0 },
  is_starred: { type: Boolean, default: false },
  stages: [ProjectStageSchema],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 5. Time Sessions Schema
const TimeSessionSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  stage_task_id: { type: String },
  ticket_key: { type: String },
  task_title: { type: String },
  orbita_type: { type: String },
  workspace: { type: String },
  tags: { type: String },
  user_name: { type: String, default: 'User' },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  duration_seconds: { type: Number, default: 0 },
  notes: { type: String, default: 'Focus Session' }
});

// 6. Audit Logs Schema
const AuditLogSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  ticket_key: { type: String },
  task_title: { type: String },
  orbita_type: { type: String },
  workspace: { type: String },
  user_name: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Task = mongoose.model('Task', TaskSchema);
export const TimeSession = mongoose.model('TimeSession', TimeSessionSchema);
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export async function ensureSuperadmin() {
  try {
    const existing = await User.findOne({ email: DEFAULT_SUPERADMIN.email });
    if (!existing) {
      await User.create(DEFAULT_SUPERADMIN);
      console.log('Default Superadmin account created: superadmin@orbita.com / superadmin123');
    } else if (existing.role !== 'Superadmin') {
      existing.role = 'Superadmin';
      await existing.save();
    }
  } catch (err) {
    console.error('Error ensuring superadmin account:', err.message);
  }
}

export async function cleanResetDatabase(initiatedBy = 'Super Admin') {
  await Promise.all([
    User.deleteMany({ role: { $ne: 'Superadmin' } }),
    Task.deleteMany({}),
    TimeSession.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  await ensureSuperadmin();

  await AuditLog.create({
    user_name: initiatedBy,
    action: 'System Reset',
    details: 'Superadmin performed a full system reset. Fresh setup ready for users.'
  });

  console.log('MongoDB Atlas database reset to fresh setup (Superadmin preserved, 0 items)!');
}
