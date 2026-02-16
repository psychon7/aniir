const STEP_TEMPLATES = {
  triage: "Classify the issue '{{issue_title}}' with severity '{{issue_severity}}' and explain why.",
  investigate_fix:
    "Investigate root cause for '{{issue_title}}' and propose a safe minimal fix with tests for '{{issue_fingerprint}}'.",
  verify:
    "Verify the proposed fix for '{{issue_title}}' with explicit test and risk checks.",
  pr_body:
    "Write a concise PR body for '{{issue_title}}' including cause, fix, and verification evidence."
};

const ALLOWED_VARS = new Set([
  "issue_title",
  "issue_fingerprint",
  "issue_severity",
  "incident_id",
  "issue_message"
]);

const LOCKED_SYSTEM_PROMPT =
  "You are an incident remediation agent. Prioritize correctness, minimal-risk changes, and verifiable fixes.";

function renderTemplate(template, variables) {
  return String(template ?? "").replace(/{{\s*([a-z_]+)\s*}}/g, (_, token) => {
    if (!ALLOWED_VARS.has(token)) {
      throw new Error(`Unknown prompt variable: ${token}`);
    }
    return String(variables[token] ?? "");
  });
}

function buildVariables(issue = {}) {
  return {
    issue_title: issue.issueTitle ?? issue.title ?? "Unknown issue",
    issue_fingerprint: issue.fingerprint ?? "unknown",
    issue_severity: issue.severity ?? "unknown",
    incident_id: issue.incidentId ?? issue.issueId ?? "",
    issue_message: issue.message ?? ""
  };
}

export function buildStepPrompt({ step, issue, config } = {}) {
  if (!Object.prototype.hasOwnProperty.call(STEP_TEMPLATES, step)) {
    throw new Error(`Unsupported prompt step: ${step}`);
  }

  const variables = buildVariables(issue);
  const taskText = renderTemplate(STEP_TEMPLATES[step], variables);
  const userInstructionsRaw = config?.prompts?.[step]?.user_instructions ?? "";
  const userInstructions = renderTemplate(userInstructionsRaw, variables);
  const parts = [LOCKED_SYSTEM_PROMPT, `Task: ${taskText}`];
  if (userInstructions.trim()) {
    parts.push(`User Instructions: ${userInstructions}`);
  }
  return {
    step,
    text: parts.join("\n\n"),
    variables
  };
}
