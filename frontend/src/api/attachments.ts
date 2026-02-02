/**
 * Attachments API Client
 */
import apiClient from './client';

export type EntityType = 'INVOICE' | 'QUOTE' | 'ORDER' | 'CLIENT' | 'SUPPLIER' | 'PRODUCT';

export interface DocumentAttachment {
  id: number;
  entity_type: string;
  entity_id: number;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  uploaded_by: number | null;
  uploaded_at: string;
  uploader_name: string | null;
  download_url: string;
}

export interface AttachmentListResponse {
  items: DocumentAttachment[];
  total: number;
}

export interface UploadAttachmentParams {
  file: File;
  entityType: EntityType;
  entityId: number;
  description?: string;
}

/**
 * Upload a file attachment
 */
export async function uploadAttachment(params: UploadAttachmentParams): Promise<DocumentAttachment> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('entity_type', params.entityType);
  formData.append('entity_id', params.entityId.toString());
  if (params.description) {
    formData.append('description', params.description);
  }

  const response = await apiClient.post<DocumentAttachment>('/attachments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Get all attachments for an entity
 */
export async function getEntityAttachments(
  entityType: EntityType,
  entityId: number
): Promise<AttachmentListResponse> {
  const response = await apiClient.get<AttachmentListResponse>(
    `/attachments/${entityType}/${entityId}`
  );
  return response.data;
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: number): Promise<void> {
  await apiClient.delete(`/attachments/${attachmentId}`);
}

/**
 * Update attachment description
 */
export async function updateAttachmentDescription(
  attachmentId: number,
  description: string
): Promise<DocumentAttachment> {
  const response = await apiClient.patch<DocumentAttachment>(
    `/attachments/${attachmentId}/description`,
    null,
    { params: { description } }
  );
  return response.data;
}

/**
 * Get download URL for an attachment
 */
export function getAttachmentDownloadUrl(attachmentId: number): string {
  return `${apiClient.defaults.baseURL}/attachments/${attachmentId}/download`;
}
