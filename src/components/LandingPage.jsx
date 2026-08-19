import React from 'react';
import {
  CheckSquare,
  Repeat,
  Target,
  FolderGit2,
  Play,
  Grid,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  Award,
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function LandingPage({
  onOpenAuth,
  theme,
  onToggleTheme,
  onExploreApp
}) {
  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        background: 'rgba(10, 15, 29, 0.75)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.85rem 2rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={onExploreApp}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
            }}>
              <img src="/logo.png" alt="Orbita Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.06em', fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ORBITA
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                WORK MANAGEMENT OS
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="landing-nav-links">
            <a href="#types" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}>
              4 Work Types
            </a>
            <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}>
              Core Features
            </a>
            <a href="#matrix" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '500', transition: 'color 0.2s' }}>
              Eisenhower Matrix
            </a>
          </nav>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary"
              style={{ padding: '0.5rem', borderRadius: '10px' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={() => onOpenAuth(false)}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <LogIn size={15} /> Sign In
            </button>

            <button
              onClick={() => onOpenAuth(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            >
              <UserPlus size={15} /> Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Glowing Ambient Background */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 80%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--accent-blue)',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={14} color="var(--accent-blue)" /> Unified Work Execution Platform
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            maxWidth: '900px',
            margin: '0 auto 1.5rem'
          }}>
            Master Your Work with Precision Across <span style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>4 Unified Types</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-muted)',
            maxWidth: '780px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            Orbita bridges the gap between ad-hoc tasks, automated recurring routines, deep-work goals with live stopwatch timers, and multi-stage structured project delivery in one unified ecosystem.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <button
              onClick={() => onOpenAuth(true)}
              className="btn btn-primary"
              style={{
                fontSize: '1rem',
                padding: '0.85rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 25px rgba(59, 130, 246, 0.5)'
              }}
            >
              Start Free Today <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onOpenAuth(false)}
              className="btn btn-secondary"
              style={{
                fontSize: '1rem',
                padding: '0.85rem 1.75rem',
                borderRadius: '12px'
              }}
            >
              Sign In to Your Workspace
            </button>
          </div>

          {/* Interactive Hero Preview Card */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            maxWidth: '1050px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem', fontFamily: 'monospace' }}>
                  Orbita Work OS • Multi-Type Execution Engine
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-status" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>MongoDB Atlas Cloud</span>
                <span className="badge badge-status" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)' }}>Per-User Isolated</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-green)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <CheckSquare size={16} /> Task
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>TSK-001: Buy Office Supplies</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Personal • Q1: Do Now</div>
              </div>

              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <Repeat size={16} /> Routine
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>RTN-002: Weekly Sprint Sync</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Work • Repeats Weekly on Mon</div>
              </div>

              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-amber)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <Target size={16} /> Goal (Timer Active)
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>GOL-003: Learn Next.js 15</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>14.5h / 20.0h focus target</div>
              </div>

              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <FolderGit2 size={16} /> Project
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>PRJ-004: Client CRM Portal</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>3 Stages • 8/10 tasks (80%)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 4 ORBITA WORK TYPES */}
      <section id="types" style={{ padding: '5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Structured Taxonomy
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: '800', marginTop: '0.5rem' }}>
            Everything You Do Fits into 4 Clear Types
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0.5rem auto 0', fontSize: '1rem' }}>
            No ambiguous tickets. Orbita gives every item a specific execution behavior and measurement.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1: Task */}
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-green)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckSquare size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>1. Tasks</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: '700', marginBottom: '0.75rem' }}>
              Single Action Items
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, flex: 1 }}>
              One-time simple items with quick 1-click completion toggle. Perfect for ad-hoc to-dos, shopping, calls, and individual action steps.
            </p>
          </div>

          {/* Card 2: Routine */}
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Repeat size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>2. Routines</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: '700', marginBottom: '0.75rem' }}>
              Automated Recurring Cycles
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, flex: 1 }}>
              Recurring habits and periodic obligations. Configure frequencies (Daily, Weekly, Monthly, Yearly) without cluttering manual date pickers.
            </p>
          </div>

          {/* Card 3: Goal */}
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-amber)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>3. Goals</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: '700', marginBottom: '0.75rem' }}>
              Deep-Work Focus Efforts
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, flex: 1 }}>
              Ongoing focus tracks measured in hours. Features live stopwatch, pause/resume, automatic mutual exclusion, and direct timesheet audit logging.
            </p>
          </div>

          {/* Card 4: Project */}
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FolderGit2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem' }}>4. Projects</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '700', marginBottom: '0.75rem' }}>
              Multi-Stage Delivery
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, flex: 1 }}>
              Hierarchical structured workflows organized into Stages and Sub-tasks with individual timers, collapsible stage accordions, and automated progress bars.
            </p>
          </div>

        </div>
      </section>

      {/* 4. CORE FEATURES & VIEWS */}
      <section id="features" style={{ padding: '5rem 2rem', background: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Intelligent Capabilities
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: '800', marginTop: '0.5rem' }}>
              Engineered for High-Velocity Execution
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Clock size={22} color="var(--accent-red)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Mutual-Exclusion Focus Timer</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Zero parallel timer overlaps. Starting or resuming a new focus timer automatically stops and logs the previous session accurately into Timesheets with Pause/Resume capability.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Grid size={22} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Eisenhower 2x2 Priority Matrix</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Categorize your work into Q1 (Do Now), Q2 (Plan & Schedule), Q3 (Quick Action), and Q4 (Optional). Project stage tasks automatically surface inside matrix quadrants.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Layers size={22} color="var(--accent-purple)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Kanban Flow with HTML5 Drag & Drop</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Drag and drop your Tasks and Routines across Active, In Progress, Paused, and Completed states with instant MongoDB Atlas persistence and scrollable columns.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Calendar size={22} color="var(--accent-green)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Interactive Calendar Planner</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Full monthly calendar matrix mapping due dates and scheduled occurrences. Click any date cell or the + icon to schedule tasks instantly on that exact day.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <ShieldCheck size={22} color="var(--accent-amber)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Multi-Tenant Isolation & Audits</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Complete user privacy where each member only views their personal data, paired with immutable activity audit logs and 1-click CSV/JSON data dumps.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Award size={22} color="var(--accent-pink)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Monthly Highlights & Scorecards</h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Celebrate monthly achievements with productivity scores, milestone star showcases, and automatically unlocked badges for task mastery and deep focus.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 35px rgba(59, 130, 246, 0.4)',
          border: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <img src="/logo.png" alt="Orbita Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: '800', marginBottom: '1rem' }}>
          Ready to Elevate Your Productivity?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Join Orbita today. Create your account in seconds and experience the future of streamlined task and project execution.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenAuth(true)}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.85rem 2.25rem', borderRadius: '12px', boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)' }}
          >
            Create Your Account <ArrowRight size={18} />
          </button>
          <button
            onClick={() => onOpenAuth(false)}
            className="btn btn-secondary"
            style={{ fontSize: '1rem', padding: '0.85rem 1.75rem', borderRadius: '12px' }}
          >
            Sign In to Existing Account
          </button>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '2rem',
        marginTop: 'auto',
        background: 'rgba(10, 15, 29, 0.9)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src="/logo.png" alt="Orbita Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>ORBITA</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>— Unified Work Management OS</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Orbita Inc. Powered by MERN & MongoDB Atlas.
          </div>
        </div>
      </footer>

    </div>
  );
}
