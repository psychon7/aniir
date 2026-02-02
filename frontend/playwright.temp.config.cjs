const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /temp-invoice-notification-template\.spec\.cjs/,
  retries: 0,
  workers: 1,
  reporter: 'list',
});
