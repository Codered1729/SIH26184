import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 6000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 250);
  };

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  const accentColor = isSuccess ? '#10B981' : (isError ? '#EF4444' : 'var(--primary)');
  const IconComponent = isSuccess ? CheckCircle2 : (isError ? AlertCircle : Info);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sentinel-toast"
      style={{
        position: 'fixed',
        top: '72px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'var(--card)',
        color: 'var(--foreground)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        maxWidth: '380px',
        minWidth: '280px',
        animation: isExiting ? 'toastSlideOut 0.25s ease forwards' : 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        marginTop: '1px',
        color: accentColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <IconComponent size={20} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--foreground)',
          lineHeight: 1.3,
          marginBottom: toast.message ? '3px' : 0,
        }}>
          {toast.title || 'Notification'}
        </div>
        {toast.message && (
          <div style={{
            fontSize: '11.5px',
            color: 'var(--muted-foreground)',
            lineHeight: 1.4,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s ease',
          marginLeft: '4px',
        }}
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
