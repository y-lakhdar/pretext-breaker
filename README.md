# @ylakhdar/pretext-breaker

A configurable text-rendered block breaker easter egg for React apps.

**[Live demo →](https://y-lakhdar.github.io/pretext-breaker/)**

## Installation

```bash
pnpm add @ylakhdar/pretext-breaker
```

## Local Development

Install dependencies and build the package:

```bash
pnpm install
pnpm build
```

## Basic Usage

```tsx
import '@ylakhdar/pretext-breaker/styles.css';
import { PretextBreaker } from '@ylakhdar/pretext-breaker';

export function GlobalEasterEgg() {
  return <PretextBreaker />;
}
```

The component listens for the Konami code by default and also activates when the current URL contains `?game=true`.

## Rspress Adapter

Rspress projects can use the [dedicated plugin](https://github.com/y-lakhdar/rspress-plugin-pretext-breaker).

## Configuration

`PretextBreaker` accepts options for the trigger sequence, query parameter, font loading, DOM brick selectors, and game tuning. The defaults work in generic document-like pages. Framework-specific selector presets belong in adapter packages.

## Acknowledgements

This project was inspired by [rinesh/pretext-breaker](https://github.com/rinesh/pretext-breaker). Credit to [@rinesh](https://github.com/rinesh) for the original idea.
