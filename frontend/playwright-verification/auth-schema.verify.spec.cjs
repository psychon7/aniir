const { test, expect } = require('@playwright/test');
const { execSync } = require('node:child_process');
const path = require('node:path');

test('auth schemas instantiate and serialize correctly', async () => {
  const repoRoot = path.resolve(__dirname, '..', '..');

  const pythonScript = `
import json
from app.schemas.auth import LoginRequest, AuthResponse, UserInfo

request = LoginRequest(username="playwright", password="SuperSecret!123")
user = UserInfo(
    id=42,
    username="playwright",
    firstName="Play",
    lastName="Wright",
    email="playwright@example.com",
    roleId=10,
    roleName="QA",
    societyId=7,
    societyName="QA Org",
    isAdmin=False,
    photoPath=None,
)
response = AuthResponse(
    accessToken="access-token-value",
    refreshToken="refresh-token-value",
    expiresIn=3600,
    user=user,
)

payload = {
    "requestUsername": request.username,
    "passwordLength": len(request.password),
    "tokenType": response.tokenType,
    "accessToken": response.accessToken,
    "refreshToken": response.refreshToken,
    "userName": response.user.username,
    "expiresPositive": response.expiresIn > 0,
}

print(json.dumps(payload))
`.trim();

  const command = `bash -lc "cd ${repoRoot} && PYTHONPATH=backend python - <<'PY'\n${pythonScript}\nPY"`;
  const output = execSync(command, { encoding: 'utf-8' }).trim();

  const payload = JSON.parse(output);

  expect(payload.requestUsername).toBe('playwright');
  expect(payload.passwordLength).toBeGreaterThanOrEqual(8);
  expect(payload.tokenType).toBe('Bearer');
  expect(payload.accessToken).toContain('access-token');
  expect(payload.refreshToken).toContain('refresh-token');
  expect(payload.userName).toBe('playwright');
  expect(payload.expiresPositive).toBe(true);
});
