'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, File, CheckCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';

export function UploadDialog() {
  const { isUploadOpen, closeUploadDialog, uploadCallback } = useUIStore();
  const { addToast } = useToastStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Esc to close
  useEffect(() => {
    if (!isUploadOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeUploadDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUploadOpen, closeUploadDialog]);

  // Reset state when opening
  useEffect(() => {
    if (isUploadOpen) {
      setIsUploading(false);
      setUploadProgress(0);
      setIsDragging(false);
    }
  }, [isUploadOpen]);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = (file: File) => {
    if (isUploading) return;
    
    // Check if it's an image
    const isImage = file.type.startsWith('image/');

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        completeUpload(file, isImage);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);
  };

  const completeUpload = (file: File, isImage: boolean) => {
    setTimeout(() => {
      setIsUploading(false);
      
      // Mock URL generation - in a real app, this would be the URL from your backend/S3
      const url = URL.createObjectURL(file); 
      // For images, we can use object URL temporarily, or just mock a random unsplash for testing:
      const finalUrl = isImage ? `https://source.unsplash.com/random/800x600?sig=${Math.random()}` : url;

      if (uploadCallback) {
        uploadCallback(finalUrl);
      }

      addToast({ message: 'Upload successful', type: 'success' });
      closeUploadDialog();
    }, 500);
  };

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
            <div className="modal-header">
              <span className="modal-title">Upload</span>
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
              {!isUploading ? (
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
                    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
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
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <UploadCloud size={32} style={{ color: isDragging ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Click or drag file to this area to upload
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Support for a single or bulk upload. Strictly prohibited from uploading company data or other banned files.
                  </p>
                </div>
              ) : (
                <div className="upload-progress-container" style={{ padding: '20px 0', textAlign: 'center' }}>
                  {uploadProgress < 100 ? (
                    <>
                      <File size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 16px' }} />
                      <div className="upload-progress-bar" style={{ height: '6px', background: 'var(--color-bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
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
                        Uploading... {Math.round(uploadProgress)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={32} style={{ color: 'var(--color-success)', margin: '0 auto 16px' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        Upload Complete
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
