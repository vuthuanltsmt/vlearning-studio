import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = readFileSync("prisma/migrations/20261001_existing_schema_baseline/migration.sql", "utf8");
const v13 = readFileSync("prisma/migrations/20261026_v13_ai_lesson_foundation/migration.sql", "utf8");

test("legacy migration baseline must be resolved, not replayed on an existing DB", () => {
  assert.match(base, /MUST NOT BE EXECUTED AGAINST AN EXISTING DATABASE/i);
  for (const table of ["User", "Session", "CloudProject", "PasswordResetToken"]) {
    assert.match(base, new RegExp('CREATE TABLE "' + table + '"'));
  }
});

test("V13 migration is strictly additive to new AI Lesson tables", () => {
  const statements = v13.split(";").map(s => s.trim()).filter(Boolean);
  assert.equal(statements.length, 4);
  assert.equal(statements.filter(s => s.startsWith("CREATE TABLE ")).length, 2);
  assert.equal(statements.filter(s => s.startsWith("CREATE INDEX ")).length, 2);
  for (const s of statements) assert.match(s, /^CREATE (?:TABLE|INDEX) "AiLesson(?:Plan|Source)/);
  assert.doesNotMatch(v13, /\b(?:DROP|TRUNCATE|DELETE|UPDATE|ALTER)\s+(?:TABLE\s+)?(?:"User"|"Session"|"CloudProject"|"PasswordResetToken")/i);
});
