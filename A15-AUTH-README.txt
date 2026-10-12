VLEARNING STUDIO V1.1A15 - SERVER AUTH + SQLITE
==================================================

A15 replaces the previous browser-only Local login with a real Next.js backend.

FEATURES
--------
- SQLite database via Prisma ORM
- Server-side user registration
- Server-side login
- HttpOnly session cookie
- Persistent sessions stored in the database
- Remember-me option
- Profile update
- Password change
- Logout
- Account deletion
- Temporary account lock after repeated failed logins
- Same-origin protection for state-changing auth requests

PASSWORD / SESSION SECURITY
---------------------------
- Passwords are hashed on the server with Node.js scrypt + random salt.
- Plaintext passwords are never stored in the database.
- Session tokens are random 256-bit values.
- Only SHA-256 hashes of session tokens are stored in SQLite.
- Browser receives only an HttpOnly session cookie.
- When password changes, other active sessions are revoked.

DATABASE
--------
Prisma schema:
  prisma\schema.prisma

SQLite database created after setup:
  prisma\vlearning.db

FIRST INSTALL ON YOUR CURRENT PROJECT
-------------------------------------
1. Extract this ZIP into:
   C:\Users\Admin\elearning-studio

2. Run:
   SETUP-A15-AUTH.cmd

3. Build:
   npm.cmd run build

4. Start:
   START-VLEARNING.cmd

5. Open:
   http://localhost:3000/projects

LOCAL / LAN USE
---------------
The server/database is real, but it runs wherever the VLearning Next.js server is running.
If another computer can access that server over your LAN, it can use the same account database.

INTERNET / HTTPS DEPLOYMENT
---------------------------
For Internet deployment:
- host the Next.js app on a server/VPS,
- use HTTPS,
- set environment variable:
    VLEARNING_COOKIE_SECURE=1
- back up prisma\vlearning.db,
- configure firewall/reverse proxy.

A15 DOES NOT YET INCLUDE
------------------------
- Email verification
- Email password reset
- Google/Microsoft SSO
- Cloud hosting
- Paid PRO subscriptions
Those require additional infrastructure and are intentionally not faked.
