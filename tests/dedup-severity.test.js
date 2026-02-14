import test from "node:test";
import assert from "node:assert/strict";
import { deduplicateIssue } from "../src/analysis/deduplicate.js";
import { classifySeverityLevel } from "../src/analysis/severity.js";

test("deduplicateIssue uses exact ID match first", () => {
  const known = [
    { issueId: "SEN-100", fingerprint: "auth-login-failed", title: "Login failed" }
  ];

  const result = deduplicateIssue(
    { issueId: "SEN-100", fingerprint: "something-new", title: "Other error" },
    known
  );

  assert.equal(result.match, true);
  assert.equal(result.method, "exact-id");
});

test("deduplicateIssue falls back to semantic similarity", () => {
  const known = [
    {
      issueId: "A-1",
      fingerprint: "unknown",
      title: "TypeError cannot read properties of undefined in checkout submit"
    }
  ];

  const incoming = {
    issueId: "A-2",
    fingerprint: "different",
    title: "TypeError reading undefined property during checkout submit flow"
  };

  const result = deduplicateIssue(incoming, known);
  assert.equal(result.match, true);
  assert.equal(result.method, "semantic");
});

test("classifySeverityLevel marks login failure as blocking", () => {
  const severity = classifySeverityLevel({
    title: "Login fails with 500",
    message: "Users cannot sign in",
    eventsPerHour: 14
  });

  assert.equal(severity, "blocking");
});
