import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const doc=readFileSync("app/api/ai-lessons/export-docx/route.ts","utf8");
const quiz=readFileSync("app/api/ai-lessons/generate-quiz/route.ts","utf8");
const editor=readFileSync("app/ai-lessons/editor/page.tsx","utf8");
test("V13.2 protected DOCX export",()=>{assert.match(doc,/requireLessonAuthor\(\)/);assert.match(doc,/requireSameOrigin\(req\)/);assert.match(doc,/lessonDocx/);});
test("V13.2 protected Gemini quizzes",()=>{assert.match(quiz,/requireLessonAuthor\(\)/);assert.match(quiz,/requireSameOrigin\(req\)/);assert.match(quiz,/GEMINI_API_KEY/);assert.match(quiz,/correctIndex/);});
test("V13.2 editing and explicit SCORM limitation",()=>{assert.match(editor,/Xuất giáo án Word/);assert.match(editor,/Gemini tạo 5 câu trắc nghiệm/);assert.match(editor,/chưa nhập tự động vào SCORM/);});
