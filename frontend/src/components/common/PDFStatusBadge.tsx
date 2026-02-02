import React from 'react';
import { FileText, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PDFStatus } from './PDFStatusIndicator';

interface PDFStatusBadgeProps {
  status: PDFStatus;
  generatedAt?: string;
  isGenerating?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusStyles: Record<PDFStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: React.ElementType;
}> = {
  none: {
    label: 'No PDF',
    variant: 'outline',
    className: 'text-gray-500 border-gray-300 bg-gray-50',
    icon: FileText,
  },
  generating: {
    label: 'Generating',
    variant: 'secondary',
    className: 'text-blue-600 border-blue-300 bg-blue-50',
    icon: Loader2,
  },
  ready: {
    label: 'PDF Ready',
    variant: 'default',
    className: 'text-green-600 border-green-300 bg-green-50',
    icon: CheckCircle2,
  },
  error: {
    label: 'Error',
    variant: 'destructive',
    className: 'text-red-600 border-red-300 bg-red-50',
    icon: AlertCircle,
  },
  outdated: {
    label: 'Outdated',
    variant: 'outline',
    className: 'text-amber-600 border-amber-300 bg-amber-50',
    icon: Clock,
  },
};

export function PDFStatusBadge({
  status,
  generatedAt,
  isGenerating = false,
  showLabel = true,
  size = 'md',
  className,
}: PDFStatusBadgeProps) {
  const effectiveStatus = isGenerating ? 'generating' : status;
  const config = statusStyles[effectiveStatus];
  const Icon = config.icon;

  const iconSize = size === 'sm' ? 12 : 14;
  const badgeSize = size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5';

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

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        config.className,
        badgeSize,
        className
      )}
    >
      <Icon
        size={iconSize}
        className={cn(effectiveStatus === 'generating' && 'animate-spin')}
      />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );

  if (generatedAt && effectiveStatus === 'ready') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>Generated: {formatDate(generatedAt)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export default PDFStatusBadge;
