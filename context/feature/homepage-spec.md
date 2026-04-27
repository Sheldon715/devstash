# Homepage

## Overview

Turn the standalone `prototypes/homepage` mockup into the real DevStash homepage at `/`.

The page should preserve the mockup's core story: scattered developer knowledge becomes an organized DevStash workspace. Build it as production app code using the existing Next.js, Tailwind v4, and ShadCN-style component patterns.

## Reference

- Prototype source: `prototypes/homepage/index.html`
- Prototype styles: `prototypes/homepage/styles.css`
- Prototype interactions: `prototypes/homepage/script.js`
- Existing route to replace: `src/app/page.tsx`

## Requirements

- Replace the current root redirect with a public marketing homepage.
- Keep the homepage auth-aware:
  - signed-out users see Sign In and Get Started actions
  - signed-in users see Dashboard as the primary app action
- Recreate the mockup sections:
  - fixed top navigation
  - hero copy and CTA buttons
  - chaos-to-dashboard visual
  - features grid
  - AI/pro section
  - pricing section with monthly/yearly toggle
  - final CTA
  - footer
- Use Tailwind classes and existing ShadCN-style UI primitives where useful.
- Keep route files thin by extracting reusable sections into `src/components/homepage/`.
- Keep code clean and DRY by sharing repeated data arrays for nav links, feature cards, pricing details, and preview cards.
- Make all buttons and links point to real destinations.
- Preserve responsive behavior from the prototype.
- Respect reduced-motion preferences for animations.

## Component Plan

- `src/app/page.tsx` should remain a server component.
- Server components:
  - fetch session/auth state
  - render static page structure
  - pass auth-aware link labels/destinations into child components
- Client components only where interactivity is needed:
  - chaos icon animation and pointer repulsion
  - pricing billing toggle
  - scroll/reveal or sticky header state if implemented with browser APIs
- Prefer CSS animations and Tailwind utilities for non-stateful motion.

## Suggested Files

- `src/app/page.tsx`
- `src/components/homepage/homepage-nav.tsx`
- `src/components/homepage/homepage-hero.tsx`
- `src/components/homepage/chaos-flow.tsx`
- `src/components/homepage/features-section.tsx`
- `src/components/homepage/ai-section.tsx`
- `src/components/homepage/pricing-section.tsx`
- `src/components/homepage/homepage-footer.tsx`
- `src/components/homepage/homepage-data.ts`

## Routes and Links

- Brand: `/`
- Features nav: `#features`
- Pricing nav: `#pricing`
- Sign In: `/sign-in`
- Get Started / Start Free / final CTA: `/register`
- Dashboard action for signed-in users: `/dashboard`
- Explore Features: `#features`
- Pro pricing CTA: `/register`

Do not leave placeholder `href="#"` links in the finished page.

## UI Notes

- Match the app's dark theme and existing typography from `src/app/globals.css`.
- Keep the visual language close to the prototype without copying large CSS blocks directly.
- Use item-type accent colors consistently for snippets, prompts, commands, notes, files, images, and URLs.
- Use ShadCN-style buttons/badges and `lucide-react` icons where they fit.
- Avoid oversized nested cards; section layouts should feel polished but still app-native.
- Ensure mobile layout stacks cleanly and CTA text fits without overflow.

## Acceptance Criteria

- `/` loads the homepage instead of redirecting to `/dashboard`.
- Signed-out homepage links route to auth pages and section anchors correctly.
- Signed-in users have a clear path back to `/dashboard`.
- The chaos-to-dashboard hero, pricing toggle, and responsive layouts work on desktop and mobile.
- No placeholder links remain.
- `npm run lint` and `npm run build` pass.
