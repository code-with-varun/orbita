import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://varunakshay23:VAva2323@varunfsd.67yjhgw.mongodb.net/orbita';

export async function connectDb() {
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      // Ignore if DNS custom servers fails
    }
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 12000,
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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
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
  routine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  routine_occurrence_date: { type: String },
  stages: [ProjectStageSchema],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 5. Time Sessions Schema
const TimeSessionSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
  ticket_key: { type: String },
  task_title: { type: String },
  orbita_type: { type: String },
  workspace: { type: String },
  user_name: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// 7. Past Billing Cycle Schema (Nested inside Subscriptions)
const BillingCycleSchema = new mongoose.Schema({
  cycle_date: { type: String, required: true },
  amount_paid: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  invoice_number: { type: String, default: '' },
  period_start: { type: String, default: '' },
  period_end: { type: String, default: '' },
  payment_method: { type: String, default: 'Credit Card' },
  status: { type: String, default: 'Paid', enum: ['Paid', 'Pending', 'Refunded', 'Failed'] },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// 8. Subscription Schema
const SubscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
  workspace: { type: String, default: 'Personal', enum: ['Personal', 'Work'] },
  site: { type: String, required: true },
  app_name: { type: String, required: true },
  category: { type: String, default: 'SaaS / Tools' },
  cost: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'USD' },
  billing_cycle: { type: String, default: 'Monthly', enum: ['Monthly', 'Annually', 'Quarterly', 'Weekly', 'One-Time'] },
  start_date: { type: String },
  expiry_date: { type: String, required: true },
  renewal_date: { type: String, required: true },
  auto_renew: { type: Boolean, default: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Expiring Soon', 'Expired', 'Cancelled'] },
  payment_method: { type: String, default: 'Credit Card' },
  notes: { type: String, default: '' },
  past_billing_cycles: [BillingCycleSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 9. Warranty Schema
const WarrantySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
  workspace: { type: String, default: 'Personal', enum: ['Personal', 'Work'] },
  product_name: { type: String, required: true },
  category: { type: String, default: 'Electronics' },
  cost_paid: { type: Number, required: true, default: 0 },
  number_of_warranties: { type: Number, default: 1 },
  expiry_date: { type: String, required: true },
  purchase_date: { type: String },
  condition: {
    type: String,
    required: true,
    enum: [
      'Refurbished condition',
      'Active condition',
      'Beyond repair condition',
      'Bad condition'
    ],
    default: 'Active condition'
  },
  warranty_provider: { type: String, default: '' },
  serial_number: { type: String, default: '' },
  invoice_number: { type: String, default: '' },
  status: { type: String, default: 'Under Warranty', enum: ['Under Warranty', 'Expiring Soon', 'Expired', 'Claimed'] },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 10. Master Credential Schema
const CredentialSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
  workspace: { type: String, default: 'Personal', enum: ['Personal', 'Work'] },
  site_or_app: { type: String, required: true },
  category: { type: String, default: 'General' },
  url: { type: String, default: '' },
  registered_email: { type: String, default: '' },
  mobile_number: { type: String, default: '' },
  user_id_name: { type: String, default: '' },
  // Stored strictly as AES-256 encrypted cyber-code
  encrypted_password: { type: String, required: true },
  password_iv: { type: String, required: true },
  password_tag: { type: String, required: true },
  cyber_code: { type: String, default: '' },
  // Multi-Factor Authentication column & tools
  mfa_tool: {
    type: String,
    default: 'None',
    enum: [
      'Google Authenticator',
      'Salesforce Authenticator',
      'Microsoft Authenticator',
      'Mobile OTP / SMS',
      'Email OTP',
      'Authy',
      'Hardware Key (YubiKey)',
      'Duo Security',
      'None',
      'Other'
    ]
  },
  mfa_details: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 11. Contact Manager Schema
const ContactSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String },
  workspace: { type: String, default: 'Personal', enum: ['Personal', 'Work'] },
  mobile_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  secondary_number: { type: String, default: '' },
  mail_id: { type: String, default: '' },
  secondary_email: { type: String, default: '' },
  social_ids: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    other: { type: String, default: '' }
  },
  company: { type: String, default: '' },
  job_title: { type: String, default: '' },
  context_notes: { type: String, default: '' },
  google_synced: { type: Boolean, default: false },
  google_contact_id: { type: String, default: '' },
  last_synced_with_google: { type: Date },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Task = mongoose.model('Task', TaskSchema);
export const TimeSession = mongoose.model('TimeSession', TimeSessionSchema);
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
export const Warranty = mongoose.model('Warranty', WarrantySchema);
export const Credential = mongoose.model('Credential', CredentialSchema);
export const Contact = mongoose.model('Contact', ContactSchema);

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
    AuditLog.deleteMany({}),
    Subscription.deleteMany({}),
    Warranty.deleteMany({}),
    Credential.deleteMany({}),
    Contact.deleteMany({})
  ]);

  await ensureSuperadmin();

  await AuditLog.create({
    user_name: initiatedBy,
    action: 'System Reset',
    details: 'Superadmin performed a full system reset. Fresh setup ready for users.'
  });

  console.log('MongoDB Atlas database reset to fresh setup (Superadmin preserved, 0 items)!');
}
