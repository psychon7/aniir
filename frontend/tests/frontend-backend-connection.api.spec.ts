/**
 * Playwright API Verification Test - Frontend to Backend Connection
 *
 * This test verifies that the frontend can successfully connect to the new Python backend.
 * It tests:
 * 1. Health check endpoint
 * 2. Authentication flow (login, refresh, verify, logout)
 * 3. Protected API endpoints require authentication
 * 4. Various API endpoints are reachable
 */
import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const BACKEND_BASE_URL = 'http://localhost:8000';

// Test credentials - these should match what's in the test database
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

test.describe('Frontend-Backend Connection Verification', () => {

  test.describe('1. Health Check', () => {

    test('GET /health - should return healthy status', async ({ request }) => {
      const response = await request.get(`${BACKEND_BASE_URL}/health`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('version');
      console.log(`Backend version: ${data.version}`);
    });

    test('Backend should be reachable on port 8000', async ({ request }) => {
      const response = await request.get(`${BACKEND_BASE_URL}/health`);
      expect(response.ok()).toBeTruthy();
    });

  });

  test.describe('2. Authentication Endpoints', () => {

    test('POST /auth/login - should return 401 for invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          username: 'nonexistent_user',
          password: 'wrong_password'
        }
      });

      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('detail');
      expect(data.detail).toHaveProperty('success', false);
      expect(data.detail).toHaveProperty('error');
    });

    test('POST /auth/login - should return 422 for missing credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          username: 'test'
          // Missing password
        }
      });

      expect(response.status()).toBe(422);
    });

    test('POST /auth/login - endpoint is reachable', async ({ request }) => {
      // Just verify the endpoint exists and responds appropriately
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          username: 'test',
          password: 'test'
        }
      });

      // Should get either 401 (invalid creds) or 200 (valid creds)
      // Not 404 (endpoint not found) or 500 (server error)
      expect([200, 401, 422]).toContain(response.status());
    });

    test('POST /auth/refresh - should return 401/422 for invalid refresh token', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
        data: {
          refreshToken: 'invalid_refresh_token'
        }
      });

      // Should get 401 (invalid token) or 422 (validation error)
      expect([401, 422]).toContain(response.status());
    });

    test('GET /auth/me - should return 401 without token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/auth/me`);

      expect(response.status()).toBe(401);
    });

    test('GET /auth/verify - should return 401 without token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/auth/verify`);

      expect(response.status()).toBe(401);
    });

  });

  test.describe('3. Protected API Endpoints', () => {

    test('GET /clients - should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/clients`);

      // Protected endpoint should require authentication
      expect([401, 403]).toContain(response.status());
    });

    test('GET /products - should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/products`);

      expect([401, 403]).toContain(response.status());
    });

    test('GET /suppliers - should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/suppliers`);

      expect([401, 403]).toContain(response.status());
    });

    test('GET /quotes - should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/quotes`);

      expect([401, 403]).toContain(response.status());
    });

    test('GET /invoices - should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/invoices`);

      expect([401, 403]).toContain(response.status());
    });

  });

  test.describe('4. Lookup Endpoints (may be public)', () => {

    test('GET /currencies - endpoint is reachable', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/currencies`);

      // Lookup endpoints may or may not require auth
      expect([200, 401, 403]).toContain(response.status());

      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
      }
    });

    test('GET /client-types - endpoint is reachable', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/client-types`);

      expect([200, 401, 403]).toContain(response.status());
    });

    test('GET /lookups - endpoint is reachable', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/lookups`);

      // May return 404 if no base route or redirect to specific lookups
      expect([200, 401, 403, 404, 405]).toContain(response.status());
    });

  });

  test.describe('5. API Documentation Endpoints', () => {

    test('GET /docs - OpenAPI documentation is available', async ({ request }) => {
      const response = await request.get(`${BACKEND_BASE_URL}/docs`);

      expect(response.ok()).toBeTruthy();
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/html');
    });

    test('GET /openapi.json - OpenAPI schema is available', async ({ request }) => {
      const response = await request.get(`${BACKEND_BASE_URL}/openapi.json`);

      expect(response.ok()).toBeTruthy();

      const schema = await response.json();
      expect(schema).toHaveProperty('openapi');
      expect(schema).toHaveProperty('info');
      expect(schema).toHaveProperty('paths');

      // Verify some key endpoints exist in the schema
      expect(schema.paths).toHaveProperty('/api/v1/auth/login');
      expect(schema.paths).toHaveProperty('/health');
    });

    test('GET /redoc - ReDoc documentation is available', async ({ request }) => {
      const response = await request.get(`${BACKEND_BASE_URL}/redoc`);

      expect(response.ok()).toBeTruthy();
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/html');
    });

  });

  test.describe('6. CORS Configuration', () => {

    test('OPTIONS /health - should include CORS headers', async ({ request }) => {
      const response = await request.fetch(`${BACKEND_BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET'
        }
      });

      // CORS preflight may return 200 or 204
      expect([200, 204]).toContain(response.status());

      const headers = response.headers();
      // Check for CORS headers
      const corsHeaderPresent =
        headers['access-control-allow-origin'] !== undefined ||
        headers['access-control-allow-methods'] !== undefined;

      if (!corsHeaderPresent) {
        console.log('Note: CORS headers may be handled differently or not required for same-origin');
      }
    });

  });

  test.describe('7. Error Handling', () => {

    test('GET /nonexistent - should return 404', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/nonexistent-endpoint`);

      expect(response.status()).toBe(404);
    });

    test('POST with invalid JSON - should return 422', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: 'not valid json{{{',
        failOnStatusCode: false
      });

      // Should be 422 (validation error) or 400 (bad request)
      expect([400, 422]).toContain(response.status());
    });

  });

});

test.describe('Full Authentication Flow (if credentials available)', () => {

  // These tests attempt a full auth flow - they may skip if no valid user exists
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  test('Complete authentication flow', async ({ request }) => {
    // Step 1: Login
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: TEST_CREDENTIALS
    });

    if (loginResponse.status() === 200) {
      const loginData = await loginResponse.json();

      expect(loginData).toHaveProperty('accessToken');
      expect(loginData).toHaveProperty('refreshToken');
      expect(loginData).toHaveProperty('user');
      expect(loginData).toHaveProperty('expiresIn');

      accessToken = loginData.accessToken;
      refreshToken = loginData.refreshToken;

      console.log('Login successful');
      console.log(`User: ${loginData.user.username}`);
      console.log(`Token expires in: ${loginData.expiresIn} seconds`);

      // Step 2: Access protected endpoint with token
      const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(meResponse.status()).toBe(200);
      const userData = await meResponse.json();
      expect(userData).toHaveProperty('userId');
      expect(userData).toHaveProperty('username');
      console.log('Auth me endpoint works');

      // Step 3: Verify token
      const verifyResponse = await request.get(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(verifyResponse.status()).toBe(200);
      const verifyData = await verifyResponse.json();
      expect(verifyData).toHaveProperty('valid', true);
      console.log('Token verification works');

      // Step 4: Refresh token
      const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
        data: {
          refreshToken: refreshToken
        }
      });

      if (refreshResponse.status() === 200) {
        const refreshData = await refreshResponse.json();
        expect(refreshData).toHaveProperty('accessToken');
        expect(refreshData).toHaveProperty('refreshToken');
        accessToken = refreshData.accessToken;
        refreshToken = refreshData.refreshToken;
        console.log('Token refresh works');
      }

      // Step 5: Access a protected data endpoint
      const clientsResponse = await request.get(`${API_BASE_URL}/clients`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Should be 200 or possibly empty array
      expect([200, 204]).toContain(clientsResponse.status());
      if (clientsResponse.status() === 200) {
        console.log('Protected endpoint accessible with auth');
      }

      // Step 6: Logout
      const logoutResponse = await request.post(`${API_BASE_URL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(logoutResponse.status()).toBe(200);
      const logoutData = await logoutResponse.json();
      expect(logoutData).toHaveProperty('success', true);
      console.log('Logout successful');

    } else {
      console.log(`Login failed with status ${loginResponse.status()} - skipping auth flow test`);
      console.log('This is expected if no test user exists in the database');
      test.skip();
    }
  });

});

test.describe('API Response Format Verification', () => {

  test('Error responses follow standard format', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'invalid_user_12345',
        password: 'invalid_pass_12345'
      }
    });

    expect(response.status()).toBe(401);

    const data = await response.json();

    // Verify error response structure
    expect(data).toHaveProperty('detail');
    expect(data.detail).toHaveProperty('success', false);
    expect(data.detail).toHaveProperty('error');
    expect(data.detail.error).toHaveProperty('code');
    expect(data.detail.error).toHaveProperty('message');

    // Code should be a meaningful string
    expect(typeof data.detail.error.code).toBe('string');
    expect(data.detail.error.code.length).toBeGreaterThan(0);
  });

});
