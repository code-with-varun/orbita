import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle2 size={18} color="var(--accent-green)" />;
      case 'danger': return <AlertCircle size={18} color="var(--accent-red)" />;
      default: return <Info size={18} color="var(--accent-blue)" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${toast.type === 'danger' ? 'rgba(239, 68, 68, 0.4)' : toast.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glow)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        zIndex: 300,
        color: 'var(--text-main)',
        fontSize: '0.875rem',
        fontWeight: '600',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      {getIcon()}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '0.5rem' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
