export function createGitHubClient({ token, owner, repo } = {}) {
  return {
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

      // Placeholder for Octokit integration in the next iteration.
      return {
        number: 1,
        url: `https://github.com/${owner}/${repo}/pull/1`,
        dryRun: false,
        title,
        body,
        head,
        base
      };
    }
  };
}
