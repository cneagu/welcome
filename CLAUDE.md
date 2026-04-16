# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (interactive — choose platform with w/a/i)
npx expo start

# Start directly on a platform
npx expo start --web
npx expo start --android
npx expo start --ios

# Lint
npx expo lint

# Type-check
npx tsc --noEmit

# Reset project scaffold
node scripts/reset-project.js
```

## Architecture

This is an **Expo SDK 54 + Expo Router v6** app with React Native 0.81 (New Architecture enabled) and React 19 with the React Compiler enabled.

### Routing

Expo Router uses file-based routing under `app/`. The root layout (`app/_layout.tsx`) sets up a `Stack` navigator with a `ThemeProvider`. The `(tabs)` group (`app/(tabs)/`) renders a bottom tab bar with two screens: `index` (Home) and `explore`. A modal screen lives at `app/modal.tsx`.

### Theming

Dark/light mode is fully supported:

- **`constants/theme.ts`** — `Colors` object (keyed by `light`/`dark`) and `Fonts` (platform-selected via `Platform.select`).
- **`hooks/use-color-scheme.ts`** — thin wrapper around RN's `useColorScheme`. The `.web.ts` platform variant adds a hydration guard to avoid SSR mismatch on web.
- **`hooks/use-theme-color.ts`** — resolves a color name from `Colors` or falls back to per-prop overrides.
- **`ThemedText` / `ThemedView`** — drop these in instead of raw `Text`/`View` to get automatic theme-aware colors.

### Icons

`components/ui/icon-symbol.tsx` — uses **SF Symbols** on iOS (`expo-symbols`) and **Material Icons** on Android/web. To add a new icon, extend the `MAPPING` constant with its SF Symbol → Material Icons name pair.

The `.ios.tsx` variant (`icon-symbol.ios.tsx`) renders the native `SymbolView` on iOS.

### Platform file splits

Several files use Expo's platform-extension convention (`*.web.ts`, `*.ios.tsx`). Metro and the bundler resolve the most-specific extension automatically — no manual branching needed.

### Path aliases

`@/` resolves to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/hooks/...`, `@/constants/...` throughout.

### Web output

`app.json` sets `web.output: "static"`, so `expo export` produces a static site. The web bundle goes through Metro (not webpack).
