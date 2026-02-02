/**
 * Document Attachments Component
 * Displays a list of attachments for a document entity with download and delete functionality
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useEntityAttachments, useDeleteAttachment } from '@/hooks/useAttachments';
import { EntityType, DocumentAttachment, getAttachmentDownloadUrl } from '@/api/attachments';
import { AttachFileButton } from './AttachFileButton';
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/layout/Card';

interface DocumentAttachmentsProps {
  entityType: EntityType;
  entityId: number;
  className?: string;
  compact?: boolean;
}

// Get file icon based on extension/type
function getFileIcon(fileName: string, fileType: string | null): React.ReactNode {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const iconClass = 'w-8 h-8';

  // PDF
  if (extension === 'pdf' || fileType?.includes('pdf')) {
    return (
      <svg className={cn(iconClass, 'text-red-500')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9 13h2v4H9v-4zm4 0h2v4h-2v-4z" />
      </svg>
    );
  }

  // Word documents
  if (['doc', 'docx'].includes(extension) || fileType?.includes('word')) {
    return (
      <svg className={cn(iconClass, 'text-blue-600')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
      </svg>
    );
  }

  // Excel/spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(extension) || fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
    return (
      <svg className={cn(iconClass, 'text-green-600')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 13h3v2H8v-2zm5 0h3v2h-3v-2zm-5 3h3v2H8v-2zm5 0h3v2h-3v-2z" />
      </svg>
    );
  }

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension) || fileType?.startsWith('image/')) {
    return (
      <svg className={cn(iconClass, 'text-purple-500')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    );
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return (
      <svg className={cn(iconClass, 'text-amber-600')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 7h2v2h-2v2h2v2h-2v2h-2v-2h2v-2H8v-2h2v-2H8v-2h2v2z" />
      </svg>
    );
  }

  // Text files
  if (['txt', 'md', 'rtf'].includes(extension) || fileType?.includes('text')) {
    return (
      <svg className={cn(iconClass, 'text-gray-500')} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h5v2H8v-2z" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={cn(iconClass, 'text-gray-400')} fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
    </svg>
  );
}

// Format file size
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface AttachmentItemProps {
  attachment: DocumentAttachment;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function AttachmentItem({ attachment, onDelete, isDeleting }: AttachmentItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = () => {
    // Use download_url from attachment if available, otherwise construct it
    const downloadUrl = attachment.download_url || getAttachmentDownloadUrl(attachment.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
        {/* File Icon */}
        <div className="flex-shrink-0">
          {getFileIcon(attachment.file_name, attachment.file_type)}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={attachment.file_name}>
            {attachment.file_name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.file_size)}</span>
            <span>-</span>
            <span>{formatDate(attachment.uploaded_at)}</span>
            {attachment.uploader_name && (
              <>
                <span>-</span>
                <span>by {attachment.uploader_name}</span>
              </>
            )}
          </div>
          {attachment.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate" title={attachment.description}>
              {attachment.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
            disabled={isDeleting}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(attachment.id);
          setShowDeleteConfirm(false);
        }}
        itemName={attachment.file_name}
        isLoading={isDeleting}
      />
    </>
  );
}

export function DocumentAttachments({
  entityType,
  entityId,
  className,
  // compact is reserved for future use with a condensed view
  compact: _compact = false,
}: DocumentAttachmentsProps) {
  const { data, isLoading, error } = useEntityAttachments(entityType, entityId);
  const deleteMutation = useDeleteAttachment(entityType, entityId);

  const attachments = data?.items || [];

  const handleDelete = (attachmentId: number) => {
    deleteMutation.mutate(attachmentId);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader
          title="Attachments"
          action={
            <div className="w-24 h-8 bg-muted rounded animate-pulse" />
          }
        />
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2 w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader title="Attachments" />
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Failed to load attachments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main render
  return (
    <Card className={className}>
      <CardHeader
        title="Attachments"
        description={attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''}` : undefined}
        action={
          <AttachFileButton
            entityType={entityType}
            entityId={entityId}
            variant="outline"
            size="sm"
          />
        }
      />
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-6">
            <svg
              className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <p className="text-sm text-muted-foreground">No files attached</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Attach File" to add documents
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <AttachmentItem
                key={attachment.id}
                attachment={attachment}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export a simpler inline version for when you just need the list
export function AttachmentsList({
  entityType,
  entityId,
  className,
}: {
  entityType: EntityType;
  entityId: number;
  className?: string;
}) {
  const { data, isLoading } = useEntityAttachments(entityType, entityId);
  const deleteMutation = useDeleteAttachment(entityType, entityId);

  const attachments = data?.items || [];

  if (isLoading || attachments.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  );
}
