import React from 'react';
import { PDFStatusBadge } from './PDFStatusBadge';
import { PDFStatusIndicator, type PDFStatusInfo } from './PDFStatusIndicator';
import { useGeneratePDF, useDownloadPDF, useViewPDF, type DocumentType } from '@/hooks/usePDFStatus';
import { useToast } from '@/hooks/use-toast';

interface PDFStatusCellProps {
  statusInfo: PDFStatusInfo;
  documentType: DocumentType;
  documentId: number;
  documentReference: string;
  variant?: 'badge' | 'icon' | 'full';
  size?: 'sm' | 'md';
}

/**
 * Table cell component for displaying PDF status with actions
 * Use in DataTable columns for quotes, orders, invoices
 */
export function PDFStatusCell({
  statusInfo,
  documentType,
  documentId,
  documentReference,
  variant = 'badge',
  size = 'sm',
}: PDFStatusCellProps) {
  const { toast } = useToast();
  const generatePDF = useGeneratePDF(documentType);
  const downloadPDF = useDownloadPDF();
  const viewPDF = useViewPDF();

  const handleGenerate = async () => {
    try {
      await generatePDF.mutateAsync(documentId);
      toast({
        title: 'PDF Generated',
        description: `PDF for ${documentReference} has been generated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async () => {
    try {
      await downloadPDF.mutateAsync({
        documentType,
        documentId,
        reference: documentReference,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handleView = async () => {
    try {
      await viewPDF.mutateAsync({
        documentType,
        documentId,
      });
    } catch (error) {
      toast({
        title: 'View Failed',
        description: error instanceof Error ? error.message : 'Failed to open PDF',
        variant: 'destructive',
      });
    }
  };

  if (variant === 'badge') {
    return (
      <PDFStatusBadge
        status={statusInfo.status}
        generatedAt={statusInfo.generatedAt}
        isGenerating={generatePDF.isPending}
        size={size}
      />
    );
  }

  return (
    <PDFStatusIndicator
      statusInfo={statusInfo}
      documentType={documentType}
      documentId={documentId}
      documentReference={documentReference}
      onGenerate={handleGenerate}
      onRegenerate={handleGenerate}
      onView={handleView}
      onDownload={handleDownload}
      isGenerating={generatePDF.isPending}
      variant={variant}
      size={size === 'sm' ? 'sm' : 'md'}
    />
  );
}

export default PDFStatusCell;
