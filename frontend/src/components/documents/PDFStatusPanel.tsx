import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, RefreshCw, ExternalLink } from 'lucide-react';
import { PDFStatusIndicator, type PDFStatusInfo } from '@/components/common/PDFStatusIndicator';
import { useGeneratePDF, useDownloadPDF, useViewPDF, type DocumentType } from '@/hooks/usePDFStatus';
import { useToast } from '@/hooks/use-toast';

interface PDFStatusPanelProps {
  statusInfo: PDFStatusInfo;
  documentType: DocumentType;
  documentId: number;
  documentReference: string;
  className?: string;
}

/**
 * Full panel component for document detail pages
 * Shows PDF status with all available actions
 */
export function PDFStatusPanel({
  statusInfo,
  documentType,
  documentId,
  documentReference,
  className,
}: PDFStatusPanelProps) {
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
      toast({
        title: 'Download Started',
        description: `Downloading ${documentReference}.pdf`,
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

  const isGenerating = generatePDF.isPending;
  const effectiveStatus = isGenerating ? 'generating' : statusInfo.status;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          PDF Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PDFStatusIndicator
          statusInfo={statusInfo}
          documentType={documentType}
          documentId={documentId}
          documentReference={documentReference}
          isGenerating={isGenerating}
          variant="full"
          size="md"
        />

        <Separator />

        <div className="flex flex-wrap gap-2">
          {effectiveStatus === 'none' && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          )}

          {effectiveStatus === 'ready' && (
            <>
              <Button
                variant="outline"
                onClick={handleView}
                disabled={viewPDF.isPending}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloadPDF.isPending}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                onClick={handleGenerate}
                disabled={isGenerating}
                size="icon"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          )}

          {effectiveStatus === 'outdated' && (
            <>
              <Button
                variant="outline"
                onClick={handleView}
                disabled={viewPDF.isPending}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Current
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update PDF
              </Button>
            </>
          )}

          {effectiveStatus === 'error' && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="destructive"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Generation
            </Button>
          )}

          {effectiveStatus === 'generating' && (
            <Button disabled className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
          )}
        </div>

        {statusInfo.pdfUrl && effectiveStatus === 'ready' && (
          <div className="pt-2">
            <a
              href={statusInfo.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open in new tab
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PDFStatusPanel;
