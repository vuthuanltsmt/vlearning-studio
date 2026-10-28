# V13.0A release blocker — Vercel Production / Neon endpoint mapping

Checked on 2026-10-28. This is an operational release blocker, not a completed fix.

## Verified facts
- Neon Production root/default: branch `main`, ID `br-frosty-surf-b3183drm`, compute host identifier `ep-autumn-credit-b34152lu`.
- The independent restore-test branch `br-rapid-haze-b33txskf` uses compute identifier `ep-aged-meadow-b346fzpw`.
- Existing Vercel project connection variables `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_HOST` reference the **restore-test** endpoint identifier. The variables currently target Production, Preview and Development together.
- Neon Production root was checked read-only: 24 User rows, 1 CloudProject row, no _prisma_migrations table. Public Production /api/auth/me returned HTTP 200 unauthenticated, which does not prove DB routing.
- Connection secrets must never be published in GitHub, tickets or logs.

## Controlled recovery plan — NOT YET EXECUTED
1. Freeze V13 merges/migrations and any restore/swap action. Preserve manual snapshot and independent branches.
2. Verify which environment variables are baked into the active Vercel Production deployment and which database host is used for live requests. Do not rely on names or an HTTP 200 from an unauthenticated route alone.
3. Prepare **Production-only** database variables pointing to the root branch's verified compute, with role/password validated privately. Preserve the separate Preview database connection and never bulk-replace all-target shared variables.
4. Stage Production-only values and verify that they take precedence over old all-target values; check variable precedence/duplicate rules first. Record a secure rollback plan.
5. Use a controlled Production redeploy (separate from PR #8) only after connection validation and a maintenance plan. Verify Cloud read/write and prior records. Roll back deployment/config if checks fail.
6. Only after mapping is restored: run migration rollout through a separately authorized release, marking historical baseline **applied**, never executing baseline table DDL on existing Production.

**Never** call Neon restore_snapshot without explicitly reviewing finalize behavior: a prior default restore unexpectedly switched main/default branch. Avoid all branch restore operations until the procedure is revalidated.