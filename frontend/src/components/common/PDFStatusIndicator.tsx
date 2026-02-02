import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type PDFStatus = 'none' | 'generating' | 'ready' | 'error' | 'outdated';

export interface PDFStatusInfo {
  status: PDFStatus;
  pdfUrl?: string;
  generatedAt?: string;
  errorMessage?: string;
  fileSize?: number;
}

interface PDFStatusIndicatorProps {
  statusInfo: PDFStatusInfo;
  documentType: 'quote' | 'order' | 'invoice' | 'delivery' | 'credit';
  documentId: number;
  documentReference: string;
  onGenerate?: () => void;
  onRegenerate?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
  variant?: 'badge' | 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<PDFStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  none: {
    label: 'No PDF',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: FileText,
  },
  generating: {
    label: 'Generating...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Loader2,
  },
  ready: {
    label: 'PDF Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
  },
  error: {
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
  },
  outdated: {
    label: 'Outdated',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Clock,
  },
};

const sizeConfig = {
  sm: {
    iconSize: 14,
    badgePadding: 'px-1.5 py-0.5',
    fontSize: 'text-xs',
    buttonSize: 'h-6 w-6',
  },
  md: {
    iconSize: 16,
    badgePadding: 'px-2 py-1',
    fontSize: 'text-sm',
    buttonSize: 'h-8 w-8',
  },
  lg: {
    iconSize: 20,
    badgePadding: 'px-3 py-1.5',
    fontSize: 'text-base',
    buttonSize: 'h-10 w-10',
  },
};

export function PDFStatusIndicator({
  statusInfo,
  documentType,
  documentId,
  documentReference,
  onGenerate,
  onRegenerate,
  onView,
  onDownload,
  isGenerating = false,
  variant = 'badge',
  size = 'md',
  className,
}: PDFStatusIndicatorProps) {
  const effectiveStatus = isGenerating ? 'generating' : statusInfo.status;
  const config = statusConfig[effectiveStatus];
  const sizeConf = sizeConfig[size];
  const StatusIcon = config.icon;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center justify-center rounded-full',
                config.bgColor,
                config.borderColor,
                'border',
                sizeConf.buttonSize,
                className
              )}
            >
              <StatusIcon
                size={sizeConf.iconSize}
                className={cn(
                  config.color,
                  effectiveStatus === 'generating' && 'animate-spin'
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{config.label}</p>
              {statusInfo.generatedAt && (
                <p className="text-xs text-muted-foreground">
                  Generated: {formatDate(statusInfo.generatedAt)}
                </p>
              )}
              {statusInfo.fileSize && (
                <p className="text-xs text-muted-foreground">
                  Size: {formatFileSize(statusInfo.fileSize)}
                </p>
              )}
              {statusInfo.errorMessage && (
                <p className="text-xs text-red-500">{statusInfo.errorMessage}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors hover:opacity-80',
              config.bgColor,
              config.borderColor,
              config.color,
              sizeConf.badgePadding,
              sizeConf.fontSize,
              className
            )}
          >
            <StatusIcon
              size={sizeConf.iconSize}
              className={cn(
                'mr-1',
                effectiveStatus === 'generating' && 'animate-spin'
              )}
            />
            {config.label}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {effectiveStatus === 'none' && onGenerate && (
            <DropdownMenuItem onClick={onGenerate}>
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </DropdownMenuItem>
          )}
          {effectiveStatus === 'ready' && (
            <>
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View PDF
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </DropdownMenuItem>
              )}
              {onRegenerate && (
                <DropdownMenuItem onClick={onRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate PDF
                </DropdownMenuItem>
              )}
            </>
          )}
          {effectiveStatus === 'outdated' && (
            <>
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Current PDF
                </DropdownMenuItem>
              )}
              {onRegenerate && (
                <DropdownMenuItem onClick={onRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update PDF
                </DropdownMenuItem>
              )}
            </>
          )}
          {effectiveStatus === 'error' && onRegenerate && (
            <DropdownMenuItem onClick={onRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Generation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full variant with detailed info
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'bg-white shadow-sm'
        )}
      >
        <StatusIcon
          size={20}
          className={cn(
            config.color,
            effectiveStatus === 'generating' && 'animate-spin'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', config.color)}>
            {config.label}
          </span>
          {statusInfo.fileSize && effectiveStatus === 'ready' && (
            <span className="text-xs text-muted-foreground">
              ({formatFileSize(statusInfo.fileSize)})
            </span>
          )}
        </div>
        {statusInfo.generatedAt && effectiveStatus !== 'none' && (
          <p className="text-xs text-muted-foreground truncate">
            {effectiveStatus === 'ready' ? 'Generated' : 'Last attempt'}:{' '}
            {formatDate(statusInfo.generatedAt)}
          </p>
        )}
        {statusInfo.errorMessage && effectiveStatus === 'error' && (
          <p className="text-xs text-red-500 truncate">
            {statusInfo.errorMessage}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {effectiveStatus === 'none' && onGenerate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGenerate}
                  className="h-8 w-8"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate PDF</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {effectiveStatus === 'ready' && (
          <>
            {onView && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onView}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onDownload && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDownload}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onRegenerate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRegenerate}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}

        {(effectiveStatus === 'error' || effectiveStatus === 'outdated') &&
          onRegenerate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRegenerate}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {effectiveStatus === 'error' ? 'Retry' : 'Update PDF'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
      </div>
    </div>
  );
}

export default PDFStatusIndicator;
