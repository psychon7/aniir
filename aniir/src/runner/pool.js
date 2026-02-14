import { allocateWorkspace } from "./workspace.js";

export class RunnerPool {
  constructor({ maxWorkers = 4 } = {}) {
    this.maxWorkers = maxWorkers;
    this.active = 0;
  }

  async run(incidentId, workerFn) {
    if (this.active >= this.maxWorkers) {
      throw new Error("Runner pool is at capacity");
    }

    this.active += 1;
    try {
      const workspace = await allocateWorkspace(incidentId);
      return await workerFn(workspace);
    } finally {
      this.active -= 1;
    }
  }
}
