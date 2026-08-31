'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-msg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className="confirm-dialog"
          >
            <div className="confirm-dialog-body">
              <div className="confirm-dialog-icon">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 id="confirm-title" className="confirm-dialog-title">{title}</h3>
                <p id="confirm-msg" className="confirm-dialog-message">{message}</p>
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <button className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
              <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
