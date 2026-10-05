/** Matches backend FileAttachmentDto */
export interface FileAttachment {
  id: string;
  pageId: string;
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
}

/** Upload size & type constraints (mirrored from backend config) */
export const FILE_CONSTRAINTS = {
  /** 20 MB in bytes */
  maxSizeBytes: 20 * 1024 * 1024,
  acceptedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
} as const;
