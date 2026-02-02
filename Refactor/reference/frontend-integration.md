# Frontend-Backend Integration Patterns

> **Source**: Extracted from `frontend/DOCUMENTATION/05-FRONTEND-BACKEND-INTEGRATION.md`
> **Applies to**: React frontend connecting to FastAPI backend

---

## API Response Types

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PagedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

---

## Axios Client with JWT Interceptors

```typescript
// src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Token Refresh Logic

```typescript
// src/api/auth.ts
async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    { refreshToken }
  );

  const { accessToken, newRefreshToken } = response.data.data;
  useAuthStore.getState().setTokens(accessToken, newRefreshToken);

  return accessToken;
}
```

---

## Error Handling Utilities

```typescript
// src/lib/errors.ts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.error) {
      return data.error;
    }
    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
}

export function getErrorMessage(error: ApiError): string {
  const messages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check the form for errors',
    INSUFFICIENT_STOCK: 'Not enough stock available',
    CREDIT_LIMIT_EXCEEDED: 'Credit limit exceeded for this client',
    DUPLICATE_REFERENCE: 'This reference already exists',
    NOT_FOUND: 'The requested item was not found',
    UNAUTHORIZED: 'Please log in to continue',
    FORBIDDEN: 'You do not have permission for this action',
  };
  return messages[error.code] || error.message;
}
```

---

## TanStack Query Mutation Pattern

```typescript
// src/hooks/useClients.ts
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createClient,
    onError: (error) => {
      const apiError = parseApiError(error);
      toast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        type: 'success',
        message: 'Client created successfully',
      });
    },
  });
}
```

---

## Optimistic Updates Pattern

```typescript
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['clients', newData.id] });
      const previous = queryClient.getQueryData(['clients', newData.id]);
      queryClient.setQueryData(['clients', newData.id], newData);
      return { previous };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(
        ['clients', newData.id],
        context?.previous
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
```

---

## Loading States Pattern

```typescript
const { data, isLoading, isError, error, refetch } = useClients(searchParams);

if (isLoading) {
  return <LoadingSkeleton rows={10} />;
}

if (isError) {
  return <ErrorState error={error} onRetry={refetch} />;
}

if (!data?.data.length) {
  return <EmptyState message="No clients found" />;
}
```

---

## PDF Viewer Component

```typescript
// src/components/features/shared/PDFViewer.tsx
export function PDFViewer({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return (
    <iframe
      src={url}
      className="w-full h-[80vh]"
      title="PDF Preview"
    />
  );
}
```

---

## PDF Download Helper

```typescript
function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## File Upload Component

```typescript
// src/components/ui/FileUpload.tsx
export function FileUpload({
  onUpload,
  accept,
  maxSize,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    await handleFile(file);
  };

  const handleFile = async (file: File) => {
    if (file.size > maxSize) {
      toast.error('File too large');
      return;
    }
    await onUpload(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted'
      )}
    >
      <input type="file" accept={accept} onChange={...} />
      <p>Drag & drop or click to upload</p>
    </div>
  );
}
```

---

## Multipart File Upload

```typescript
export async function uploadProductImage(
  productId: number,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post(
    `/products/${productId}/image`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data.data.imageUrl;
}
```

---

## WebSocket for Real-time Updates

```typescript
// src/lib/websocket.ts
export function useWebSocket() {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_URL}?token=${accessToken}`
    );

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleNotification(message);
    };

    return () => ws.close();
  }, [accessToken]);
}
```

---

## Environment Variables

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_USE_MOCK_API=false

# .env.staging
VITE_API_BASE_URL=https://staging-api.erp.example.com/api/v1
VITE_WS_URL=wss://staging-api.erp.example.com/ws
VITE_USE_MOCK_API=false

# .env.production
VITE_API_BASE_URL=https://api.erp.example.com/api/v1
VITE_WS_URL=wss://api.erp.example.com/ws
VITE_USE_MOCK_API=false
```

---

## Integration Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials  
- [ ] Token refresh on expiry
- [ ] Logout clears tokens

### CRUD Operations (per module)
- [ ] Create new record
- [ ] Read list with pagination
- [ ] Read single record
- [ ] Update record
- [ ] Delete record
- [ ] Search and filter

### Error Scenarios
- [ ] Network errors
- [ ] Validation errors (400)
- [ ] Unauthorized (401)
- [ ] Forbidden (403)
- [ ] Server errors (500)

### Business Logic
- [ ] Quote → Order conversion
- [ ] Order → Invoice generation
- [ ] Stock reservation on order confirmation
- [ ] Credit limit validation
