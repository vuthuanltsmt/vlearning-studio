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

## Additional user acceptance
- On 2026-10-28, the tester responded **Đạt** to the follow-up acceptance covering lesson edit/delete and source upload/delete. Record this as user-reported PASS, not automated test evidence.

## Remaining release checks
- User has additionally reported PASS for the requested follow-up UI acceptance (edit/delete lesson and source upload/delete). Individual operations were not independently instrumented by the assistant.
- Check ADMIN UI access if that role is part of the release criteria.
- Run regression checks on existing video, quiz, and SCORM workflows before promotion to Production.
- Verify the Production migration/rollout plan; the Prisma baseline is historical and should be recorded as applied rather than re-created on a live legacy database.

Vercel Preview SSO protection remains enabled. The user reported end-to-end app behavior above, but the assistant has not independently captured authenticated API responses.

**Release gate:** Keep PR #8 unmerged pending remaining edit/delete/upload, ADMIN if required, and legacy workflow regression checks; plan Production migrations separately. Never apply baseline CREATE TABLE statements to a database where the legacy tables already exist.

## Legacy regression test protocol (pending manual execution)

On a protected **Preview** session using a disposable local project (do not overwrite real Cloud projects):
1. Create/open a project via `/projects` and save it locally; reload and verify the project can be reopened.
2. Import a small MP4, check play/pause, seek, and editing without console errors.
3. Add a quiz, edit question/answer, duplicate and delete quiz; preview jump-to-quiz and score/result.
4. Export SCORM 1.2 and check the ZIP contains the manifest. Import into a SCORM test harness/LMS and verify launch, completion and pass/fail reporting.
5. Verify existing Cloud project load/save with the existing authorized account; no destructive edits to real content.
6. Check AI Lesson link appears only for eligible author roles and existing sidebar navigation still functions.

Review of PR #8 changed-filename list shows only new AI Lesson routes/UI, Prisma files, CI/tests/docs and `components/projects/LeftSidebar.tsx` among existing UI files. This limits legacy-code change surface but **does not prove functionality without runtime regression**.

**No legacy regression results have yet been reported.** Require explicit test results before Production merge.

## Final legacy regression — user-reported PASS (2026-10-28)
The tester explicitly confirmed **6/6** on disposable Preview test flows: Projects, Video, Quiz, SCORM 1.2, Cloud, and Menu. This is acceptance reported by the user, not instrumented browser automation.

## Pre-production safety branch
- Created new Neon branch `release-safety/v13-0a-preproduction-20261028` (`br-long-dawn-b3qe7ms7`) from Production main `br-frosty-surf-b3183drm` at parent LSN `0/2B6A6F0` (2026-10-28 02:51:09 UTC).
- Branch reached **ready**, created with **no compute** to avoid idle compute. Production was not written to.
- A branch at a point in time is not proof that an end-to-end restore has been tested; do not promise verified rollback without a rehearsal.
- Production still has no `_prisma_migrations` table as of the last read-only check. Baseline must be resolved as applied, not replayed.

## Remaining release gate
- Validate a recoverable restore path and a safe production migration procedure (including baseline registration), verify current Production configuration is ready for the new Prisma schema, and separately authorize the irreversible production promotion.
- Keep PR #8 unmerged until completed.
