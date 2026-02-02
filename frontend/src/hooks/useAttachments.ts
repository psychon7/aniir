/**
 * React Query hooks for attachments
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/feedback/Toast';
import {
  uploadAttachment,
  getEntityAttachments,
  deleteAttachment,
  updateAttachmentDescription,
  EntityType,
  UploadAttachmentParams,
} from '@/api/attachments';

// Query keys
export const attachmentKeys = {
  all: ['attachments'] as const,
  entity: (entityType: EntityType, entityId: number) =>
    [...attachmentKeys.all, entityType, entityId] as const,
};

/**
 * Hook to fetch attachments for an entity
 */
export function useEntityAttachments(entityType: EntityType, entityId: number) {
  return useQuery({
    queryKey: attachmentKeys.entity(entityType, entityId),
    queryFn: () => getEntityAttachments(entityType, entityId),
    enabled: !!entityId,
  });
}

/**
 * Hook to upload an attachment
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: UploadAttachmentParams) => uploadAttachment(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.entity(variables.entityType, variables.entityId),
      });
      toast.success('File uploaded successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || 'Failed to upload file';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an attachment
 */
export function useDeleteAttachment(entityType: EntityType, entityId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.entity(entityType, entityId),
      });
      toast.success('Attachment deleted');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || 'Failed to delete attachment';
      toast.error(message);
    },
  });
}

/**
 * Hook to update attachment description
 */
export function useUpdateAttachmentDescription(entityType: EntityType, entityId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ attachmentId, description }: { attachmentId: number; description: string }) =>
      updateAttachmentDescription(attachmentId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentKeys.entity(entityType, entityId),
      });
      toast.success('Description updated');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      const message = err.response?.data?.detail || 'Failed to update description';
      toast.error(message);
    },
  });
}
