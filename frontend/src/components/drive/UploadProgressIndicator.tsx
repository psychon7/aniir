import React, { useCallback, useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, FileIcon, Loader2, Pause, Play, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Upload status types
export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';

// Single file upload state
export interface FileUploadState {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  uploadedBytes: number;
  totalBytes: number;
  startTime?: number;
  speed?: number; // bytes per second
  estimatedTimeRemaining?: number; // seconds
  abortController?: AbortController;
}

// Props for the upload progress indicator
interface UploadProgressIndicatorProps {
  uploads: FileUploadState[];
  onCancel: (uploadId: string) => void;
  onRetry: (uploadId: string) => void;
  onPause?: (uploadId: string) => void;
  onResume?: (uploadId: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onClose?: () => void;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

// Format bytes to human readable
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format time remaining
function formatTimeRemaining(seconds: number): string {
  if (!seconds || seconds === Infinity) return '--:--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Get file icon based on type
function getFileTypeIcon(file: File): React.ReactNode {
  const type = file.type;
  if (type.startsWith('image/')) {
    return <FileIcon className="h-4 w-4 text-blue-500" />;
  }
  if (type.startsWith('video/')) {
    return <FileIcon className="h-4 w-4 text-purple-500" />;
  }
  if (type.includes('pdf')) {
    return <FileIcon className="h-4 w-4 text-red-500" />;
  }
  if (type.includes('spreadsheet') || type.includes('excel')) {
    return <FileIcon className="h-4 w-4 text-green-500" />;
  }
  if (type.includes('document') || type.includes('word')) {
    return <FileIcon className="h-4 w-4 text-blue-600" />;
  }
  return <FileIcon className="h-4 w-4 text-gray-500" />;
}

// Status badge component
function StatusBadge({ status }: { status: UploadStatus }) {
  const variants: Record<UploadStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'secondary', label: 'En attente' },
    uploading: { variant: 'default', label: 'En cours' },
    paused: { variant: 'outline', label: 'En pause' },
    completed: { variant: 'default', label: 'Terminé' },
    error: { variant: 'destructive', label: 'Erreur' },
    cancelled: { variant: 'secondary', label: 'Annulé' },
  };

  const { variant, label } = variants[status];

  return (
    <Badge 
      variant={variant} 
      className={cn(
        'text-xs',
        status === 'completed' && 'bg-green-500 hover:bg-green-600'
      )}
    >
      {label}
    </Badge>
  );
}

// Single upload item component
interface UploadItemProps {
  upload: FileUploadState;
  onCancel: () => void;
  onRetry: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

function UploadItem({ upload, onCancel, onRetry, onPause, onResume }: UploadItemProps) {
  const { file, progress, status, error, uploadedBytes, totalBytes, speed, estimatedTimeRemaining } = upload;

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getFileTypeIcon(file)}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{file.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <StatusBadge status={status} />
          </div>

          {/* Progress info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}</span>
            {status === 'uploading' && speed && (
              <>
                <span>•</span>
                <span>{formatBytes(speed)}/s</span>
              </>
            )}
            {status === 'uploading' && estimatedTimeRemaining && (
              <>
                <span>•</span>
                <span>{formatTimeRemaining(estimatedTimeRemaining)} restant</span>
              </>
            )}
          </div>

          {/* Error message */}
          {status === 'error' && error && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {status === 'uploading' && onPause && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
                    <Pause className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mettre en pause</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {status === 'paused' && onResume && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResume}>
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reprendre</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {status === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRetry}>
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Réessayer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {(status === 'pending' || status === 'uploading' || status === 'paused') && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onCancel}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Annuler</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(status === 'uploading' || status === 'paused' || status === 'pending') && (
        <Progress 
          value={progress} 
          className={cn(
            'h-1.5',
            status === 'paused' && 'opacity-50'
          )}
        />
      )}
    </div>
  );
}

// Main upload progress indicator component
export function UploadProgressIndicator({
  uploads,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onClearCompleted,
  onClearAll,
  onClose,
  className,
  minimized = false,
  onToggleMinimize,
}: UploadProgressIndicatorProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate overall progress
  const totalBytes = uploads.reduce((sum, u) => sum + u.totalBytes, 0);
  const uploadedBytes = uploads.reduce((sum, u) => sum + u.uploadedBytes, 0);
  const overallProgress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  // Count by status
  const counts = {
    pending: uploads.filter(u => u.status === 'pending').length,
    uploading: uploads.filter(u => u.status === 'uploading').length,
    completed: uploads.filter(u => u.status === 'completed').length,
    error: uploads.filter(u => u.status === 'error').length,
    paused: uploads.filter(u => u.status === 'paused').length,
    cancelled: uploads.filter(u => u.status === 'cancelled').length,
  };

  const activeUploads = counts.pending + counts.uploading + counts.paused;
  const hasCompleted = counts.completed > 0;
  const hasErrors = counts.error > 0;

  // Don't render if no uploads
  if (uploads.length === 0) {
    return null;
  }

  // Minimized view
  if (minimized) {
    return (
      <div 
        className={cn(
          'fixed bottom-4 right-4 z-50',
          className
        )}
      >
        <Button
          variant="default"
          className="shadow-lg flex items-center gap-2"
          onClick={onToggleMinimize}
        >
          {activeUploads > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{activeUploads} upload{activeUploads > 1 ? 's' : ''} en cours</span>
              <span className="text-xs opacity-75">({overallProgress}%)</span>
            </>
          ) : hasErrors ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>{counts.error} erreur{counts.error > 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>{counts.completed} terminé{counts.completed > 1 ? 's' : ''}</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        'fixed bottom-4 right-4 z-50 w-[400px] shadow-xl',
        className
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">
                Téléchargements
              </CardTitle>
              {activeUploads > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeUploads} en cours
                </Badge>
              )}
              {hasCompleted && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {counts.completed} terminé{counts.completed > 1 ? 's' : ''}
                </Badge>
              )}
              {hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  {counts.error} erreur{counts.error > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {onToggleMinimize && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleMinimize}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          {activeUploads > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progression globale</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {uploads.map((upload) => (
                  <UploadItem
                    key={upload.id}
                    upload={upload}
                    onCancel={() => onCancel(upload.id)}
                    onRetry={() => onRetry(upload.id)}
                    onPause={onPause ? () => onPause(upload.id) : undefined}
                    onResume={onResume ? () => onResume(upload.id) : undefined}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
              {hasCompleted && (
                <Button variant="outline" size="sm" onClick={onClearCompleted}>
                  Effacer terminés
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClearAll}>
                Tout effacer
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default UploadProgressIndicator;
