/**
 * Playwright API Verification Test for Authentication Flow
 *
 * This test verifies the complete auth flow:
 * 1. Login - Get access and refresh tokens
 * 2. Access - Use access token to access protected endpoint
 * 3. Refresh - Use refresh token to get new access token
 * 4. Re-access - Verify new access token works
 */
import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

// Test credentials - can be overridden via environment variables
// Default credentials match the test user created by backend/scripts/create_test_user.py
const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME || 'testuser',
  password: process.env.TEST_PASSWORD || 'Test@123456'
};

test.describe('Authentication Flow - Login -> Access -> Refresh', () => {

  test('Complete auth flow: login, access protected endpoint, refresh token, re-access', async ({ request }) => {
    // ==========================================
    // STEP 1: LOGIN - Get access and refresh tokens
    // ==========================================
    console.log('Step 1: Logging in with credentials...');

    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password
      }
    });

    // Verify login success
    expect(loginResponse.status(), 'Login should return 200 OK').toBe(200);

    const loginData = await loginResponse.json();

    // Verify login response structure
    expect(loginData).toHaveProperty('accessToken');
    expect(loginData).toHaveProperty('refreshToken');
    expect(loginData).toHaveProperty('expiresIn');
    expect(loginData).toHaveProperty('tokenType', 'bearer');
    expect(loginData).toHaveProperty('user');

    // Verify tokens are non-empty strings
    expect(typeof loginData.accessToken).toBe('string');
    expect(loginData.accessToken.length).toBeGreaterThan(0);
    expect(typeof loginData.refreshToken).toBe('string');
    expect(loginData.refreshToken.length).toBeGreaterThan(0);

    // Verify user info
    expect(loginData.user).toHaveProperty('id');
    expect(loginData.user).toHaveProperty('username');
    expect(loginData.user.username).toBe(TEST_CREDENTIALS.username);

    const accessToken = loginData.accessToken;
    const refreshToken = loginData.refreshToken;

    console.log('Login successful. Got access and refresh tokens.');

    // ==========================================
    // STEP 2: ACCESS - Use access token on protected endpoint
    // ==========================================
    console.log('Step 2: Accessing protected endpoint /auth/me...');

    const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Verify access success
    expect(meResponse.status(), 'GET /auth/me should return 200 with valid token').toBe(200);

    const meData = await meResponse.json();

    // Verify user data returned
    expect(meData).toHaveProperty('id');
    expect(meData).toHaveProperty('username');
    expect(meData.username).toBe(TEST_CREDENTIALS.username);

    console.log('Protected endpoint accessed successfully with access token.');

    // ==========================================
    // STEP 2b: VERIFY - Use /auth/verify endpoint
    // ==========================================
    console.log('Step 2b: Verifying token with /auth/verify...');

    const verifyResponse = await request.get(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    expect(verifyResponse.status(), 'GET /auth/verify should return 200').toBe(200);

    const verifyData = await verifyResponse.json();
    expect(verifyData).toHaveProperty('valid', true);
    expect(verifyData).toHaveProperty('userId');
    expect(verifyData).toHaveProperty('username');

    console.log('Token verified successfully.');

    // ==========================================
    // STEP 3: REFRESH - Get new access token
    // ==========================================
    console.log('Step 3: Refreshing token...');

    const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: {
        refreshToken: refreshToken
      }
    });

    // Verify refresh success
    expect(refreshResponse.status(), 'POST /auth/refresh should return 200').toBe(200);

    const refreshData = await refreshResponse.json();

    // Verify refresh response structure (same as login)
    expect(refreshData).toHaveProperty('accessToken');
    expect(refreshData).toHaveProperty('refreshToken');
    expect(refreshData).toHaveProperty('expiresIn');
    expect(refreshData).toHaveProperty('tokenType', 'bearer');

    // Verify new tokens are provided
    expect(typeof refreshData.accessToken).toBe('string');
    expect(refreshData.accessToken.length).toBeGreaterThan(0);
    expect(typeof refreshData.refreshToken).toBe('string');
    expect(refreshData.refreshToken.length).toBeGreaterThan(0);

    // Verify new access token is different from old one (token rotation)
    expect(refreshData.accessToken).not.toBe(accessToken);

    const newAccessToken = refreshData.accessToken;

    console.log('Token refreshed successfully. Got new access token.');

    // ==========================================
    // STEP 4: RE-ACCESS - Use new access token
    // ==========================================
    console.log('Step 4: Accessing protected endpoint with new access token...');

    const meResponse2 = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    });

    // Verify access with new token
    expect(meResponse2.status(), 'GET /auth/me should work with refreshed token').toBe(200);

    const meData2 = await meResponse2.json();
    expect(meData2.username).toBe(TEST_CREDENTIALS.username);

    console.log('Protected endpoint accessed successfully with new access token.');

    // ==========================================
    // STEP 5: LOGOUT (optional cleanup)
    // ==========================================
    console.log('Step 5: Logging out...');

    const logoutResponse = await request.post(`${API_BASE_URL}/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    });

    expect(logoutResponse.status(), 'POST /auth/logout should return 200').toBe(200);

    console.log('Logout successful. Auth flow test complete!');
  });

  test('Login with invalid credentials should fail with 401', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: 'nonexistent_user',
        password: 'wrong_password'
      }
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('detail');
  });

  test('Access protected endpoint without token should fail with 401', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);

    // Should return 401 Unauthorized without token
    expect(response.status()).toBe(401);
  });

  test('Access protected endpoint with invalid token should fail with 401', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('Refresh with invalid refresh token should fail with 401', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: {
        refreshToken: 'invalid_refresh_token'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('Login via form endpoint (OAuth2 compatible)', async ({ request }) => {
    // Test the form-encoded login endpoint used by Swagger UI
    const response = await request.post(`${API_BASE_URL}/auth/login/form`, {
      form: {
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data).toHaveProperty('user');
    expect(data.user.username).toBe(TEST_CREDENTIALS.username);
  });

  test('Token rotation on refresh provides new refresh token', async ({ request }) => {
    // Login first
    const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: TEST_CREDENTIALS.username,
        password: TEST_CREDENTIALS.password
      }
    });
    expect(loginResponse.status()).toBe(200);

    const loginData = await loginResponse.json();
    const originalRefreshToken = loginData.refreshToken;

    // Refresh the token
    const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: {
        refreshToken: originalRefreshToken
      }
    });
    expect(refreshResponse.status()).toBe(200);

    const refreshData = await refreshResponse.json();

    // Verify token rotation - new refresh token should be different
    expect(refreshData.refreshToken).not.toBe(originalRefreshToken);
  });
});
