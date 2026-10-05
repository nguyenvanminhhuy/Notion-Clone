'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';
import { fileService } from '../../services/fileService';
import { FILE_CONSTRAINTS } from '../../types/file';
import { ApiError } from '../../services/api/apiError';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDialog() {
  const { isUploadOpen, closeUploadDialog, uploadCallback, uploadPageId } = useUIStore();
  const { addToast } = useToastStore();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isUploadOpen) {
      setUploadState('idle');
      setUploadProgress(0);
      setUploadError(null);
      setSelectedFile(null);
      setIsDragging(false);
    }
  }, [isUploadOpen]);

  // Esc to close (only when not uploading)
  useEffect(() => {
    if (!isUploadOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uploadState !== 'uploading') closeUploadDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadOpen, uploadState, closeUploadDialog]);

  const validateFile = (file: File): string | null => {
    if (file.size > FILE_CONSTRAINTS.maxSizeBytes) {
      return `File too large. Maximum size is ${formatBytes(FILE_CONSTRAINTS.maxSizeBytes)}.`;
    }
    const allowed = FILE_CONSTRAINTS.acceptedMimeTypes as readonly string[];
    if (!allowed.includes(file.type) && file.type !== '') {
      return `Unsupported file type: ${file.type || 'unknown'}`;
    }
    return null;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        setUploadState('error');
        return;
      }

      setSelectedFile(file);
      setUploadState('uploading');
      setUploadProgress(0);
      setUploadError(null);

      try {
        let fileUrl: string;

        if (uploadPageId) {
          // Upload to real backend
          const attachment = await fileService.uploadFile(file, uploadPageId, (pct) => {
            setUploadProgress(pct);
          });
          // Use the download URL so Tiptap image extension can render it
          fileUrl = fileService.getDownloadUrl(attachment.id);
        } else {
          // No pageId context — use object URL as fallback (e.g. cover photo, icon)
          // Upload to backend without attaching to a specific page is not supported;
          // fall back to creating an object URL for immediate preview.
          fileUrl = URL.createObjectURL(file);
          // Simulate progress for UX consistency
          await new Promise<void>((resolve) => {
            let pct = 0;
            const interval = setInterval(() => {
              pct = Math.min(pct + Math.random() * 25, 100);
              setUploadProgress(Math.round(pct));
              if (pct >= 100) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
          });
        }

        setUploadProgress(100);
        setUploadState('success');

        setTimeout(() => {
          uploadCallback?.(fileUrl);
          addToast({ message: 'Upload successful', type: 'success' });
          closeUploadDialog();
        }, 600);
      } catch (err) {
        let message = 'Upload failed. Please try again.';
        if (err instanceof ApiError) {
          if (err.statusCode === 413) {
            message = 'File too large for the server.';
          } else if (err.statusCode === 415) {
            message = 'Unsupported file type.';
          } else if (err.statusCode === 403) {
            message = 'You do not have permission to upload files to this page.';
          } else if (err.statusCode === 404) {
            message = 'Page not found.';
          } else if (err.isNetworkError) {
            message = 'Network error. Check your connection and try again.';
          } else {
            message = err.message || message;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        console.error('[UploadDialog] Upload failed:', err);
        setUploadError(message);
        setUploadState('error');
        addToast({ message, type: 'error' });
      }
    },
    [uploadPageId, uploadCallback, addToast, closeUploadDialog]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';
  };

  const handleRetry = () => {
    setUploadState('idle');
    setUploadError(null);
    setUploadProgress(0);
    setSelectedFile(null);
  };

  const isUploading = uploadState === 'uploading';

  return (
    <AnimatePresence>
      {isUploadOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUploading) closeUploadDialog();
          }}
          aria-modal="true"
          role="dialog"
          aria-label="Upload File"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="modal-panel upload-dialog"
            style={{ maxWidth: '480px' }}
          >
            {/* Header */}
            <div className="modal-header">
              <span className="modal-title">Upload File</span>
              <button
                className="topbar-icon-btn"
                onClick={closeUploadDialog}
                disabled={isUploading}
                aria-label="Close upload dialog"
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body p-6">
              {/* IDLE: Drop zone */}
              {uploadState === 'idle' && (
                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition:
                      'border-color var(--transition-fast), background-color var(--transition-fast)',
                    backgroundColor: isDragging ? 'var(--color-bg-hover)' : 'transparent',
                    borderColor: isDragging ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*, application/pdf, .doc, .docx, .txt"
                    aria-label="Choose file to upload"
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <UploadCloud
                      size={32}
                      style={{
                        color: isDragging
                          ? 'var(--color-accent)'
                          : 'var(--color-text-tertiary)',
                      }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    Click or drag file to upload
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Images and PDF — max {formatBytes(FILE_CONSTRAINTS.maxSizeBytes)}
                  </p>
                </div>
              )}

              {/* UPLOADING: Progress bar */}
              {uploadState === 'uploading' && (
                <div
                  className="upload-progress-container"
                  style={{ padding: '20px 0', textAlign: 'center' }}
                >
                  <FileIcon
                    size={32}
                    style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 16px' }}
                  />
                  {selectedFile && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '12px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {selectedFile.name}
                    </p>
                  )}
                  <div
                    className="upload-progress-bar"
                    style={{
                      height: '6px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      className="upload-progress-fill"
                      style={{
                        height: '100%',
                        background: 'var(--color-accent)',
                        width: `${uploadProgress}%`,
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Uploading… {uploadProgress}%
                  </span>
                </div>
              )}

              {/* SUCCESS */}
              {uploadState === 'success' && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <CheckCircle
                    size={32}
                    style={{ color: 'var(--color-success)', margin: '0 auto 12px' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Upload Complete
                  </span>
                </div>
              )}

              {/* ERROR */}
              {uploadState === 'error' && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <AlertCircle
                    size={32}
                    style={{ color: 'var(--color-danger)', margin: '0 auto 12px' }}
                  />
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--color-danger)',
                      marginBottom: '16px',
                    }}
                  >
                    {uploadError}
                  </p>
                  <button
                    onClick={handleRetry}
                    style={{
                      padding: '8px 20px',
                      background: 'var(--color-accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
