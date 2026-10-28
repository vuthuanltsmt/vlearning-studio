import test from "node:test";
import assert from "node:assert/strict";
import { checkDatabaseEndpoint } from "../scripts/check-production-database-host.mjs";

const host = "ep-autumn-credit-b34152lu.c-4.ap-southeast-1.aws.neon.tech";
const url = (hostname) => `postgresql://user:secret@${hostname}/neondb?sslmode=require`;

test("accepts main Neon endpoint", () => {
  assert.equal(checkDatabaseEndpoint(url(host), host).ok, true);
});
test("accepts pooled endpoint of the same Neon compute", () => {
  assert.equal(checkDatabaseEndpoint(url(host.replace(".c-", "-pooler.c-")), host).ok, true);
});
test("blocks a different restored branch endpoint without disclosing URI", () => {
  const r = checkDatabaseEndpoint(url("ep-aged-meadow-b346fzpw-pooler.c-4.ap-southeast-1.aws.neon.tech"), host);
  assert.equal(r.ok, false);
  assert.equal(r.reason.includes("secret"), false);
});
test("fails closed when configuration is missing or malformed", () => {
  assert.equal(checkDatabaseEndpoint("", host).ok, false);
  assert.equal(checkDatabaseEndpoint("invalid", host).ok, false);
  assert.equal(checkDatabaseEndpoint(url(host), "").ok, false);
});
