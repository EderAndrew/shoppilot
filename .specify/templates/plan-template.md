# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Answer each gate with PASS/FAIL plus a brief justification. FAIL entries MUST be
resolved before implementation or documented in Complexity Tracking with the
simpler alternative that was rejected.

- **Layering**: Presentation, Application, Domain, and Infrastructure are
  separated; Domain has no UI, storage, network, or framework dependency.
- **Backend-ready data access**: UI does not call Supabase/database clients
  directly; data access flows through services and explicit abstractions.
- **Domain model**: Relevant behavior is modeled on ShoppingList,
  ShoppingListItem, Product, PriceHistory, or another explicit domain entity.
- **History and auditability**: Price changes and relevant user actions preserve
  historical records or structured events instead of overwriting meaningful data.
- **Security**: User-owned persisted data is scoped by user_id, RLS/policies are
  planned where applicable, secrets stay out of frontend code, and validation is
  enforced outside the UI.
- **Typing and shared models**: TypeScript types are consistent across layers and
  duplicate domain models are avoided.
- **Observability**: Critical actions and suspicious/error states have structured
  logging or event tracking appropriate for debugging and future analytics.
- **Testing**: Domain behavior and ownership/security boundaries have focused
  tests; persistence/authentication changes include validation coverage.
- **Action-oriented UX**: Primary shopping flows are fast, low-step, responsive,
  and provide immediate feedback for use in market contexts.
- **AI readiness**: Data and events needed for future forecasts, suggestions, or
  decision agents are captured when relevant to the feature.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile MVP with future API
src/
├── presentation/        # Expo UI/screens/components; no business rules
├── application/         # use cases and app services
├── domain/              # entities, value objects, pure business rules
└── infrastructure/      # Supabase/external adapters behind interfaces

tests/
├── unit/                # domain and application tests
├── integration/         # adapter and persistence/auth flows
└── security/            # ownership, RLS/policy, validation checks
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
