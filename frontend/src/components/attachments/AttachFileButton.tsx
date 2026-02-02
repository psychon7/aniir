/**
 * Attach File Button Component
 * Reusable button for attaching files to entities
 */
import React, { useRef, useState } from 'react';
import { FormModal } from '@/components/ui/form/FormModal';
import { FormTextarea } from '@/components/ui/form/FormTextarea';
import { useUploadAttachment } from '@/hooks/useAttachments';
import { EntityType } from '@/api/attachments';
import { cn } from '@/lib/utils';

interface AttachFileButtonProps {
  entityType: EntityType;
  entityId: number;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSuccess?: () => void;
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp',
  '.txt', '.zip', '.rar'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Icon components
function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={cn(className, 'animate-spin')} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function AttachFileButton({
  entityType,
  entityId,
  variant = 'outline',
  size = 'default',
  className,
  onSuccess,
}: AttachFileButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadAttachment();

  const handleFileSelect = (file: File) => {
    setValidationError(null);

    // Validate file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        entityType,
        entityId,
        description: description || undefined,
      });

      // Reset and close
      setSelectedFile(null);
      setDescription('');
      setValidationError(null);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    setValidationError(null);
    setOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Button styles based on variant and size
  const buttonVariants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  };

  const buttonSizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={uploadMutation.isPending}
        className="btn-secondary"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || uploadMutation.isPending}
        className={cn(
          'btn-primary inline-flex items-center gap-2',
          (!selectedFile || uploadMutation.isPending) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {uploadMutation.isPending ? (
          <>
            <LoaderIcon className="h-4 w-4" />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon className="h-4 w-4" />
            Upload
          </>
        )}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
      >
        <PaperclipIcon className="h-4 w-4 mr-2" />
        Attach File
      </button>

      <FormModal
        isOpen={open}
        onClose={handleClose}
        title="Attach File"
        description={`Upload a file to attach to this ${entityType.toLowerCase()}.`}
        size="md"
        footer={footer}
      >
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              selectedFile && 'border-green-500 bg-green-50 dark:bg-green-950/20'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleInputChange}
              accept={ALLOWED_EXTENSIONS.join(',')}
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-accent transition-colors"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: 50MB
                </p>
              </>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <FormTextarea
              id="description"
              placeholder="Add a description for this file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}
