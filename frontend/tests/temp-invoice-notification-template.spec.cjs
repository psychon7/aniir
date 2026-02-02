const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('invoice notification template contains expected sections and placeholders', async () => {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const templatePath = path.join(
    repoRoot,
    'backend',
    'app',
    'templates',
    'emails',
    'invoice_notification.txt',
  );

  expect(fs.existsSync(templatePath)).toBeTruthy();

  const template = fs.readFileSync(templatePath, 'utf-8');

  expect(template).toContain('Invoice Notification');
  expect(template).toContain('Invoice Summary');
  expect(template).toContain('{{ client_name | default("Valued Customer") }}');
  expect(template).toContain('{{ payment_link }}');
  expect(template).toContain('{{ download_url }}');
  expect(template).toContain('{{ currency | default("EUR") }}');
});
