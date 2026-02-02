/**
 * PDF API hooks for generating and downloading PDFs
 */

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Types
export type DocumentType = 'invoice' | 'quote' | 'order';

export interface PDFGenerateResponse {
  success: boolean;
  message: string;
  storage_url: string | null;
  filename: string;
}

interface GeneratePDFParams {
  documentType: DocumentType;
  documentId: number;
  saveToStorage?: boolean;
}

interface DownloadPDFParams {
  documentType: DocumentType;
  documentId: number;
  filename?: string;
}

/**
 * Hook for generating PDF and saving to storage
 */
export function useGeneratePDF() {
  return useMutation({
    mutationFn: async ({ documentType, documentId, saveToStorage = true }: GeneratePDFParams) => {
      const response = await api.post<PDFGenerateResponse>(
        `/pdf/generate/${documentType}/${documentId}`,
        null,
        { params: { save_to_storage: saveToStorage } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('PDF generated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to generate PDF';
      toast.error(message);
    },
  });
}

/**
 * Hook for downloading PDF directly
 */
export function useDownloadPDF() {
  return useMutation({
    mutationFn: async ({ documentType, documentId, filename }: DownloadPDFParams) => {
      const response = await api.get(`/pdf/download/${documentType}/${documentId}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${documentType}-${documentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('PDF downloaded successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to download PDF';
      toast.error(message);
    },
  });
}
