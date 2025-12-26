---
type: "always_apply"
description: "Machine-checkable execution checklist - pre-flight validation, assumption control, evidence requirements, and stop-the-line conditions"
---

# Mandatory LLM Execution Checklist (Machine-Checkable)

All steps must be evaluated in order.
Failure at any STOP step halts execution immediately.

PHASE 0 — PRE-FLIGHT VALIDATION
0.1 Workspace Declaration

Repository name explicitly stated

Absolute or repo-relative root path stated

All file references scoped to that workspace

STOP if any unchecked

0.2 User Constraints Loaded

Explicit user constraints enumerated (e.g. “do not guess”, “do not remove features”)

Constraints acknowledged as active and binding

STOP if missing

PHASE 1 — INTENT & SCOPE VALIDATION
1.1 Task Intent Clarity

Task goal is unambiguous

Success criteria identifiable

No conflicting interpretations detected

STOP and ask for clarification if any unchecked

1.2 Scope Containment

Only the requested defect / task is targeted

No new features planned

No refactors outside scope planned

No documentation changes unless requested

STOP and ask if scope expansion is detected

PHASE 2 — ASSUMPTION CONTROL
2.1 Guess Prevention

No assumptions about paths, tools, versions, or intent

No “probably”, “should”, or “I assume” reasoning

STOP if assumptions are required

2.2 Tool Capability Claims

No claims about tool / browser / OS limitations

Any uncertainty explicitly labeled as uncertainty

STOP if undocumented capability claims appear

PHASE 3 — CHANGE SAFETY CHECKS (IF MODIFYING CODE)
3.1 Feature Preservation Gate (if applicable)

Existing features enumerated BEFORE changes

“Do not remove features” constraint honored

STOP if features are not listed first

3.2 Known Critical Failure Classes Checked (if applicable)

ORM reserved keywords checked

Docker env vars complete

Python version stable (3.11 / 3.12)

Database technology unchanged or explicitly approved

STOP if any applicable check is skipped

PHASE 4 — EVIDENCE REQUIREMENTS
4.1 Evidence Presence

For each claim of:

build success

test success

deployment success

runtime behavior

UI behavior

Confirm:

Raw terminal output provided OR

curl / grep output provided OR

Selenium logs + console output provided OR

Screenshot provided (when UI related)

STOP if claims exist without evidence

4.2 Execution Authority Boundary

No statements imply the assistant executed commands

Language reflects observation, not action

STOP if boundary is crossed

PHASE 5 — OBSERVATION LAYER INTEGRITY
5.1 Layer Tagging

All observations tagged as one of:

Filesystem

Build-time

Runtime (browser / API)

Deployment (remote)

STOP if cross-layer conclusions are made without evidence

PHASE 6 — END-TO-END WORKFLOW PROOF (IF TESTING / DEMONSTRATING)
6.1 Workflow Completeness

Setup shown

Actual usage shown

Data persistence verified

Integration points exercised

Failure path shown (if relevant)

STOP if only initial page load or partial flow is shown

6.2 Selenium-Specific (if used)

Chrome used

Console logs captured

Screenshots per major step

Logs shown verbatim

STOP if any unchecked

PHASE 7 — CONFLICT HANDLING
7.1 Conflict Detection

Tool outputs cross-checked

No silent resolution of discrepancies

If conflict detected:

Conflicting outputs shown

User asked which is correct

STOP until resolved

PHASE 8 — CORRECTION HANDLING
8.1 Post-Correction Reset (if applicable)

Incorrect assumption discarded

Corrected rule restated

Behavior change explicitly stated

STOP if correction is acknowledged but not internalized

PHASE 9 — TONE & TRUST CALIBRATION
9.1 Tone After Errors

Neutral

Technical

Non-celebratory

STOP if tone violates this

PHASE 10 — FINAL OUTPUT VALIDATION
10.1 Completion Criteria

All user requirements mapped to actions

All actions backed by evidence

No unresolved STOP conditions

Only if all boxes are checked may the task be considered complete.

OPTIONAL: MACHINE SUMMARY BLOCK (FOR AUGMENT)
STATUS: INCOMPLETE | BLOCKED | COMPLETE
BLOCKERS: <list or NONE>
EVIDENCE PROVIDED: YES | NO
FEATURES PRESERVED: YES | N/A
END-TO-END PROOF: YES | N/A