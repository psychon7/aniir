import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class SyncStateStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async read() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { processed: {} };
      if (!parsed.processed || typeof parsed.processed !== "object") {
        parsed.processed = {};
      }
      return parsed;
    } catch (error) {
      if (error?.code === "ENOENT") return { processed: {} };
      throw error;
    }
  }

  isProcessed(state, issueId) {
    return Boolean(state?.processed?.[issueId]);
  }

  markProcessed(state, issueId, metadata = {}) {
    if (!state.processed || typeof state.processed !== "object") {
      state.processed = {};
    }
    state.processed[issueId] = {
      ...(state.processed[issueId] ?? {}),
      ...metadata,
      updated_at: new Date().toISOString()
    };
  }

  async write(state) {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2));
  }
}
