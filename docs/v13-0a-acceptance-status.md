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

## User-verified acceptance on 2026-10-28
The tester reported **PASS (4/4)** on the current feature Preview:
1. TEACHER A created `TEST-OWNER-A` and saved it to Cloud.
2. TEACHER B signed in and could not see A's lesson.
3. TEACHER A signed back in and the lesson was still present.
4. LEARNER was blocked from creating or accessing lesson data.

This is **user-reported functional acceptance**, not an independently captured authenticated HTTP trace. The tester also previously confirmed Cloud-save/reload success.

## Latest automation and deployment evidence
- GitHub Actions run `40622555234` for commit `9dfa87c`: **completed / success**.
- Vercel deployment `dpl_6tEstY2eQj5xwMxsBWNRVHVW78V2` for commit `9dfa87c`: **READY**.
- CI includes role-policy tests and source-level API owner-scope regression checks. Those checks do not substitute for authenticated cross-user HTTP tests.

## Remaining release checks
- Confirm edit, delete, and file upload/delete through the UI (only create/save/reload and cross-account visibility were explicitly reported).
- Check ADMIN UI access if that role is part of the release criteria.
- Run regression checks on existing video, quiz, and SCORM workflows before promotion to Production.
- Verify the Production migration/rollout plan; the Prisma baseline is historical and should be recorded as applied rather than re-created on a live legacy database.

Vercel Preview SSO protection remains enabled. The user reported end-to-end app behavior above, but the assistant has not independently captured authenticated API responses.

**Release gate:** Keep PR #8 unmerged pending remaining edit/delete/upload, ADMIN if required, and legacy workflow regression checks; plan Production migrations separately. Never apply baseline CREATE TABLE statements to a database where the legacy tables already exist.
