# V13.0A acceptance evidence — 2026-10-28

Scope: **Neon Preview** `preview/feature/v13-0a-ai-lesson-foundation` and Vercel feature-branch Preview only. Production not changed or merged.

## Verified
- Neon project `proud-night-44809160`, Preview branch `br-silent-sea-b3j9g81b`, database `neondb`.
- The Preview schema contains `AiLessonPlan`, `AiLessonSource`, and `_prisma_migrations`.
- Both baseline and V13 migration history rows show completed and not rolled back.
- Neon compare_database_schema (Preview vs main) shows **only** the three expected new tables and their constraints/indexes; no existing table definition changes.
- SQL smoke test (insert/verify/delete) on Preview created a lesson and linked source, confirmed one linked source, deleted both. Follow-up counts were zero for both V13 tables.
- Existing Preview counts remained: User 23, Session 14, CloudProject 1, PasswordResetToken 1.
- Vercel Preview deployment `dpl_3Fi3kB6g5qdj4vfMJnKaZfmSppSk` commit `da9cfe3` reported READY.
- Public `/ai-lessons` returned HTTP 200; `/api/auth/me` returned HTTP 200 with `user:null` when unauthenticated.

## Not yet verified — release blockers
- Successful TEACHER/ADMIN authenticated API request, create/edit/delete, and persistence after reload.
- LEARNER and cross-owner HTTP authorization end-to-end.
- The new GitHub Actions test job completion status.
- Existing PPTX/SCORM feature regression after any eventual merge.

The Vercel deployment is protected and existing tool fetches of authenticated `/api/ai-lessons` did not produce an app API response, so no claim of API end-to-end success can be made.

**Release gate:** Keep PR #8 unmerged until authenticated Cloud CRUD, role/ownership checks, and regression checks have passed. Never apply baseline CREATE TABLE statements to a database where the legacy tables already exist.
