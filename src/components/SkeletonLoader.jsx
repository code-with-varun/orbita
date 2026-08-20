import React from 'react';

export function CardSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '220px', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '70px', height: '14px', borderRadius: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton" style={{ width: '100px', height: '12px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
        <div className="skeleton" style={{ width: '12%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '35%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '15%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '15%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '13%', height: '16px', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
            <div className="skeleton" style={{ width: '12%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '35%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '15%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '15%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '13%', height: '18px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatrixSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card" style={{ height: '480px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div className="skeleton" style={{ width: '45%', height: '22px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '10px' }} />
          </div>
          <div className="skeleton" style={{ width: '75%', height: '12px', borderRadius: '4px', marginBottom: '0.75rem' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card" style={{ height: '520px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div className="skeleton" style={{ width: '55%', height: '18px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '28px', height: '18px', borderRadius: '10px' }} />
          </div>
          <div className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-sm)' }} />
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ width: '160px', height: '28px', borderRadius: '6px' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '60px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '20px', borderRadius: '4px' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '6px' }} />
        ))}
      </div>
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="metrics-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card metric-card" style={{ padding: '1.25rem' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '50px', height: '24px', borderRadius: '4px', marginBottom: '0.35rem' }} />
            <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <div className="skeleton" style={{ width: '220px', height: '28px', borderRadius: '6px', marginBottom: '0.4rem' }} />
          <div className="skeleton" style={{ width: '340px', height: '14px', borderRadius: '4px' }} />
        </div>
      </div>
      <MetricsSkeleton />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-card" style={{ height: '340px', padding: '1.25rem' }}>
          <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: '4px', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: '220px', borderRadius: '8px' }} />
        </div>
        <div className="glass-card" style={{ height: '340px', padding: '1.25rem' }}>
          <div className="skeleton" style={{ width: '140px', height: '20px', borderRadius: '4px', marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton" style={{ height: '50px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: '50px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: '50px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
