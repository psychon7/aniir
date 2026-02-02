/**
 * Simulate network latency for mock API calls
 */
export const delay = (ms: number = 300): Promise<void> => {
  // Only add delay in development mode when mock API is enabled
  if (import.meta.env.VITE_USE_MOCK_API !== 'true') {
    return Promise.resolve()
  }

  // Add random jitter (±100ms) for more realistic behavior
  const jitter = Math.random() * 200 - 100
  const actualDelay = Math.max(50, ms + jitter)

  return new Promise((resolve) => setTimeout(resolve, actualDelay))
}

/**
 * Check if mock API is enabled
 */
export const isMockEnabled = (): boolean => {
  return import.meta.env.VITE_USE_MOCK_API === 'true'
}
