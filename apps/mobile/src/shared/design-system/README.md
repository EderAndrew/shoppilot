# Design System

Central source of truth for visual tokens, themes, variants, and shared UI components in the ShopPilot mobile app.

## Allowed Imports

| From | Use for |
|------|---------|
| `@/shared/design-system` | Tokens, theme, variants, and their TypeScript types |
| `@/shared/ui` | Shared presentational components |

Never import raw palette values. Never repeat card, button, input, or state styles locally.

## Tokens (`tokens.ts`)

```ts
import { colors, spacing, radius, shadows, typography } from '@/shared/design-system';
```

### Colors

Use semantic names only — never raw hex:

```tsx
// ✅ correct
color={colors.textPrimary}
backgroundColor={colors.dangerSurface}

// ❌ wrong — bypasses dark-mode readiness
color="#111827"
backgroundColor="#fef2f2"
```

### Typography

Spread typography roles directly as Tamagui props — do not use `style={{}}`:

```tsx
import { typography } from '@/shared/design-system';

// ✅ correct — Tamagui props, no inline style object
<Text {...typography.screenTitle} color={colors.textPrimary}>Título</Text>
<Text {...typography.caption} color={colors.textSecondary}>Detalhe</Text>

// ❌ wrong — inline style object pattern
<Text style={{ ...typography.body, color: colors.textPrimary }}>...</Text>
```

Available roles: `display`, `screenTitle`, `sectionTitle`, `body`, `bodyStrong`, `caption`, `button`, `fieldLabel`.

### Spacing

```tsx
import { spacing } from '@/shared/design-system';

<YStack gap={spacing.sectionGap} padding={spacing.screenPadding}>
```

### Radius & Shadows

```tsx
import { radius, shadows } from '@/shared/design-system';

borderRadius={radius.card}
style={shadows.card}  // use style for shadow because RN shadow props are a set
```

## Variants (`variants.ts`)

Use variant objects when you need consistent styles on non-shared components:

```ts
import { buttonVariants, cardVariants, listItemVariants } from '@/shared/design-system';

const style = cardVariants['danger'];   // { backgroundColor, borderColor, borderWidth }
```

Prefer the shared UI components (which already apply variants) over consuming raw variant objects directly.

## Shared UI Components (`@/shared/ui`)

### Screen layout

```tsx
import { ScreenContainer, SectionHeader } from '@/shared/ui';

export default function MyScreen() {
  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Minha tela" subtitle="Subtítulo opcional" />
      {/* content */}
    </ScreenContainer>
  );
}
```

### Cards

```tsx
import { AppCard } from '@/shared/ui';

<AppCard>...</AppCard>
<AppCard variant="elevated">...</AppCard>
<AppCard variant="danger">...</AppCard>
```

Available variants: `default`, `elevated`, `subtle`, `actionable`, `danger`, `warning`, `success`.

### Buttons

```tsx
import { AppButton } from '@/shared/ui';

<AppButton onPress={...}>Ação primária</AppButton>
<AppButton variant="secondary" onPress={...}>Secundária</AppButton>
<AppButton variant="danger" loading={isPending} onPress={...}>Remover</AppButton>
<AppButton icon={<Plus />} iconOnly accessibilityLabel="Adicionar" onPress={...} />
```

Available variants: `primary`, `secondary`, `subtle`, `danger`.

### Inputs and forms

```tsx
import { AppInput, InvalidFieldText } from '@/shared/ui';

<AppInput
  label="Nome"
  placeholder="Nome do produto"
  error={errors.name?.message}
  {...register('name')}
/>

<InvalidFieldText message={errors.budget?.message} />
```

### List rows

```tsx
import { AppListItem } from '@/shared/ui';

<AppListItem
  title={item.name}
  subtitle={item.quantity}
  value={formatMoney(item.total)}
  variant={item.bought ? 'completed' : 'default'}
  onPress={onEdit}
/>
```

### Visual states

```tsx
import { LoadingState, EmptyState, ErrorState, StatusState, SuccessState, WarningState } from '@/shared/ui';

<LoadingState label="Carregando listas..." />
<EmptyState message="Nenhuma lista ainda." actionLabel="Criar lista" onAction={onCreate} />
<ErrorState message="Erro ao carregar." onRetry={refetch} />
<SuccessState message="Conta criada." />
<WarningState message="Produto similar já existe." />
```

Or use `AsyncState` for the data-fetch pattern:

```tsx
import { AsyncState } from '@/shared/feedback/AsyncState';

<AsyncState isLoading={q.isLoading} error={q.error} isEmpty={!q.data?.length} onRetry={q.refetch}
  emptyMessage="Nenhum item." emptyActionLabel="Adicionar" onEmptyAction={onCreate}>
  {/* success children */}
</AsyncState>
```

## New Screen Checklist

When building a new screen from scratch, confirm:

- [ ] Screen uses `ScreenContainer` (not raw `ScrollView` or `View` with manual padding)
- [ ] Section titles use `SectionHeader`
- [ ] Primary call-to-action uses `AppButton` (default `primary` variant)
- [ ] Cards use `AppCard` — no local `borderRadius`/`borderWidth`/`backgroundColor` reimplementation
- [ ] List rows use `AppListItem` — no local row layout
- [ ] Form fields use `AppInput` + `InvalidFieldText`
- [ ] Loading, empty, and error states use `AsyncState` or the individual state components
- [ ] Typography uses `{...typography.X}` spread as Tamagui props — no `style={{...typography.X}}`
- [ ] Colors use `colors.*` semantic tokens — no raw hex

## Anti-Patterns

```tsx
// ❌ Local card reimplementation
<View style={{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, padding: 16 }}>

// ✅ Use AppCard
<AppCard>

// ❌ Raw hex color
<Text color="#dc2626">Erro</Text>

// ✅ Semantic token
<Text color={colors.danger}>Erro</Text>

// ❌ Inline style object for typography
<Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>Título</Text>

// ✅ Spread typography role as Tamagui props
<Text {...typography.screenTitle} color={colors.textPrimary}>Título</Text>

// ❌ Local layout props duplicated across components
<XStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>

// ✅ Tamagui layout props directly
<XStack justifyContent="space-between" alignItems="center">
```

---

## Dark Mode Readiness

The design system is structured so that dark mode can be added later by providing a second theme without rewriting any screen or component.

### Rules to preserve dark-mode readiness

1. **Never hardcode light colors in screens or features.** Every color must come from `colors.*` or `lightTheme.*`.

2. **Use semantic names.** `colors.textPrimary` adapts to theme; `#111827` does not.

3. **Keep theme mapping in `themes.ts`.** The file maps semantic roles to palette values. Adding a `darkTheme` export is all that is needed to enable dark mode.

4. **No screen-level conditional theme logic.** Screens must not inspect `colorScheme` and pick colors manually — that logic belongs in the theme layer.

5. **`tamaguiThemeExtension` keys are prefixed `app*`.** This avoids collision with Tamagui's built-in keys and makes it safe to add a parallel dark extension.

### How to add dark mode in the future

```ts
// themes.ts — add alongside lightTheme
export const darkTheme = {
  background: '#0f172a',
  surface: '#1e293b',
  // ... map same semantic roles to dark palette values
} satisfies AppTheme;

// tamagui.config.ts — register the dark variant
themes: { light: tamaguiThemeExtension, dark: darkThemeTamaguiExtension }
```

Migrated screens will automatically use the correct theme because they reference semantic tokens, not hardcoded colors.
