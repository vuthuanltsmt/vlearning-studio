# VLearning V13.1 — AI lesson drafting and NotebookLM import

Feature branch: `feature/v13-1-ai-notebooklm-compose`. Not merged or deployed to Production.

## MVP workflow

1. Sign in as TEACHER or ADMIN and create a Cloud lesson on `/ai-lessons`.
2. Open **Soạn bằng AI / NotebookLM** or `/ai-lessons/compose`.
3. In Google NotebookLM, obtain a summary/notes from your own permitted sources; copy and paste the text into the input. **There is no NotebookLM account authorization/API integration.**
4. Optionally enter pedagogical directions. Choose **Soạn giáo án bằng AI** to ask the configured model to create a draft grounded in the supplied source. AI refuses gracefully if `OPENAI_API_KEY` has not been configured.
5. Edit the draft as needed and select **Lưu bản nháp Cloud**. The source and draft are saved in the existing `AiLessonPlan.contentJson` column. Select **Tải bản đã lưu** to reload it.

## Required environment configuration

- `OPENAI_API_KEY`: server-side key, never exposed in client-side variables or checked into Git.
- `OPENAI_LESSON_MODEL` (optional): model for the Chat Completions endpoint; the default is `gpt-4.1-mini`.
- Existing scoped `DATABASE_URL` must point to the appropriate Neon Preview environment before testing. **Production database endpoint remediation from V13.0A is still open.**

## Safety and limitations

- AI generation is restricted to signed-in TEACHER/ADMIN; generation and saving enforce same-origin checks.
- Saved lessons are owner-scoped and drafts are unreviewed. AI may make mistakes; the teacher reviews the material.
- Only pasted NotebookLM text is used as input; original NotebookLM files or citations are not retrieved or verified automatically.
- Do not paste private student data, secrets, or copyrighted content without permission.
- No schema migration is needed for this feature beyond the existing V13.0A schema.
- API uses an external AI service; relevant text is sent to that service when the user explicitly selects **Soạn giáo án bằng AI**.

## Acceptance checklist

- [ ] CI/Next.js build PASS for this branch.
- [ ] Authenticated TEACHER saves/imports a note and AI drafts; Cloud reload preserves data.
- [ ] No-key error is helpful, manual entry still works.
- [ ] TEACHER B cannot access TEACHER A's drafts; LEARNER is refused.
- [ ] Existing V13.0A lesson, source and SCORM flows do not regress.
- [ ] Preview endpoint confirmed not Production before any runtime tests.

Production deployment and merge must remain separate from this feature branch until V13.0A Production release safety gate is resolved.

## Preview deployment verified — 2026-10-28
- Vercel deployment `dpl_BmUBpf7D7mwEVahmeyH5qmyuZ2YY` is **READY**.
- Protected Preview `/ai-lessons/compose` returned HTTP 200 HTML; unauthenticated `/api/auth/me` returned HTTP 200 with `user:null` as expected. This verifies routing/availability, **not authenticated editing or AI generation**.
- The Vercel project currently has **no `OPENAI_API_KEY` variable**. The AI generation endpoint will return a helpful 503 until a server-side key is configured. Never put the API key in GitHub or a client-side `NEXT_PUBLIC_*` variable.
- Remaining: authenticated teacher test paste/edit/save/reload; owner isolation and LEARNER denial; real AI response after securely configuring key; confirm Preview's database points to the intended branch.
