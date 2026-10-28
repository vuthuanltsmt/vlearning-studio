// Read-only release gate. Never logs the full connection URI or its credentials.
export function checkDatabaseEndpoint(connectionUri, expectedEndpoint) {
  if (!connectionUri || !expectedEndpoint) {
    return { ok: false, reason: "Missing database URI or expected endpoint." };
  }
  let hostname;
  try {
    hostname = new URL(connectionUri).hostname.toLowerCase();
  } catch {
    return { ok: false, reason: "Invalid database URI." };
  }
  const expected = expectedEndpoint.toLowerCase();
  // Accept both direct and pooled endpoints for the same Neon compute.
  const allowed = new Set([expected, expected.replace(".c-", "-pooler.c-")]);
  if (!allowed.has(hostname)) {
    return { ok: false, reason: "Database endpoint does not match approved Production endpoint." };
  }
  return { ok: true, reason: "Database endpoint matches approved Production endpoint." };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const result = checkDatabaseEndpoint(process.env.DATABASE_URL, process.env.EXPECTED_PRODUCTION_NEON_HOST);
  console.log(result.reason);
  if (!result.ok) process.exitCode = 1;
}
