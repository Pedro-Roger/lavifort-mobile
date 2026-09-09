# Agent Operating Rules — LarviFort Mobile CRM

## Mission

Implement the `larvifort-mobile` project according to `SPEC.md`, respecting `ARCHITECTURE.md`.

## Mandatory Context

Before modifying code, read:

1. `SPEC.md`
2. `ARCHITECTURE.md`
3. `.agent/tasks.json`
4. `.agent/progress.md`
5. `.agent/decisions.md`
6. current Git status / workspace state

Confirm the real repository state before trusting progress notes.

## Execution Rules

- **Offline-First First**: All data operations (create, update, delete, status transitions) must work locally and immediately without blocking on network requests.
- **Design System Fidelity**: Mimic the colors, badges, typography and tokens defined in `larvifort-crm` (`--color-brand-600: #0284c7`, neutral surfaces, status badges).
- **Endpoint Parity**: Consume the exact REST contracts provided by `lavifort-API` (`/tasks`, `/tasks/projects`, `/tasks/:id/status`, `/tasks/:id/transfer`, `/auth/login`).
- Work on one task at a time, keeping `.agent/tasks.json` and `.agent/progress.md` updated.
- Investigate existing code before editing.
- Preserve existing patterns and modular boundaries.
- Do not introduce dependencies without a clear reason.
- Do not expose secrets or commit credentials.
- Do not mark a task done without validation.

## Definition of Done

A task is done only when:

- Acceptance criteria defined in `SPEC.md` and `.agent/tasks.json` are met;
- Implementation is complete, typed, and clean;
- Relevant tests (unit/integration) are added or updated;
- `./scripts/verify.sh` passes without errors;
- `.agent/tasks.json` and `.agent/progress.md` are updated with the completed status.

## Failure Policy

When validation fails:

1. Stop forward progress;
2. Identify the root cause;
3. Fix it;
4. Rerun `./scripts/verify.sh`;
5. Record recurring or important failures in `.agent/failures.md`.
