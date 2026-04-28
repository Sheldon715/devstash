# DevStash

Developer knowledge hub for snippets, prompts, notes, commands, files, images, links, and custom item types.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma 7
- PostgreSQL via Neon

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run db:test
npm run db:seed
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:status
npm run prisma:studio
npm run prisma:validate
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with a valid `DATABASE_URL`.
   For Neon deployments, also add a non-pooled `DIRECT_URL` for Prisma CLI commands like `prisma migrate deploy`.
   Stripe billing routes also use:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Generate the Prisma client:

```bash
npm run prisma:generate
```

4. Seed demo data if needed:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

The development server runs at `http://localhost:3000`.

6. Run the unit tests:

```bash
npm run test
```

## Project Notes

- The dashboard UI is backed by Prisma queries against the demo user data.
- System item types are seeded and used for dashboard filters and item-type pages.
- Unit tests use Vitest and are currently limited to server actions and utilities.
- Project context and workflow notes live under `context/` and `AGENTS.md`.

## Prisma + Neon

- `DATABASE_URL` is used at runtime by Prisma Client through the `@prisma/adapter-pg` adapter.
- `DIRECT_URL` is used by Prisma CLI commands when present, which is recommended for Neon migrations and deploy-time Prisma commands.
