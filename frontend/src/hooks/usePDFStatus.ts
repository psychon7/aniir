import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PDFStatus, PDFStatusInfo } from '@/components/common/PDFStatusIndicator';

export type DocumentType = 'quote' | 'order' | 'invoice' | 'delivery' | 'credit';

interface PDFStatusResponse {
  document_id: number;
  document_type: string;
  status: PDFStatus;
  pdf_url: string | null;
  generated_at: string | null;
  file_size: number | null;
  error_message: string | null;
}

interface GeneratePDFResponse {
  success: boolean;
  pdf_url: string;
  generated_at: string;
  file_size: number;
}

// Query key factory
export const pdfStatusKeys = {
  all: ['pdf-status'] as const,
  byDocument: (type: DocumentType, id: number) => 
    [...pdfStatusKeys.all, type, id] as const,
  byType: (type: DocumentType) => 
    [...pdfStatusKeys.all, type] as const,
};

// Transform API response to frontend format
function transformPDFStatus(response: PDFStatusResponse): PDFStatusInfo {
  return {
    status: response.status,
    pdfUrl: response.pdf_url || undefined,
    generatedAt: response.generated_at || undefined,
    fileSize: response.file_size || undefined,
    errorMessage: response.error_message || undefined,
  };
}

// Get PDF status for a single document
export function usePDFStatus(documentType: DocumentType, documentId: number) {
  return useQuery({
    queryKey: pdfStatusKeys.byDocument(documentType, documentId),
    queryFn: async (): Promise<PDFStatusInfo> => {
      const response = await api.get<PDFStatusResponse>(
        `/documents/${documentType}s/${documentId}/pdf/status`
      );
      return transformPDFStatus(response.data);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Poll more frequently if generating
      const data = query.state.data;
      if (data?.status === 'generating') {
        return 2000; // 2 seconds
      }
      return false;
    },
  });
}

// Generate PDF mutation
export function useGeneratePDF(documentType: DocumentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number): Promise<GeneratePDFResponse> => {
      const response = await api.post<GeneratePDFResponse>(
        `/documents/${documentType}s/${documentId}/pdf/generate`
      );
      return response.data;
    },
    onMutate: async (documentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: pdfStatusKeys.byDocument(documentType, documentId),
      });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData<PDFStatusInfo>(
        pdfStatusKeys.byDocument(documentType, documentId)
      );

      // Optimistically update to generating
      queryClient.setQueryData<PDFStatusInfo>(
        pdfStatusKeys.byDocument(documentType, documentId),
        {
          status: 'generating',
          pdfUrl: previousStatus?.pdfUrl,
          generatedAt: previousStatus?.generatedAt,
        }
      );

      return { previousStatus };
    },
    onSuccess: (data, documentId) => {
      // Update with the new PDF info
      queryClient.setQueryData<PDFStatusInfo>(
        pdfStatusKeys.byDocument(documentType, documentId),
        {
          status: 'ready',
          pdfUrl: data.pdf_url,
          generatedAt: data.generated_at,
          fileSize: data.file_size,
        }
      );
    },
    onError: (error, documentId, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(
          pdfStatusKeys.byDocument(documentType, documentId),
          {
            ...context.previousStatus,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Generation failed',
          }
        );
      }
    },
  });
}

// Regenerate PDF (same as generate but with different semantics)
export function useRegeneratePDF(documentType: DocumentType) {
  return useGeneratePDF(documentType);
}

// Download PDF
export function useDownloadPDF() {
  return useMutation({
    mutationFn: async ({
      documentType,
      documentId,
      reference,
    }: {
      documentType: DocumentType;
      documentId: number;
      reference: string;
    }) => {
      const response = await api.get(
        `/documents/${documentType}s/${documentId}/pdf/download`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    },
  });
}

// View PDF in new tab
export function useViewPDF() {
  return useMutation({
    mutationFn: async ({
      documentType,
      documentId,
    }: {
      documentType: DocumentType;
      documentId: number;
    }) => {
      const response = await api.get<{ url: string }>(
        `/documents/${documentType}s/${documentId}/pdf/view-url`
      );
      
      // Open in new tab
      window.open(response.data.url, '_blank');
      
      return true;
    },
  });
}

// Batch check PDF status for multiple documents
export function useBatchPDFStatus(
  documentType: DocumentType,
  documentIds: number[]
) {
  return useQuery({
    queryKey: [...pdfStatusKeys.byType(documentType), 'batch', documentIds],
    queryFn: async (): Promise<Map<number, PDFStatusInfo>> => {
      if (documentIds.length === 0) {
        return new Map();
      }

      const response = await api.post<PDFStatusResponse[]>(
        `/documents/${documentType}s/pdf/batch-status`,
        { document_ids: documentIds }
      );

      const statusMap = new Map<number, PDFStatusInfo>();
      response.data.forEach((item) => {
        statusMap.set(item.document_id, transformPDFStatus(item));
      });

      return statusMap;
    },
    enabled: documentIds.length > 0,
    staleTime: 30 * 1000,
  });
}
