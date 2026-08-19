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
  UserPlus,
  TrendingUp,
  Star,
  BarChart3,
  Briefcase
} from 'lucide-react';
import OrbitaLogo, { OrbitaIcon } from './OrbitaLogo';

export default function LandingPage({
  onOpenAuth,
  theme,
  onToggleTheme,
  onExploreApp
}) {
  return (
    <div className="landing-container" style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        background: theme === 'dark' ? 'rgba(8, 13, 26, 0.82)' : 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.9rem 2rem',
        transition: 'background-color 0.25s ease'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo with Runit Infotech Badge */}
          <div style={{ cursor: 'pointer' }} onClick={onExploreApp}>
            <OrbitaLogo size={38} showBadge={true} badgeText="by Runit Infotech" />
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2.25rem' }} className="landing-nav-links">
            <a href="#taxonomy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' }}>
              4 Work Categories
            </a>
            <a href="#matrix" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Priority Matrix
            </a>
            <a href="#focus" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Focus Stopwatch
            </a>
            <a href="#capabilities" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Solutions
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
              style={{ fontSize: '0.86rem', padding: '0.55rem 1.1rem', borderRadius: '10px' }}
            >
              <LogIn size={15} /> Sign In
            </button>

            <button
              onClick={() => onOpenAuth(true)}
              className="btn btn-primary"
              style={{
                fontSize: '0.86rem',
                padding: '0.55rem 1.25rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
                border: 'none',
                color: '#ffffff'
              }}
            >
              <UserPlus size={15} /> Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: '5.5rem 2rem 4rem',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, rgba(236, 72, 153, 0.12) 40%, transparent 75%)',
          filter: 'blur(70px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Subtitle Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            padding: '0.45rem 1.1rem',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: '700',
            color: 'var(--accent-purple)',
            marginBottom: '1.75rem'
          }}>
            <Sparkles size={15} /> Engineered by Runit Infotech for High-Performing Teams & Individuals
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)',
            fontWeight: '800',
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            maxWidth: '920px',
            margin: '0 auto 1.5rem'
          }}>
            Plan Strategically. Focus Deeply.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Deliver On Time.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-muted)',
            maxWidth: '760px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            Orbita is a modern productivity and work management tool that unifies one-off tasks, recurring routines, time-tracked goals, and multi-stage projects into a clear, actionable workflow.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button
              onClick={() => onOpenAuth(true)}
              className="btn btn-primary"
              style={{
                fontSize: '1.05rem',
                padding: '0.9rem 2.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 6px 25px rgba(124, 58, 237, 0.4)'
              }}
            >
              Start Free Today <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onOpenAuth(false)}
              className="btn btn-secondary"
              style={{
                fontSize: '1.05rem',
                padding: '0.9rem 2rem',
                borderRadius: '12px'
              }}
            >
              Sign In to Your Workspace
            </button>
          </div>

          {/* Interactive Hero Showcase Card */}
          <div className="glass-card" style={{
            padding: '1.75rem',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: theme === 'dark' ? '0 25px 60px rgba(0, 0, 0, 0.5)' : '0 20px 45px rgba(0, 0, 0, 0.08)',
            maxWidth: '1080px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <OrbitaIcon size={24} />
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Executive Work Management Dashboard
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <span className="badge badge-status" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)', fontWeight: '600' }}>
                  4 Work Categories
                </span>
                <span className="badge badge-status" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontWeight: '600' }}>
                  Private & Isolated
                </span>
              </div>
            </div>

            {/* 4 Cards Grid Showcase */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              
              {/* Task Preview */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-green)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <CheckSquare size={16} /> Task (Single Action)
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>Review Client Contract</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Priority: Q1 (Do Now) • 1-Click Done</div>
              </div>

              {/* Routine Preview */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-purple)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <Repeat size={16} /> Routine (Recurring)
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>Weekly Strategic Alignment</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Repeats Every Monday • Automated</div>
              </div>

              {/* Goal Preview */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-amber)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-amber)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <Target size={16} /> Goal (Focus Effort)
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>Product Leadership Mastery</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>18.5h / 25.0h Target • Live Stopwatch</div>
              </div>

              {/* Project Preview */}
              <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-blue)', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <FolderGit2 size={16} /> Project (Multi-Stage)
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>Q3 Enterprise Release</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>3 Stages • 9/10 Delivered (90%)</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. TAXONOMY: THE 4 WORK CATEGORIES */}
      <section id="taxonomy" style={{ padding: '5.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Structured Taxonomy
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
            Every Commitment Fits Into 4 Clear Categories
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0.6rem auto 0', fontSize: '1.05rem', lineHeight: 1.5 }}>
            No more chaotic to-do lists. Orbita provides a purpose-built structure for each type of work you execute.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
          
          {/* Card 1: Task */}
          <div className="glass-card" style={{ padding: '2.25rem', borderTop: '4px solid var(--accent-green)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckSquare size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem' }}>1. Tasks</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-green)', fontWeight: '700', marginBottom: '0.85rem' }}>
              Single Action Items
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Discrete, one-off action items that require single completion. Perfect for urgent errands, approvals, emails, and individual deliverables with rapid 1-click status updates.
            </p>
          </div>

          {/* Card 2: Routine */}
          <div className="glass-card" style={{ padding: '2.25rem', borderTop: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(124, 58, 237, 0.12)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Repeat size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem' }}>2. Routines</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-purple)', fontWeight: '700', marginBottom: '0.85rem' }}>
              Recurring Operating Cycles
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Automated recurring schedules (Daily, Weekly, Monthly, Yearly). Keep recurring meetings, monthly reports, and compliance checks on track without cluttered manual date pickers.
            </p>
          </div>

          {/* Card 3: Goal */}
          <div className="glass-card" style={{ padding: '2.25rem', borderTop: '4px solid var(--accent-amber)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Target size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem' }}>3. Goals</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', fontWeight: '700', marginBottom: '0.85rem' }}>
              Time-Tracked Focus Tracks
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Ongoing focus tracks measured in target hours. Integrated with our live mutual-exclusion focus stopwatch, pause/resume capability, and automated timesheet logging.
            </p>
          </div>

          {/* Card 4: Project */}
          <div className="glass-card" style={{ padding: '2.25rem', borderTop: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <FolderGit2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem' }}>4. Projects</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', fontWeight: '700', marginBottom: '0.85rem' }}>
              Multi-Stage Delivery
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Structured, multistep deliverables with Stage -> Task hierarchy. Manage stages with collapsible accordions, task-level focus timers, and calculated completion percentages.
            </p>
          </div>

        </div>
      </section>

      {/* 4. STRATEGIC DECISION MATRIX */}
      <section id="matrix" style={{ padding: '5.5rem 2rem', background: 'var(--bg-card-hover)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Prioritization Framework
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>
              Eisenhower 2x2 Priority Matrix
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0.6rem auto 0', fontSize: '1.05rem', lineHeight: 1.5 }}>
              Automatically sorts commitments based on Urgency and Importance so you always focus on what moves the needle.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--accent-red)' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-red)', marginBottom: '0.35rem' }}>Q1: Do Now</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Urgent & Important</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Crises, critical deadlines, and immediate customer deliverables requiring urgent execution today.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--accent-blue)' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-blue)', marginBottom: '0.35rem' }}>Q2: Plan & Schedule</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Important & Not Urgent</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Strategic growth, long-term goals, relationship building, and continuous professional mastery.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--accent-purple)' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-purple)', marginBottom: '0.35rem' }}>Q3: Quick Action</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Urgent & Not Important</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Quick operational items, immediate administrative replies, and fast scheduled routines.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem', borderLeft: '5px solid var(--text-dim)' }}>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Q4: Optional</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Not Urgent & Not Important</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Backlog concepts, someday ideas, and low-priority tasks that can be deferred without impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOCUS STOPWATCH & TIMESHEETS */}
      <section id="focus" style={{ padding: '5.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Deep Work Engine
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem', lineHeight: 1.2 }}>
              Zero-Overlap Focus Stopwatch with Instant Timesheets
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '1rem', lineHeight: 1.6 }}>
              Multitasking drains performance. Orbita enforces timer mutual exclusion: starting a timer on one task automatically stops and logs the previous session accurately.
            </p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.75rem', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-green)" /> <strong>Pause & Resume</strong> with exact second-by-second accumulation
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-green)" /> <strong>Ticking Live Stopwatch</strong> in topbar header across all screens
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--accent-green)" /> <strong>Detailed Timesheets</strong> with instant CSV and JSON data export
              </li>
            </ul>
          </div>

          {/* Visual Timer Badge Mockup */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.6rem 1.25rem',
              borderRadius: '999px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
              <span style={{ fontWeight: '800', fontFamily: 'monospace', color: 'var(--accent-red)', fontSize: '1.15rem' }}>
                01:42:18
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                GOL-003: Executive Strategy
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Effort</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-amber)' }}>25.0h</div>
              </div>
              <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Logged Focus</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-green)' }}>18.7h</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <OrbitaLogo size={56} showTagline={true} showBadge={true} badgeText="by Runit Infotech" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: '800', marginBottom: '1rem' }}>
          Elevate Your Daily Execution with Orbita
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '620px', margin: '0 auto 2.25rem', lineHeight: 1.6 }}>
          Join thousands of professionals and teams who trust Orbita for clarity, accountability, and seamless work delivery.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenAuth(true)}
            className="btn btn-primary"
            style={{
              fontSize: '1.05rem',
              padding: '0.9rem 2.5rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 6px 25px rgba(124, 58, 237, 0.4)'
            }}
          >
            Create Your Account <ArrowRight size={18} />
          </button>
          <button
            onClick={() => onOpenAuth(false)}
            className="btn btn-secondary"
            style={{ fontSize: '1.05rem', padding: '0.9rem 2rem', borderRadius: '12px' }}
          >
            Sign In to Existing Account
          </button>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '2.25rem 2rem',
        marginTop: 'auto',
        background: theme === 'dark' ? 'rgba(8, 13, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <OrbitaLogo size={32} showBadge={true} badgeText="by Runit Infotech" />

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Orbita. Built & Maintained by <strong>Runit Infotech</strong>. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
