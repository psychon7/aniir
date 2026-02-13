import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Types
export interface PDFGenerateResponse {
  success: boolean;
  message: string;
  download_url?: string;
  storage_path?: string;
}

export interface PDFDownloadURLResponse {
  download_url: string;
  expires_in: number;
}

// API Functions
const invoicePdfApi = {
  generatePdf: async (invoiceId: number, store: boolean = true): Promise<PDFGenerateResponse> => {
    const response = await apiClient.post<PDFGenerateResponse>(
      `/invoice-pdf/${invoiceId}/pdf/generate`,
      null,
      { params: { store } }
    );
    return response.data;
  },

  downloadPdf: async (invoiceId: number): Promise<Blob> => {
    const response = await apiClient.get(`/invoice-pdf/${invoiceId}/pdf/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  previewPdf: async (invoiceId: number): Promise<Blob> => {
    const response = await apiClient.get(`/invoice-pdf/${invoiceId}/pdf/preview`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getPdfUrl: async (invoiceId: number, expiration: number = 3600): Promise<PDFDownloadURLResponse> => {
    const response = await apiClient.get<PDFDownloadURLResponse>(
      `/invoice-pdf/${invoiceId}/pdf/url`,
      { params: { expiration } }
    );
    return response.data;
  },
};

// Hooks
export function useGenerateInvoicePdf() {
  return useMutation({
    mutationFn: ({ invoiceId, store = true }: { invoiceId: number; store?: boolean }) =>
      invoicePdfApi.generatePdf(invoiceId, store),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: (invoiceId: number) => invoicePdfApi.downloadPdf(invoiceId),
    onSuccess: (blob, invoiceId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to download PDF: ${error.message}`);
    },
  });
}

export function usePreviewInvoicePdf() {
  return useMutation({
    mutationFn: (invoiceId: number) => invoicePdfApi.previewPdf(invoiceId),
    onSuccess: (blob) => {
      // Open in new tab
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    },
    onError: (error: Error) => {
      toast.error(`Failed to preview PDF: ${error.message}`);
    },
  });
}

export function useInvoicePdfUrl(invoiceId: number, enabled: boolean = false) {
  return useQuery({
    queryKey: ['invoice-pdf-url', invoiceId],
    queryFn: () => invoicePdfApi.getPdfUrl(invoiceId),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export { invoicePdfApi };
