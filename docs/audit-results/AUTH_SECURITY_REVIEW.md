# Auth Security Review

Last audit date: 2026-04-22

## Scope

- Reviewed credentials auth, GitHub auth integration boundaries, email verification, password reset, profile mutations, and session-gated account pages.
- Primary files reviewed:
  - `src/auth.ts`
  - `src/actions/auth.ts`
  - `src/actions/profile.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/api/auth/verify-email/route.ts`
  - `src/app/profile/page.tsx`
  - `src/app/sign-in/page.tsx`
  - `src/lib/email-verification.ts`
  - `src/lib/password-reset.ts`
  - `src/lib/password-rules.ts`
  - `src/lib/db/profile.ts`
  - `src/lib/db/collections.ts`
  - `src/lib/db/items.ts`
  - `prisma/schema.prisma`

## Findings

### High

#### Protected account pages are reading data for a hardcoded demo user

Why this is a real issue in this repo:
The protected dashboard and profile experiences authenticate the viewer, but several data loaders ignore the authenticated user and instead query by the fixed email `demo@devstash.io`. That means any signed-in user can be shown another account's collections, item counts, pinned items, and sidebar data.

Evidence:
- `src/lib/db/collections.ts:8` defines `DASHBOARD_DEMO_EMAIL = "demo@devstash.io"`.
- `src/lib/db/collections.ts:58`, `src/lib/db/collections.ts:144`, and `src/lib/db/collections.ts:151` scope collection queries to that hardcoded email.
- `src/lib/db/items.ts:6`, `src/lib/db/items.ts:57`, `src/lib/db/items.ts:121`, `src/lib/db/items.ts:128`, and `src/lib/db/items.ts:156` do the same for item queries and sidebar counts.
- `src/app/dashboard/page.tsx:25` and `src/app/profile/page.tsx:27` call those helpers after only checking that a session exists.

Specific fix:
Pass the authenticated user's `id` or `email` into every dashboard/profile data loader and filter all queries on that identity instead of a constant. Add a regression test with two users to prove one account cannot see another account's dashboard/profile data.

### Medium

#### Public auth endpoints have no rate limiting or brute-force controls

Why this is a real issue in this repo:
The credentials login flow, registration flow, forgot-password flow, and reset-password flow all accept repeated requests without any per-IP, per-account, or per-session throttling. That leaves the app open to credential stuffing, password guessing, and inbox-spam abuse against verification/reset mail flows.

Evidence:
- `src/auth.ts:27` to `src/auth.ts:54` performs credentials auth with no throttling or lockout checks.
- `src/app/api/auth/register/route.ts:63` to `src/app/api/auth/register/route.ts:167` has no request throttling before account creation or verification-email resend.
- `src/app/api/auth/forgot-password/route.ts:35` to `src/app/api/auth/forgot-password/route.ts:77` has no abuse controls before issuing reset emails.
- `src/app/api/auth/reset-password/route.ts:59` to `src/app/api/auth/reset-password/route.ts:121` has no throttling on reset attempts.
- A codebase search did not find any rate-limit middleware or helper applied to these routes.

Specific fix:
Add rate limiting for public auth endpoints using a shared store such as Redis or database-backed counters. At minimum, enforce per-IP and per-identifier limits on credentials sign-in and reset/verification email issuance, and add short backoff windows on repeated failures.

#### Password reset tokens are not consumed atomically, so concurrent reuse can succeed

Why this is a real issue in this repo:
`resetPassword()` first reads the reset token, then later updates the password and deletes tokens by identifier. Two concurrent requests with the same valid token can both pass the read step before either delete runs, so both requests can return success and the later password write wins. That breaks the intended single-use guarantee.

Evidence:
- `src/lib/password-reset.ts:225` to `src/lib/password-reset.ts:233` reads the token record.
- `src/lib/password-reset.ts:251` to `src/lib/password-reset.ts:265` updates the password and only then deletes tokens with `deleteMany`.
- The delete is not conditioned on successfully consuming exactly one matching token.

Specific fix:
Consume the token inside a transaction with a single atomic check, for example by deleting the exact matching unexpired token first and requiring the delete count to be `1` before updating the password. If the delete affects `0` rows, treat the token as already used or invalid.

#### Registration does not enforce the password policy used by reset and change-password flows

Why this is a real issue in this repo:
The app's only password rule today is a minimum length check, and that rule is enforced during password reset and profile password change but not during initial registration. A new credentials account can therefore be created with an arbitrarily short password and still authenticate normally.

Evidence:
- `src/lib/password-rules.ts:1` to `src/lib/password-rules.ts:4` defines the shared minimum-length rule.
- `src/actions/profile.ts:49` and `src/lib/password-reset.ts:206` apply that rule.
- `src/app/api/auth/register/route.ts:30` to `src/app/api/auth/register/route.ts:60` validates email and password match, but never applies the shared password rule before hashing at `src/app/api/auth/register/route.ts:139`.
- `src/components/auth/register-form.tsx:64` to `src/components/auth/register-form.tsx:88` also omits the rule client-side.

Specific fix:
Use the shared password-validation helper in `src/app/api/auth/register/route.ts` and mirror the same validation in `src/components/auth/register-form.tsx` so weak passwords are rejected consistently before account creation.

### Low

#### The sign-in page will server-redirect authenticated users to an arbitrary `callbackUrl`

Why this is a real issue in this repo:
When a signed-in user visits `/sign-in`, the page reads `callbackUrl` from the query string and passes it directly to Next.js `redirect()`. Next.js accepts absolute external URLs here, so this route can be used as an open redirect on your trusted domain.

Evidence:
- `src/app/sign-in/page.tsx:56` reads `callbackUrl` directly from search params.
- `src/app/sign-in/page.tsx:90` to `src/app/sign-in/page.tsx:91` calls `redirect(callbackUrl)` without origin validation.

Specific fix:
Normalize `callbackUrl` to same-origin relative paths before redirecting. Reject external origins, or map invalid values back to a safe default such as `/dashboard`.

## Passed Checks

- Credentials passwords are compared against bcrypt hashes instead of plaintext values in `src/auth.ts:42` to `src/auth.ts:49`.
- New and changed passwords are hashed with bcrypt before storage in `src/app/api/auth/register/route.ts:139` to `src/app/api/auth/register/route.ts:147`, `src/actions/profile.ts:99` to `src/actions/profile.ts:107`, and `src/lib/password-reset.ts:249` to `src/lib/password-reset.ts:258`.
- Email verification tokens are generated with `randomBytes(32)`, hashed with SHA-256 before persistence, and given a 24-hour expiry in `src/lib/email-verification.ts:30` to `src/lib/email-verification.ts:47`.
- Password reset tokens are generated with `randomBytes(32)`, hashed with SHA-256 before persistence, and given a 1-hour expiry in `src/lib/password-reset.ts:38` to `src/lib/password-reset.ts:55`.
- Existing verification and reset tokens are cleared before issuing a fresh one in `src/lib/email-verification.ts:35` to `src/lib/email-verification.ts:47` and `src/lib/password-reset.ts:43` to `src/lib/password-reset.ts:55`.
- Expired verification and reset tokens are rejected and cleaned up in `src/lib/email-verification.ts:174` to `src/lib/email-verification.ts:183`, `src/lib/password-reset.ts:190` to `src/lib/password-reset.ts:198`, and `src/lib/password-reset.ts:239` to `src/lib/password-reset.ts:247`.
- Credentials sign-in correctly blocks unverified users when email verification is enabled in `src/auth.ts:52` to `src/auth.ts:54`.
- The forgot-password flow keeps its success response generic for nonexistent or OAuth-only accounts in `src/lib/password-reset.ts:147` to `src/lib/password-reset.ts:154` and `src/app/api/auth/forgot-password/route.ts:69` to `src/app/api/auth/forgot-password/route.ts:77`.
- The profile password-change flow requires a valid session and the current password before updating the stored hash in `src/actions/profile.ts:56` to `src/actions/profile.ts:108`.

## Notes

- Verified Next.js redirect behavior against the official docs while assessing `callbackUrl` handling: https://nextjs.org/docs/app/api-reference/functions/redirect
- I did not file findings for CSRF, cookie flags, or OAuth state handling because this repo relies on NextAuth/Auth.js defaults there and I did not find a repo-specific override that weakens them.
