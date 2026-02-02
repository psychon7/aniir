import { ColumnDef } from '@tanstack/react-table';
import { PDFStatusCell } from '@/components/common/PDFStatusCell';
import type { PDFStatusInfo } from '@/components/common/PDFStatusIndicator';
import type { DocumentType } from '@/hooks/usePDFStatus';

interface DocumentWithPDFStatus {
  id: number;
  reference: string;
  pdf_status?: PDFStatusInfo;
}

/**
 * Creates a PDF status column for document tables
 * Usage: Add to your table columns array
 * 
 * @example
 * const columns = [
 *   // ... other columns
 *   createPDFStatusColumn('quote'),
 * ];
 */
export function createPDFStatusColumn<T extends DocumentWithPDFStatus>(
  documentType: DocumentType,
  options?: {
    header?: string;
    size?: number;
  }
): ColumnDef<T> {
  return {
    id: 'pdf_status',
    header: options?.header ?? 'PDF',
    size: options?.size ?? 100,
    cell: ({ row }) => {
      const document = row.original;
      const statusInfo: PDFStatusInfo = document.pdf_status ?? {
        status: 'none',
      };

      return (
        <PDFStatusCell
          statusInfo={statusInfo}
          documentType={documentType}
          documentId={document.id}
          documentReference={document.reference}
          variant="badge"
          size="sm"
        />
      );
    },
  };
}

/**
 * PDF status column with full actions dropdown
 */
export function createPDFStatusColumnWithActions<T extends DocumentWithPDFStatus>(
  documentType: DocumentType
): ColumnDef<T> {
  return {
    id: 'pdf_status',
    header: 'PDF Status',
    size: 140,
    cell: ({ row }) => {
      const document = row.original;
      const statusInfo: PDFStatusInfo = document.pdf_status ?? {
        status: 'none',
      };

      return (
        <PDFStatusCell
          statusInfo={statusInfo}
          documentType={documentType}
          documentId={document.id}
          documentReference={document.reference}
          variant="badge"
          size="md"
        />
      );
    },
  };
}
