# Agent Prompt: Build a public Netlify demo for `@ylakhdar/pretext-breaker`

You are building a **public React demo site** for `@ylakhdar/pretext-breaker`.

## Goal

Create a demo that resonates with the React/frontend community and makes the package immediately understandable.

The key idea is **not** “show a canvas game on a page.”

The key idea is:

> **Turn a real docs/article page into the game board.**

The demo should feel like a polished documentation page or article, and then unexpectedly become playable.

## Product framing

Use a **play-first, explain-later, ship-in-one-snippet** approach:

- immediate interaction
- real app context
- obvious use case for docs/blog/content-heavy pages
- easy install and copy-paste usage
- static hosting on Netlify

If the demo is just “a cool game,” it misses the point.
If the demo is “your actual docs page becomes the level,” it will click with people.

## Context

Local package repo:

- `/Users/yassine/Repos/breaker`

Primary package positioning:

- configurable text-rendered block breaker easter egg for React apps
- strongest differentiator: it converts **real DOM content into breakable bricks**

## Public API you must respect

Primary usage:

```tsx
import '@ylakhdar/pretext-breaker/styles.css';
import { PretextBreaker } from '@ylakhdar/pretext-breaker';
```

Main component props:

- `trigger`
- `game`
- `documentBricks`
- `brickSources`
- `font`
- `labels`
- `className`
- `bodyScrollLock`

Trigger behavior available today:

- default Konami code via keyboard sequence
- default query param activation via `?game=true`
- `initialActive` exists on the trigger options

Relevant trigger API details:

- `queryParam` defaults to `game`
- `queryValue` defaults to `true`
- default sequence is the Konami code

Default content extraction targets these HTML elements:

- `h1, h2, h3, h4, h5, h6`
- `p`
- `li`
- `pre`
- `blockquote`
- `td, th`
- `dt, dd`
- `summary`

Do **not** invent props or capabilities that are not exported by the package.

## What to build

Build a **single-page React demo** that looks like a real docs page.

It should include:

1. a strong hero section
2. a short explanation of the package
3. an install snippet
4. a minimal usage snippet
5. realistic documentation/article content that can become bricks
6. a visible CTA to play the page
7. a subtle hint that the Konami code also works
8. support for a shareable `?game=true` URL
9. links to GitHub and npm

The page should be useful and attractive **before** the game starts.

## Core demo concept

Design the page like a modern docs/product page, then let the game break the page itself.

This is the recommended story:

- user lands on a polished docs-like page
- sees what the package is and how to install it
- clicks **Play this page** or discovers the hidden trigger
- the page content becomes the level
- the experience is surprising, memorable, and easy to share

## Experience requirements

The demo must support these activation paths:

1. **Visible CTA:** a clear “Play this page” action
2. **Konami code:** keep the built-in delight factor
3. **Fresh-load URL trigger:** `?game=true`

The visible CTA is important because public visitors should not have to guess.

If the `PretextBreaker` component API makes manual activation awkward, solve it without modifying the package for demo-only reasons. Acceptable approaches include:

- a keyed remount strategy using `trigger.initialActive`
- a thin wrapper built from exported public APIs such as `useTrigger` and/or `PretextBreakerGame`

Prefer the public component where possible. Keep the demo implementation honest.

## Content requirements

Deliberately include content that maps well to the default brick selectors so the gameplay feels rich and varied.

Use a mix of:

- headings
- paragraphs
- lists
- a blockquote
- a code block
- a small table
- a FAQ using `details/summary`
- optional `dl` / `dt` / `dd` content

Do **not** make the page too sparse. The game should have enough real DOM content to feel satisfying.

## Visual direction

Aim for:

- modern docs-site polish
- strong typography
- clean spacing
- light product-marketing feel without becoming a generic landing page
- screenshot-worthy hero section
- subtle visual connection to the game aesthetic

Avoid:

- a dashboard look
- a generic playground with knobs as the main experience
- a blank canvas page
- a pure retro arcade landing page with no document context

## Technical direction

- Use **React**.
- Prefer **Vite** for the demo app.
- Keep it **static** and **Netlify-friendly**.
- No backend.
- No auth.
- No CMS dependency.
- Keep routing simple; a single-page experience is preferred for v1.

If the package is not yet published when you build the demo locally, consume it from the local repo in a way that is easy to swap later for the published npm package.

## Suggested page outline

Use something close to this:

### 1. Hero
- product name
- one-sentence value prop
- primary CTA: **Play this page**
- secondary CTA: GitHub / npm
- quiet hint for Konami code or a discoverable easter-egg clue

### 2. Why this exists
- explain the idea in plain language
- emphasize docs/content pages becoming the level

### 3. Installation
- one install snippet
- one usage snippet

### 4. Live document content
- realistic article/docs sections
- enough text structure for bricks

### 5. FAQ / configuration
- brief explanation of triggers
- query param support
- selectors / document brick behavior

### 6. Footer
- GitHub
- npm
- credit / source links as appropriate

## Important implementation notes

- Import the package stylesheet.
- Do not break the normal reading experience when the game is inactive.
- Make sure the page still feels like a real site when the overlay is closed.
- Preserve shareability: `?game=true` should work on a fresh page load.
- The demo should be easy to understand from a screenshot or short clip.
- The install snippet on the page should be real, not pseudo-code.

## Netlify requirements

Prepare the demo so it can be deployed easily on Netlify.

Expected deployment model:

- build command: `pnpm build`
- publish directory: `dist`

If you need a `netlify.toml`, add one. Keep the deployment simple.

## Deliverables

Produce:

1. a working React demo app
2. Netlify-ready build configuration
3. polished page content and styling
4. a short README for local development and deploy steps

## Validation requirements

Before you finish, verify all of the following:

- the app builds successfully
- the package imports correctly
- the page looks good before activation
- **Play this page** works
- Konami code works
- `?game=true` works on a fresh load
- quitting the game restores normal browsing behavior
- the page content clearly acts as the source of the bricks
- the site is still compelling even if a visitor never triggers the game

## Non-goals

Do **not** build:

- a Storybook-first demo
- a controls panel as the main homepage
- a standalone arcade game site with no docs/article context
- a complicated multi-page app for v1

## Final output expectations

When done, provide:

1. the demo folder/repo location
2. a short summary of the implementation approach
3. the key files created or changed
4. how the three activation paths were implemented
5. build/deploy verification results

## Short positioning line to keep in mind

If you need a north star, use this:

> **A text-rendered block-breaker easter egg that turns your docs page into the level.**
