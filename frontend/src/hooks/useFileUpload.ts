import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadState, UploadStatus } from '@/components/drive/UploadProgressIndicator';

interface UseFileUploadOptions {
  endpoint: string;
  maxConcurrent?: number;
  chunkSize?: number;
  onUploadComplete?: (uploadId: string, response: any) => void;
  onUploadError?: (uploadId: string, error: Error) => void;
  onAllComplete?: () => void;
}

interface UseFileUploadReturn {
  uploads: FileUploadState[];
  addFiles: (files: File[], metadata?: Record<string, any>) => void;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => void;
  pauseUpload: (uploadId: string) => void;
  resumeUpload: (uploadId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  isUploading: boolean;
}

export function useFileUpload({
  endpoint,
  maxConcurrent = 3,
  chunkSize = 1024 * 1024, // 1MB chunks
  onUploadComplete,
  onUploadError,
  onAllComplete,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const uploadQueueRef = useRef<string[]>([]);
  const metadataRef = useRef<Map<string, Record<string, any>>>(new Map());

  // Update a single upload state
  const updateUpload = useCallback((uploadId: string, updates: Partial<FileUploadState>) => {
    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, ...updates } : u
    ));
  }, []);

  // Process upload queue
  const processQueue = useCallback(() => {
    if (activeUploadsRef.current.size >= maxConcurrent) return;
    if (uploadQueueRef.current.length === 0) {
      // Check if all uploads are complete
      setUploads(prev => {
        const allComplete = prev.every(u => 
          u.status === 'completed' || u.status === 'error' || u.status === 'cancelled'
        );
        if (allComplete && prev.length > 0 && onAllComplete) {
          setTimeout(onAllComplete, 0);
        }
        return prev;
      });
      return;
    }

    const nextUploadId = uploadQueueRef.current.shift();
    if (!nextUploadId) return;

    activeUploadsRef.current.add(nextUploadId);
    startUpload(nextUploadId);
  }, [maxConcurrent, onAllComplete]);

  // Start uploading a file
  const startUpload = useCallback(async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;

    const abortController = new AbortController();
    const startTime = Date.now();

    updateUpload(uploadId, {
      status: 'uploading',
      startTime,
      abortController,
    });

    try {
      const formData = new FormData();
      formData.append('file', upload.file);

      // Add metadata if available
      const metadata = metadataRef.current.get(uploadId);
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
      }

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = event.loaded / elapsed;
            const remaining = (event.total - event.loaded) / speed;

            updateUpload(uploadId, {
              progress,
              uploadedBytes: event.loaded,
              speed,
              estimatedTimeRemaining: remaining,
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', endpoint);
        
        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });

      // Handle abort signal
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      const response = await uploadPromise;

      updateUpload(uploadId, {
        status: 'completed',
        progress: 100,
        uploadedBytes: upload.totalBytes,
      });

      if (onUploadComplete) {
        onUploadComplete(uploadId, response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'Upload cancelled') {
        updateUpload(uploadId, {
          status: 'cancelled',
        });
      } else {
        updateUpload(uploadId, {
          status: 'error',
          error: errorMessage,
        });

        if (onUploadError) {
          onUploadError(uploadId, error instanceof Error ? error : new Error(errorMessage));
        }
      }
    } finally {
      activeUploadsRef.current.delete(uploadId);
      processQueue();
    }
  }, [uploads, endpoint, updateUpload, onUploadComplete, onUploadError, processQueue]);

  // Add files to upload queue
  const addFiles = useCallback((files: File[], metadata?: Record<string, any>) => {
    const newUploads: FileUploadState[] = files.map(file => {
      const id = uuidv4();
      
      if (metadata) {
        metadataRef.current.set(id, metadata);
      }

      return {
        id,
        file,
        progress: 0,
        status: 'pending' as UploadStatus,
        uploadedBytes: 0,
        totalBytes: file.size,
      };
    });

    setUploads(prev => [...prev, ...newUploads]);
    
    // Add to queue
    newUploads.forEach(u => {
      uploadQueueRef.current.push(u.id);
    });

    // Start processing
    setTimeout(processQueue, 0);
  }, [processQueue]);

  // Cancel an upload
  const cancelUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;

    if (upload.abortController) {
      upload.abortController.abort();
    }

    // Remove from queue if pending
    uploadQueueRef.current = uploadQueueRef.current.filter(id => id !== uploadId);

    updateUpload(uploadId, {
      status: 'cancelled',
    });
  }, [uploads, updateUpload]);

  // Retry a failed upload
  const retryUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status !== 'error') return;

    updateUpload(uploadId, {
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      error: undefined,
    });

    uploadQueueRef.current.push(uploadId);
    processQueue();
  }, [uploads, updateUpload, processQueue]);

  // Pause an upload (simplified - just cancels and marks as paused)
  const pauseUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status !== 'uploading') return;

    if (upload.abortController) {
      upload.abortController.abort();
    }

    activeUploadsRef.current.delete(uploadId);

    updateUpload(uploadId, {
      status: 'paused',
    });
  }, [uploads, updateUpload]);

  // Resume a paused upload
  const resumeUpload = useCallback((uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status !== 'paused') return;

    updateUpload(uploadId, {
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
    });

    uploadQueueRef.current.push(uploadId);
    processQueue();
  }, [uploads, updateUpload, processQueue]);

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => 
      u.status !== 'completed' && u.status !== 'cancelled'
    ));
  }, []);

  // Clear all uploads
  const clearAll = useCallback(() => {
    // Cancel all active uploads
    uploads.forEach(upload => {
      if (upload.abortController) {
        upload.abortController.abort();
      }
    });

    activeUploadsRef.current.clear();
    uploadQueueRef.current = [];
    metadataRef.current.clear();
    setUploads([]);
  }, [uploads]);

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return {
    uploads,
    addFiles,
    cancelUpload,
    retryUpload,
    pauseUpload,
    resumeUpload,
    clearCompleted,
    clearAll,
    isUploading,
  };
}

export default useFileUpload;
