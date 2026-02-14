import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
const secret = process.env.SENTRY_WEBHOOK_SECRET ?? "dev-secret";

const app = buildApp({ sentrySecret: secret });
await app.listen(port);
// Keep process alive and visible in logs.
console.log(`Aniir webhook server listening on ${port}`);
