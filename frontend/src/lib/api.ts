// Re-export API client for @/lib/api imports
// This module provides a convenience import path for files using @/lib/api
import apiClient from '@/api/client';

// Export as both default and named for different import styles
export default apiClient;
export { apiClient as api };
export * from '@/api/client';
