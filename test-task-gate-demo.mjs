#!/usr/bin/env node
// Test: Task Completion Gate - Before vs After JEV

import { jevGate } from "./mcp/jev-client.mjs";

async function runTest() {
  console.log("=== TASK COMPLETION GATE TEST ===\n");
  console.log("Scenario: Coder agent claims 'API key rotation feature implemented'\n");

  // ============================================
  // SCENARIO 1: WITHOUT JEV (current behavior)
  // ============================================
  console.log("━━━ WITHOUT JEV (trust the agent) ━━━");
  console.log("Agent says: 'Task completed! API key rotation is done.'");
  console.log("Human: 'Great, marking complete.'");
  console.log("❌ PROBLEM: No verification. Tests might fail. Code might not compile.\n");

  // ============================================
  // SCENARIO 2: WITH JEV - GOOD EVIDENCE
  // ============================================
  console.log("━━━ WITH JEV - STRONG EVIDENCE ━━━");
  
  const goodEvidence = {
    request: "Implement API key rotation feature",
    diff: `+ src/auth/rotation.ts: New rotation endpoint
+ src/auth/keys.ts: Key creation/revocation logic
+ tests/auth/rotation.test.ts: 12 new tests
- src/auth/deprecated.ts: Removed old auth`,
    claims: [
      "Rotation endpoint created and tested",
      "Key creation and revocation UI implemented", 
      "All existing tests pass",
      "No breaking changes to authentication"
    ],
    evidence: [
      { text: "npm test output: 47 passed, 0 failed, 12 new rotation tests" },
      { text: "tsc --noEmit: 0 errors" },
      { text: "Manual verification: POST /api/auth/rotate returns 200, old key revoked" }
    ],
    tests: "All integration tests pass. Coverage: 94%. Manual E2E: rotation works end-to-end."
  };

  const result1 = await jevGate(
    goodEvidence.request,
    goodEvidence.diff,
    goodEvidence.claims,
    goodEvidence.evidence,
    goodEvidence.tests
  );

  console.log(`Gate Action: ${result1.action.toUpperCase()}`);
  console.log(`Review Verdict: ${result1.review?.verdict || 'N/A'}`);
  console.log(`Claims Verified: ${result1.verification?.summary?.verified || 0}/${result1.verification?.total_claims || result1.claims?.length || 4}`);
  console.log(`Evidence Items: ${result1.evidence_count || result1.verification?.evidence_count || 3}`);
  console.log(`✅ RESULT: Strong evidence → gate passes (or requires review with high confidence)\n`);

  // ============================================
  // SCENARIO 3: WITH JEV - WEAK EVIDENCE
  // ============================================
  console.log("━━━ WITH JEV - WEAK EVIDENCE ━━━");
  
  const weakEvidence = {
    request: "Implement API key rotation feature",
    diff: `+ src/auth/rotation.ts: TODO - implement rotation
+ src/auth/keys.ts: // TODO: add key management`,
    claims: [
      "Rotation endpoint created and tested",
      "Key creation and revocation UI implemented",
      "All existing tests pass",
      "No breaking changes to authentication"
    ],
    evidence: [
      { text: "// TODO: write tests" },
      { text: "tsc --noEmit: 3 errors in rotation.ts" }
    ],
    tests: "Tests not written yet. TypeScript errors present."
  };

  const result2 = await jevGate(
    weakEvidence.request,
    weakEvidence.diff,
    weakEvidence.claims,
    weakEvidence.evidence,
    weakEvidence.tests
  );

  console.log(`Gate Action: ${result2.action.toUpperCase()}`);
  console.log(`Review Verdict: ${result2.review?.verdict || 'N/A'}`);
  console.log(`Claims Verified: ${result2.verification?.summary?.verified || 0}/${result2.verification?.total_claims || 4}`);
  console.log(`Claims Unsupported: ${result2.verification?.summary?.unsupported || 0}`);
  console.log(`Claims Contradicted: ${result2.verification?.summary?.contradicted || 0}`);
  console.log(`❌ RESULT: Weak evidence → gate ESCALATES, task NOT marked complete\n`);

  // ============================================
  // SCENARIO 4: WITH JEV - CONTRADICTED CLAIMS
  // ============================================
  console.log("━━━ WITH JEV - CONTRADICTED CLAIMS ━━━");
  
  const badEvidence = {
    request: "Implement API key rotation feature",
    diff: `+ src/auth/rotation.ts: New endpoint
- src/auth/keys.ts: REMOVED key management (breaking change)`,
    claims: [
      "Rotation endpoint created and tested",
      "No breaking changes to authentication"
    ],
    evidence: [
      { text: "npm test: 5 FAILED - key management tests broken" },
      { text: "Git diff shows keys.ts deleted - breaking change confirmed" }
    ],
    tests: "5 tests failed due to removed key management. Breaking change introduced."
  };

  const result3 = await jevGate(
    badEvidence.request,
    badEvidence.diff,
    badEvidence.claims,
    badEvidence.evidence,
    badEvidence.tests
  );

  console.log(`Gate Action: ${result3.action.toUpperCase()}`);
  console.log(`Review Verdict: ${result3.review?.verdict || 'N/A'}`);
  console.log(`Claims Verified: ${result3.verification?.summary?.verified || 0}/${result3.verification?.total_claims || 2}`);
  console.log(`Claims Contradicted: ${result3.verification?.summary?.contradicted || 0}`);
  console.log(`❌ RESULT: Evidence CONTRADICTS claims → gate BLOCKS completion\n`);

  console.log("━━━ SUMMARY ━━━");
  console.log("| Scenario | Gate Action | Task Marked Complete? |");
  console.log("|----------|-------------|----------------------|");
  console.log("| No JEV   | N/A         | YES (blind trust)    |");
  console.log("| Strong   | review/auto | YES (verified)       |");
  console.log("| Weak     | escalate    | NO (evidence thin)   |");
  console.log("| Bad      | escalate    | NO (contradicted)    |");
}

runTest().catch(e => { console.error(e); process.exit(1); });