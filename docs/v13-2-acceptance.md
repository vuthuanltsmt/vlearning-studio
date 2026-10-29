# VLearning V13.2 — AI Lesson Editor acceptance

Branch: `feature/v13-2-ai-lesson-editor` (based on V13.1 Preview). Production untouched.

## Implemented MVP
- `/ai-lessons/editor`: seven pedagogical editing sections; loads existing Cloud draft for manual sectioning.
- `POST /api/ai-lessons/export-docx`: generates Word .docx without new dependencies; server checks same-origin and TEACHER/ADMIN authorization.
- `POST /api/ai-lessons/generate-quiz`: creates five multiple-choice questions via server-side Gemini key, validates the JSON structure; review answers before use.
- Quiz download JSON is an **interchange draft only**. Importing quiz into the interactive editor and actual SCORM 1.2 export is **not yet implemented or accepted**.

## Required checks
- [ ] Preview deployment builds and is READY.
- [ ] TEACHER loads their saved V13.1 draft, edits sections, exports Word and verifies Vietnamese diacritics and sections in Word.
- [ ] Gemini produces 5 relevant questions; teacher checks correctness.
- [ ] LEARNER is rejected on Word/Quiz endpoints.
- [ ] Legacy editor and SCORM 1.2 remain unaffected.
- [ ] Implement and test direct handoff to quiz/editor before declaring end-to-end SCORM complete.

Preview deploys are not Production releases. The preexisting V13.0A Production database routing gate remains separate.
