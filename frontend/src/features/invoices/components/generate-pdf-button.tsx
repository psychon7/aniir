import React, { useState } from 'react';
import { FileDown, FileText, Loader2, Eye, Download, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useGenerateInvoicePdf,
  useDownloadInvoicePdf,
  usePreviewInvoicePdf,
} from '../api/invoice-pdf-api';

interface GeneratePdfButtonProps {
  invoiceId: number;
  invoiceReference?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
  className?: string;
}

export function GeneratePdfButton({
  invoiceId,
  invoiceReference,
  variant = 'outline',
  size = 'default',
  showDropdown = true,
  className,
}: GeneratePdfButtonProps) {
  const generatePdf = useGenerateInvoicePdf();
  const downloadPdf = useDownloadInvoicePdf();
  const previewPdf = usePreviewInvoicePdf();

  const isLoading = generatePdf.isPending || downloadPdf.isPending || previewPdf.isPending;

  const handleGenerate = () => {
    generatePdf.mutate({ invoiceId, store: true });
  };

  const handleDownload = () => {
    downloadPdf.mutate(invoiceId);
  };

  const handlePreview = () => {
    previewPdf.mutate(invoiceId);
  };

  if (!showDropdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleDownload}
              disabled={isLoading}
              className={className}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {size !== 'icon' && <span className="ml-2">Generate PDF</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate and download invoice PDF</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {size !== 'icon' && <span className="ml-2">PDF</span>}
          <MoreVertical className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleDownload} disabled={downloadPdf.isPending}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePreview} disabled={previewPdf.isPending}>
          <Eye className="h-4 w-4 mr-2" />
          Preview PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleGenerate} disabled={generatePdf.isPending}>
          <FileDown className="h-4 w-4 mr-2" />
          Generate & Store
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple download button variant
export function DownloadPdfButton({
  invoiceId,
  invoiceReference,
  variant = 'default',
  size = 'default',
  className,
}: Omit<GeneratePdfButtonProps, 'showDropdown'>) {
  const downloadPdf = useDownloadInvoicePdf();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => downloadPdf.mutate(invoiceId)}
      disabled={downloadPdf.isPending}
      className={className}
    >
      {downloadPdf.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Download PDF
    </Button>
  );
}

// Icon-only button for compact layouts
export function PdfIconButton({
  invoiceId,
  action = 'download',
  className,
}: {
  invoiceId: number;
  action?: 'download' | 'preview' | 'generate';
  className?: string;
}) {
  const downloadPdf = useDownloadInvoicePdf();
  const previewPdf = usePreviewInvoicePdf();
  const generatePdf = useGenerateInvoicePdf();

  const handleClick = () => {
    switch (action) {
      case 'download':
        downloadPdf.mutate(invoiceId);
        break;
      case 'preview':
        previewPdf.mutate(invoiceId);
        break;
      case 'generate':
        generatePdf.mutate({ invoiceId, store: true });
        break;
    }
  };

  const isLoading =
    (action === 'download' && downloadPdf.isPending) ||
    (action === 'preview' && previewPdf.isPending) ||
    (action === 'generate' && generatePdf.isPending);

  const Icon = action === 'preview' ? Eye : action === 'generate' ? FileText : FileDown;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {action === 'preview'
              ? 'Preview PDF'
              : action === 'generate'
              ? 'Generate PDF'
              : 'Download PDF'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
