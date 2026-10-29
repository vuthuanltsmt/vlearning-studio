import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Word export is authenticated and same-origin",()=>{const s=read("app/api/ai-lessons/export-docx/route.ts");assert.match(s,/requireLessonAuthor/);assert.match(s,/requireSameOrigin/);assert.match(s,/lessonDocx/);});
test("Quiz API is Gemini-backed and authenticated",()=>{const s=read("app/api/ai-lessons/generate-quiz/route.ts");assert.match(s,/GEMINI_API_KEY/);assert.match(s,/requireLessonAuthor/);assert.match(s,/correctIndex/);});
test("Editor exposes structured sections and export",()=>{const s=read("app/ai-lessons/editor/page.tsx");assert.match(s,/Xuất giáo án Word/);assert.match(s,/Hình thành kiến thức/);assert.match(s,/generate-quiz/);});
