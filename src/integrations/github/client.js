const DEFAULT_API_BASE = "https://api.github.com";

function createHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function toApiPath(owner, repo, suffix) {
  return `${DEFAULT_API_BASE}/repos/${owner}/${repo}${suffix}`;
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function createGitHubClient({ token, owner, repo, fetchImpl = fetch } = {}) {
  async function request(method, suffix, body) {
    const response = await fetchImpl(toApiPath(owner, repo, suffix), {
      method,
      headers: createHeaders(token),
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await readJsonSafely(response);
    return { response, payload };
  }

  return {
    async prepareIncidentBranch({ incidentId, base = "main", head, content }) {
      if (!token) {
        return {
          dryRun: true,
          incidentId,
          base,
          head
        };
      }

      const branchName = head ?? `aniir/${incidentId}`;
      const baseRef = await request("GET", `/git/ref/heads/${encodeURIComponent(base)}`);
      if (!baseRef.response.ok) {
        throw new Error(`Unable to read base branch '${base}'`);
      }
      const baseSha = baseRef.payload?.object?.sha;
      if (!baseSha) {
        throw new Error(`Missing base SHA for '${base}'`);
      }

      const headRef = await request("GET", `/git/ref/heads/${encodeURIComponent(branchName)}`);
      if (headRef.response.status === 404) {
        const created = await request("POST", "/git/refs", {
          ref: `refs/heads/${branchName}`,
          sha: baseSha
        });
        if (!created.response.ok) {
          throw new Error(`Unable to create branch '${branchName}'`);
        }
      } else if (!headRef.response.ok) {
        throw new Error(`Unable to read branch '${branchName}'`);
      }

      const filePath = `.aniir/incidents/${incidentId}.md`;
      const encodedPath = encodeURIComponent(filePath);
      let existingSha = null;
      const existing = await request("GET", `/contents/${encodedPath}?ref=${encodeURIComponent(branchName)}`);
      if (existing.response.ok) {
        existingSha = existing.payload?.sha ?? null;
      } else if (existing.response.status !== 404) {
        throw new Error(`Unable to read branch artifact '${filePath}'`);
      }

      const putBody = {
        message: `chore(aniir): incident artifact ${incidentId}`,
        content: Buffer.from(String(content ?? ""), "utf8").toString("base64"),
        branch: branchName
      };
      if (existingSha) putBody.sha = existingSha;

      const saved = await request("PUT", `/contents/${encodedPath}`, putBody);
      if (!saved.response.ok) {
        throw new Error(`Unable to write incident artifact '${filePath}'`);
      }

      return {
        dryRun: false,
        branch: branchName,
        filePath
      };
    },

    async createPullRequest({ title, body, head, base }) {
      if (!token) {
        return {
          number: 0,
          url: "",
          dryRun: true,
          title,
          body,
          head,
          base,
          owner,
          repo
        };
      }

      const created = await request("POST", "/pulls", {
        title,
        body,
        head,
        base
      });

      if (created.response.ok) {
        return {
          number: created.payload?.number ?? 0,
          url: created.payload?.html_url ?? "",
          dryRun: false,
          title,
          body,
          head,
          base
        };
      }

      if (created.response.status === 422) {
        const existing = await request(
          "GET",
          `/pulls?state=open&head=${encodeURIComponent(`${owner}:${head}`)}&base=${encodeURIComponent(base)}`
        );
        if (existing.response.ok && Array.isArray(existing.payload) && existing.payload.length > 0) {
          return {
            number: existing.payload[0].number ?? 0,
            url: existing.payload[0].html_url ?? "",
            dryRun: false,
            existing: true,
            title,
            body,
            head,
            base
          };
        }
      }

      throw new Error(`Failed to create pull request for branch '${head}'`);
    },

    async ensureBranchWithArtifact(params) {
      return this.prepareIncidentBranch(params);
    },

    async healthCheck() {
      return {
        ok: Boolean(token),
        owner,
        repo
      };
    }
  };
}
