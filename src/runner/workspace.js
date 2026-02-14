import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function allocateWorkspace(incidentId) {
  const prefix = `aniir-${incidentId}-`;
  const path = await mkdtemp(join(tmpdir(), prefix));
  return { path };
}
