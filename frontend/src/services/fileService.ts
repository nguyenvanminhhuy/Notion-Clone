import { httpClient } from './api/httpClient';
import type { FileAttachment } from '../types/file';
import { ApiError } from './api/apiError';

// Backend DTO shape (camelCase from ASP.NET Core JSON serialization)
interface BackendFileAttachmentDto {
  id: string;
  pageId: string;
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
}

function mapFile(dto: BackendFileAttachmentDto): FileAttachment {
  return {
    id: dto.id,
    pageId: dto.pageId,
    name: dto.name,
    url: dto.url,
    sizeBytes: dto.sizeBytes,
    mimeType: dto.mimeType,
    uploadedById: dto.uploadedById,
    createdAt: dto.createdAt,
  };
}

export const fileService = {
  /**
   * Upload a file attachment for a page.
   * POST /api/files  (multipart/form-data)
   *
   * @param file   - The browser File object to upload
   * @param pageId - The page this file is attached to
   * @param onProgress - Optional progress callback (0-100)
   */
  async uploadFile(
    file: File,
    pageId: string,
    onProgress?: (percent: number) => void
  ): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('pageId', pageId);

    // Use XMLHttpRequest to support progress events
    if (onProgress) {
      return new Promise<FileAttachment>((resolve, reject) => {
        const tokenProvider = httpClient.getTokenProvider();
        const baseUrl =
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
        const url = `${baseUrl}/api/files`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);

        // Set Authorization header
        const token = tokenProvider?.getAccessToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const dto: BackendFileAttachmentDto = JSON.parse(xhr.responseText);
              resolve(mapFile(dto));
            } catch {
              reject(new ApiError('Invalid response from server', xhr.status));
            }
          } else {
            let message = `Upload failed (${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText);
              message = body?.message || body?.title || message;
            } catch {
              // ignore parse errors
            }
            reject(new ApiError(message, xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(ApiError.networkError('Could not connect to the backend server'));
        };

        xhr.ontimeout = () => {
          reject(new ApiError('Upload timed out', 408));
        };

        xhr.timeout = 120_000; // 2 minutes
        xhr.send(formData);
      });
    }

    // Fallback: use httpClient (no progress tracking)
    const dto = await httpClient.request<BackendFileAttachmentDto>('/api/files', {
      method: 'POST',
      body: formData,
    });
    return mapFile(dto);
  },

  /**
   * Get metadata for an uploaded file.
   * GET /api/files/{id}
   */
  async getFileMetadata(fileId: string): Promise<FileAttachment> {
    const dto = await httpClient.get<BackendFileAttachmentDto>(`/api/files/${fileId}`);
    return mapFile(dto);
  },

  /**
   * Get all files attached to a page.
   * GET /api/pages/{pageId}/files
   */
  async getPageFiles(pageId: string): Promise<FileAttachment[]> {
    const list = await httpClient.get<BackendFileAttachmentDto[]>(`/api/pages/${pageId}/files`);
    return list.map(mapFile);
  },

  /**
   * Get the public download URL for a file.
   * GET /api/files/{id}/download  (AllowAnonymous on backend)
   */
  getDownloadUrl(fileId: string): string {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(
      /\/+$/,
      ''
    );
    return `${baseUrl}/api/files/${fileId}/download`;
  },

  /**
   * Delete an uploaded file.
   * DELETE /api/files/{id}
   */
  async deleteFile(fileId: string): Promise<void> {
    await httpClient.delete(`/api/files/${fileId}`);
  },
};
