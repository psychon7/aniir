import { readFile, writeFile } from "node:fs/promises";

export class MemoryStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async readAll() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async findByFingerprint(fingerprint) {
    const rows = await this.readAll();
    return rows.find((row) => row.fingerprint === fingerprint);
  }

  async upsert(record) {
    const rows = await this.readAll();
    const index = rows.findIndex((row) => row.fingerprint === record.fingerprint);
    if (index >= 0) {
      rows[index] = { ...rows[index], ...record };
    } else {
      rows.push(record);
    }
    await writeFile(this.filePath, JSON.stringify(rows, null, 2));
    return record;
  }
}
