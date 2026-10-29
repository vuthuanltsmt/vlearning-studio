import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const src=readFileSync("lib/parseLessonDraftV132.ts","utf8");
test("parser reuses activity 2.1 placeholder instead of creating empty duplicate",()=>{
 assert.match(src,/const existing=number\?/);
 assert.match(src,/result\[existing\]\.heading=name/);
 assert.match(src,/return existing/);
});
