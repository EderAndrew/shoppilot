<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Clean Architecture em Camadas
- Template principle 2 -> II. Backend-Ready por Abstracao
- Template principle 3 -> III. DDD Lite e Responsabilidade Unica
- Template principle 4 -> IV. Historico Auditavel por Eventos
- Template principle 5 -> V. Seguranca OWASP Desde o MVP
Added sections:
- Fundamentos Tecnicos e Evolucao
- Qualidade, UX e IA Futura
Removed sections:
- Placeholder SECTION_2_NAME
- Placeholder SECTION_3_NAME
Templates requiring updates:
- updated .specify/templates/plan-template.md
- updated .specify/templates/spec-template.md
- updated .specify/templates/tasks-template.md
- n/a .specify/templates/commands/*.md (directory not present)
Follow-up TODOs:
- None
-->
# ShopPilot Constitution

## Core Principles

### I. Clean Architecture em Camadas

ShopPilot MUST be organized into clear layers: Presentation, Application, Domain,
and Infrastructure. Domain code MUST NOT depend on UI, infrastructure, storage,
network clients, or framework-specific concerns. Presentation MUST NOT contain
business rules; it may orchestrate user interactions and render state only.
Application use cases MUST coordinate domain behavior and data access through
interfaces. Infrastructure MUST remain an external adapter for Supabase and
future external services.

Rationale: the product must start as a simple mobile MVP while preserving a
shape that can evolve without rewriting business behavior.

### II. Backend-Ready por Abstracao

The MVP MAY use Supabase directly behind infrastructure adapters, but UI code
MUST NOT call Supabase or database clients directly. All data communication MUST
pass through application services and repository-style abstractions. Data access
interfaces MUST be explicit and replaceable so a future flow of Mobile -> API ->
Database can be introduced without mass refactoring.

Rationale: the system is expected to evolve toward a dedicated backend,
asynchronous workers, and intelligent agents.

### III. DDD Lite e Responsabilidade Unica

The domain MUST model the core entities explicitly: ShoppingList,
ShoppingListItem, Product, and PriceHistory. Entities MUST contain relevant
behavior such as total calculation, budget checks, and price-history decisions
instead of being passive data containers only. Modules MUST have one primary
responsibility: products manage products, shopping_list manages lists,
price_history manages price records, and analytics computes insights.

Rationale: explicit domain behavior keeps shopping rules testable, discoverable,
and reusable across future interfaces and backends.

### IV. Historico Auditavel por Eventos

The system MUST preserve history instead of overwriting meaningful user data.
Price changes MUST create new price history records rather than destroying prior
prices. Relevant user actions MUST be auditable through structured events such
as ITEM_ADDED, ITEM_REMOVED, and PRICE_UPDATED. Data that affects budgeting,
analytics, or future AI decisions MUST remain traceable over time.

Rationale: reliable historical data is required for budget review, temporal
analysis, predictions, and future agentic assistance.

### V. Seguranca OWASP Desde o MVP

Security is mandatory from the first MVP. The system MUST follow OWASP Top 10
guidance, including access control, cryptographic protection, input validation,
secure design, secure configuration, dependency hygiene, authentication/session
safety, data integrity, monitoring, and controlled external requests. Every user
owned record MUST be scoped by user_id. Supabase Row Level Security MUST be used
for persisted user data. Secrets MUST be provided through environment variables
or secure storage and MUST NOT be exposed as private keys in frontend code.
Critical validation MUST NOT rely on the UI alone.

Rationale: shopping and pricing history are personal data; secure foundations
avoid preventable rework before the product scales.

## Fundamentos Tecnicos e Evolucao

ShopPilot targets a mobile-first experience using Expo and TypeScript for the
MVP, with Supabase as the initial persistence and authentication provider behind
infrastructure adapters. Strong typing MUST be used across layers. Shared models
MUST avoid duplicate type definitions where practical and SHOULD be extractable
to a shared package when the architecture grows.

The architecture MUST support progressive scalability:

- Phase 1: mobile application with Supabase accessed only through services and
  infrastructure adapters.
- Phase 2: introduction of a dedicated backend, such as a NestJS API, without
  changing the UI-facing application contracts.
- Phase 3: workers, queues, analytics processing, and agentic AI capabilities
  built on the historical and event-oriented data model.

No MVP decision may block these phases without an explicit complexity
justification in the feature plan.

## Qualidade, UX e IA Futura

Code MUST be readable before being optimized, modular, and testable. Domain
behavior, especially totals, budget checks, price history, ownership boundaries,
and event creation, MUST have focused tests. Features that touch persistence or
authentication MUST include security-oriented validation of user data isolation.

The user experience MUST be action-oriented for real shopping contexts: fast,
intuitive, responsive, and useful with minimal steps. Flows SHOULD provide
immediate feedback and SHOULD avoid excessive dependence on perfect connectivity.

Future AI readiness is a product requirement. Features SHOULD structure data so
it can support cost forecasts, automatic suggestions, and decision agents later.
User events and price history MUST be captured consistently when they are
relevant to future analysis.

The following anti-patterns are prohibited:

- Business logic in UI components.
- Direct database or Supabase access from UI code.
- User-owned data without user_id.
- Overwriting price history.
- Duplicated domain types across features.
- Generic files with multiple unrelated responsibilities.
- Functions that mix business rules, persistence, and presentation concerns.
- Unvalidated dynamic external calls.

## Governance

This constitution supersedes conflicting project practices, templates, and
feature plans. Every feature plan MUST include a Constitution Check covering
layering, backend-ready abstractions, domain modeling, auditability, security,
typing, observability, testability, and action-oriented UX. Any violation MUST be
documented with a reason and a simpler alternative that was rejected.

Amendments require updating this file, recording the impact in the Sync Impact
Report, and synchronizing dependent templates or runtime guidance in the same
change. Versioning follows semantic versioning: MAJOR for incompatible
governance or principle redefinitions, MINOR for new principles or materially
expanded guidance, and PATCH for clarifications that do not change obligations.

Compliance review is required during specification, planning, task generation,
and implementation review. Specs MUST express user value and measurable outcomes
without implementation details. Plans and tasks MUST translate the constitution
into concrete architecture, security, observability, and test work.

**Version**: 1.0.0 | **Ratified**: 2026-05-04 | **Last Amended**: 2026-05-04
