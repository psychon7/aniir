/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL (e.g., http://localhost:8000/api/v1) */
  readonly VITE_API_BASE_URL: string;
  /** Alternative API URL for backwards compatibility */
  readonly VITE_API_URL: string;
  /** Socket.IO server URL (e.g., http://localhost:8000) */
  readonly VITE_SOCKET_URL: string;
  /** Application display name */
  readonly VITE_APP_NAME: string;
  /** Application version */
  readonly VITE_APP_VERSION: string;
  /** Enable mock API for development (true/false) */
  readonly VITE_USE_MOCK_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
