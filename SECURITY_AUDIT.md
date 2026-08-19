# Security Audit and Alert Triage

> Related issues: [#121](https://github.com/jardimdesoftware/qualeider/issues/121) and [#176](https://github.com/jardimdesoftware/qualeider/issues/176).
> Last repository triage update: 2026-08-19.

This document records how Qualeider handles Dependabot, Code Scanning and
container/dependency security alerts. It is intentionally operational: the goal
is to make every alert visible, prioritized and either fixed or tracked with a
clear owner.

## Current Strategy

Security alerts are handled through four layers:

| Layer | Tooling | Where it runs | Purpose |
|---|---|---|---|
| Dependency updates | Dependabot | `.github/dependabot.yml` | Opens weekly PRs for npm, Docker and GitHub Actions updates. |
| Dependency/container scan | Trivy | Backend and frontend CI/CD workflows | Blocks `CRITICAL` findings in `main` and PRs targeting `main`; uploads SARIF to GitHub Security. |
| Code scanning | CodeQL | `.github/workflows/codeql.yml` | Runs static analysis for JavaScript/TypeScript on PRs, pushes and weekly schedule. |
| Manual triage | GitHub Security tab + this document | Each security review | Classifies remaining alerts by severity, exploitability and fix risk. |

## Alert Triage Rules

Alerts are classified using this order:

1. `CRITICAL` or actively exploited alerts: fix immediately or revert the
   dependency/change that introduced them.
2. Runtime production dependencies with network, auth, file parsing, template
   rendering, database or request-processing impact: prioritize before dev-only
   findings.
3. Direct dependencies before transitive dependencies, unless the transitive
   package is exploitable through a runtime path.
4. Non-breaking updates before major upgrades, but never use `npm audit fix
   --force` without reviewing the resulting major changes.
5. Findings without a safe fix are tracked as accepted risk only when the
   affected code path is not reachable in production or the vulnerable feature
   is not used.

## Current Remediation State

The previous audit had three large pending groups. The repository has since
received the dependency upgrades that close the original high-risk backlog:

| Area | Previous risk | Current repository state |
|---|---|---|
| Frontend framework | Next.js and related frontend CVEs | `next` is now on the current major line used by the project (`^16.3.1`). |
| PDF generation | `jspdf` critical findings | `jspdf` is now `^4.2.1`; project usage remains limited to report generation APIs. |
| Backend framework | NestJS 10 to 11 migration backlog | NestJS packages are now on the 11.x line. |
| Mail transport/templates | `nodemailer`/template-related backlog | `nodemailer` is now `^9.0.5`; `handlebars` is now declared directly as `^4.7.9`. |
| Auth/JWT transitive risk | `jsonwebtoken`/`jws` signing issue | `jsonwebtoken` is overridden to `^9.0.3`. |
| Multipart/form upload transitive risk | `form-data` critical issue | `form-data` is overridden to `^4.0.6`. |

Because GitHub Dependabot and Code Scanning alerts are account-protected, their
live contents must be confirmed in the repository Security tab after this PR is
merged. The repository now has repeatable scans and documented triage rules so
new alerts no longer depend on an informal/manual process.

## Required Review Routine

At least once per sprint, or before each production release:

1. Open GitHub `Security` -> `Dependabot alerts`.
2. Open GitHub `Security` -> `Code scanning`.
3. For every open alert, record:
   - package/rule name;
   - severity;
   - affected path;
   - whether it is runtime, dev-only or CI-only;
   - fix version or mitigation;
   - owner and target PR/issue.
4. Merge safe minor/patch Dependabot PRs first.
5. For major upgrades, create one focused PR per risk group.
6. Re-run backend/frontend CI/CD and CodeQL before merge.

## Backlog Policy

Each unresolved alert must be in one of these states:

| State | Meaning | Required action |
|---|---|---|
| `fix-now` | Critical, exploitable or production reachable | Fix in the current sprint before release. |
| `scheduled` | Important but requires a coordinated upgrade | Link to a dated PR/issue. |
| `accepted-risk` | Not production reachable or no safe fix exists | Document rationale and revisit date. |
| `false-positive` | Tool finding does not apply to this code path | Document evidence and dismiss in GitHub Security. |

Accepted-risk and false-positive entries must not be hidden in code comments.
They need an issue, PR note or Security tab dismissal comment with enough
context for a future reviewer.

## Issue #176 Outcome

This update completes the requested maturity work for #176:

- Dependabot coverage is already configured for backend, frontend, Docker and
  GitHub Actions.
- Trivy CI uploads SARIF and blocks critical findings on production paths.
- CodeQL scanning is now codified in the repository.
- The alert triage strategy, prioritization rules and backlog states are
  documented here.
- The old high-risk backlog has been reclassified against the current package
  state in `backend/package.json` and `frontend/package.json`.
