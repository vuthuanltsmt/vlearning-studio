import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = (path) => readFileSync(new URL("../app/api/ai-lessons/" + path, import.meta.url), "utf8");

test("Lesson collection API gates access and scopes reads and creation to the session user", () => {
  const source = route("route.ts");
  assert.match(source, /await requireLessonAuthor\(\)/);
  assert.match(source, /findMany\(\{where:\{ownerUserId:user\.id\}/);
  assert.match(source, /create\(\{data:\{ownerUserId:user\.id/);
  assert.match(source, /await requireSameOrigin\(request\)/);
});

test("Lesson modifications cannot update or delete another owner's lesson", () => {
  const source = route("[id]/route.ts");
  assert.match(source, /updateMany\(\{where:\{id,ownerUserId:user\.id\}/);
  assert.match(source, /findFirst\(\{where:\{id,ownerUserId:user\.id\}/);
  assert.match(source, /aiLessonSource\.updateMany\(\{where:\{ownerUserId:user\.id,lessonId:id\}/);
  assert.match(source, /await requireLessonAuthor\(\)/);
  assert.match(source, /await requireSameOrigin\(req\)/);
});

test("Source listings, uploads and deletes are owner-scoped", () => {
  const collection = route("sources/route.ts");
  const item = route("sources/[id]/route.ts");
  assert.match(collection, /findMany\(\{where:\{ownerUserId:user\.id\}/);
  assert.match(collection, /findFirst\(\{where:\{id:lessonId,ownerUserId:user\.id\}/);
  assert.match(collection, /create\(\{data:\{ownerUserId:user\.id/);
  assert.match(item, /deleteMany\(\{where:\{id,ownerUserId:user\.id\}/);
  assert.match(collection, /await requireSameOrigin\(req\)/);
  assert.match(item, /await requireSameOrigin\(req\)/);
  assert.match(collection, /await requireLessonAuthor\(\)/);
  assert.match(item, /await requireLessonAuthor\(\)/);
});
