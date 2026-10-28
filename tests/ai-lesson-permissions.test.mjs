import test from "node:test";
import assert from "node:assert/strict";
import { canAuthor, canManageUsers, isAccessRole } from "../lib/permissions.ts";

test("Only ADMIN and TEACHER may author lessons", () => {
  assert.equal(canAuthor("ADMIN"), true);
  assert.equal(canAuthor("TEACHER"), true);
  for (const value of ["LEARNER", null, undefined, "", "teacher", "SUPERUSER"]) {
    assert.equal(canAuthor(value), false, `Unexpected author access: ${value}`);
  }
});

test("Only ADMIN may manage user accounts", () => {
  assert.equal(canManageUsers("ADMIN"), true);
  assert.equal(canManageUsers("TEACHER"), false);
  assert.equal(canManageUsers("LEARNER"), false);
});

test("Unknown and malformed roles are rejected", () => {
  for (const role of ["ADMIN", "TEACHER", "LEARNER"]) assert.equal(isAccessRole(role), true);
  for (const role of ["OWNER", "teacher", "", 0, null, undefined]) assert.equal(isAccessRole(role), false);
});
