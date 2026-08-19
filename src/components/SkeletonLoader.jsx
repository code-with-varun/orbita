import React from 'react';

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" style={{ borderRadius: 'var(--radius-sm)' }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-table-row" style={{ borderRadius: '4px' }} />
      ))}
    </div>
  );
}

export function MatrixSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card" style={{ height: '320px', padding: '1rem' }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '20px', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '70px', marginBottom: '0.75rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '70px' }} />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card" style={{ height: '420px', padding: '1rem' }}>
          <div className="skeleton skeleton-text" style={{ width: '50%', height: '18px', marginBottom: '1.2rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '80px', marginBottom: '0.75rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '80px', marginBottom: '0.75rem' }} />
          <div className="skeleton skeleton-card" style={{ height: '80px' }} />
        </div>
      ))}
    </div>
  );
}
