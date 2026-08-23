'use client';

import { useToastStore } from '../../stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div className="toast-container" aria-live="assertive" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.type === 'success'
            ? CheckCircle
            : toast.type === 'error'
            ? AlertCircle
            : Info;
          
          return (
            <motion.div
              key={toast.id}
              className={`toast-item toast-${toast.type}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--color-text-primary)',
                minWidth: '300px',
                maxWidth: '400px',
                pointerEvents: 'auto'
              }}
            >
              <Icon size={18} className={`toast-icon-${toast.type}`} style={{
                color: toast.type === 'success'
                  ? 'var(--color-success)'
                  : toast.type === 'error'
                  ? 'var(--color-danger)'
                  : 'var(--color-accent)'
              }} />
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
              
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    dismissToast(toast.id);
                  }}
                  className="toast-action-btn"
                  style={{
                    backgroundColor: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent-subtle-text)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginRight: '4px'
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  color: 'var(--color-text-secondary)',
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Dismiss toast"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
