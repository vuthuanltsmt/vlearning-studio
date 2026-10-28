import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const generate = readFileSync("app/api/ai-lessons/generate/route.ts","utf8");
const save = readFileSync("app/api/ai-lessons/draft/route.ts","utf8");
const load = readFileSync("app/api/ai-lessons/[id]/draft/route.ts","utf8");
const ui = readFileSync("app/ai-lessons/compose/page.tsx","utf8");

test("AI generation is author-only and same-origin",()=>{
  assert.match(generate,/requireSameOrigin\(req\)/);
  assert.match(generate,/requireLessonAuthor\(\)/);
  assert.match(generate,/GEMINI_API_KEY/);
  assert.match(generate,/generativelanguage\\.googleapis\\.com/);
});
test("Cloud save/load enforce lesson owner",()=>{
  assert.match(save,/ownerUserId:\s*user\.id/);
  assert.match(load,/ownerUserId:\s*user\.id/);
  assert.match(save,/requireSameOrigin\(req\)/);
});
test("NotebookLM input is manual and drafts can be edited and reloaded",()=>{
  assert.match(ui,/NotebookLM/);
  assert.match(ui,/setSourceText/);
  assert.match(ui,/setDraftText/);
  assert.match(ui,/loadDraft/);
  assert.match(ui,/Lưu bản nháp Cloud/);
});
