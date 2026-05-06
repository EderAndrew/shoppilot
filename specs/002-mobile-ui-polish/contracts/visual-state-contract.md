# UI Contract: Visual State Patterns

## Purpose

Define consistent loading, empty, error, success, warning, disabled, and invalid visual feedback across the mobile app.

## State Components

### LoadingState

**Inputs**:
- `label`: Optional user-facing loading text.
- `size`: Optional visual size/density.

**Contract**:
- MUST indicate work is in progress.
- MUST preserve enough layout structure to avoid confusing jumps.
- MUST avoid blocking unrelated screen content unless the whole screen depends on the loading state.

### EmptyState

**Inputs**:
- `title`: Short explanation.
- `message`: Optional supporting text.
- `actionLabel`: Optional next action label.
- `onAction`: Optional next action callback.

**Contract**:
- MUST explain why no content is shown.
- SHOULD provide the most relevant next action when one exists.
- MUST avoid implying data loss or failure when the state is normal.

### ErrorState

**Inputs**:
- `title`: Optional short error heading.
- `message`: Safe user-facing error message.
- `retryLabel`: Optional retry label.
- `onRetry`: Optional retry callback.

**Contract**:
- MUST use plain language.
- MUST expose a recovery action when recovery is available.
- MUST NOT expose secrets, raw backend details, SQL, tokens, or stack traces.

### SuccessState and WarningState

**Inputs**:
- `message`: User-facing status text.
- `tone`: Success or warning.

**Contract**:
- MUST be visually distinguishable from error and neutral states.
- SHOULD be concise enough for fast shopping contexts.

### InvalidFieldState

**Inputs**:
- `message`: Field-level validation message.

**Contract**:
- MUST be associated with the relevant input.
- MUST remain readable without overlapping the input or button area.
- MUST preserve existing validation rules.

## AsyncState Composition

The existing `AsyncState` pattern MAY remain as the orchestration wrapper, but it SHOULD delegate visual rendering to `LoadingState`, `EmptyState`, and `ErrorState` after those components exist.

## Accessibility Contract

- Interactive recovery actions MUST have accessible labels when the visible label is not sufficient.
- Icon-only actions MUST have accessibility labels.
- Disabled controls MUST have visible disabled treatment.
- Text must remain legible on small mobile screens.
- Primary action contrast and error text contrast must be manually reviewed.

## Visual QA Contract

Each screen migration slice MUST verify:
- Loading state.
- Empty state.
- Error state with retry when available.
- Long text handling.
- Disabled or pending action appearance.
- Primary action recognition.
