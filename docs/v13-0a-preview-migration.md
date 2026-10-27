# V13.0A — Neon Preview migration runbook

Status: not executed. DO NOT run against Production.

## Confirm target
- Neon project: neon-orange-harbor
- Branch: preview/feature/v13-0a-ai-lesson-foundation
- Database: neondb
- Source migration: prisma/migrations/20261026_v13_ai_lesson_foundation/migration.sql
- Verify the DATABASE_URL used by the migration process points at this exact branch, not main. Do not reveal credentials in logs/screenshots.
- Check a recovery point/backup prior to writes. Never click "Reset from parent" as part of migration.

## Existing schema baseline
The existing Preview contains User, Session, CloudProject and PasswordResetToken, but _prisma_migrations has not been created. The repository contains a V13 migration, not a historical baseline for the four pre-existing tables.

Before using Prisma migrations for production, generate a BASELINE migration from the PRE-V13 schema (all pre-existing models only), using prisma migrate diff --from-empty --to-schema-datamodel <legacy-schema-path> --script. Review its SQL against the live database including indexes, defaults, constraints and foreign keys. Name the baseline migration to sort BEFORE 20261026_v13_ai_lesson_foundation, e.g. 20261001_existing_schema_baseline.

On the Preview branch, once reviewed and connection verified:
1. npx prisma migrate resolve --applied 20261001_existing_schema_baseline
2. npx prisma migrate status
3. npx prisma migrate deploy

NEVER apply the baseline DDL to a database already containing those tables: 'resolve --applied' records it without running it. The V13 migration is the only CREATE TABLE migration intended to run in Preview. Do not execute the SQL directly then separately run migrate deploy.

## Post-migration read-only verification
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('AiLessonPlan','AiLessonSource','_prisma_migrations')
ORDER BY table_name;

SELECT migration_name, finished_at, rolled_back_at
FROM public._prisma_migrations ORDER BY started_at;

## Functional smoke checks
- GET /api/ai-lessons and /api/ai-lessons/sources succeed for a TEACHER and never return data for a different owner.
- Anonymous/LEARNER denied; test create/edit/delete after isolation is verified.
- Preview records stay on Preview; Production main tables and data are unaffected.
- Existing PPTX/SCORM functionality remains unchanged.

If the verified Preview URL still uses Neon main or the migration history does not match the review, stop and do not write.
