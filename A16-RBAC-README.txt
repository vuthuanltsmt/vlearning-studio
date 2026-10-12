VLEARNING STUDIO V1.1A16 - ROLE-BASED ACCESS CONTROL
=======================================================

A16 adds real server-side roles on top of the A15 account/database system.

SYSTEM ROLES
------------
ADMIN
- Full authoring access
- Projects / Editor
- Games
- AI Script
- AI Settings
- User administration
- Can promote/demote users
- Can enable/disable accounts
- Can delete other accounts

TEACHER
- Projects / Editor
- Games
- AI Script
- AI Settings
- Preview / SCORM authoring
- Cannot administer users

LEARNER
- No authoring access
- Cannot open the Editor
- Can use account, guide, privacy/language/terms areas
- Intended for future assigned-course/player workflows

IMPORTANT: profile "role" and system "accessRole" are different:
- profile role = descriptive job/title such as Giáo viên, Cán bộ quản lý
- accessRole = ADMIN / TEACHER / LEARNER and controls permissions

FIRST INSTALL
-------------
1. Extract A16 into:
   C:\Users\Admin\elearning-studio

2. Run:
   SETUP-A16-RBAC.cmd

3. Build:
   npm.cmd run build

4. Start:
   START-VLEARNING.cmd

5. Open:
   http://localhost:3000/projects

FIRST ACCOUNT
-------------
On a brand-new database, the first registered account is automatically ADMIN.
All later self-registered accounts start as LEARNER.

UPGRADING AN EXISTING A15 DATABASE
----------------------------------
A15 users receive TEACHER access by Prisma default after db push.
If your database has no ADMIN:
1. Run PROMOTE-A16-ADMIN.cmd
2. Enter the email of the account to promote.
3. Sign in again.
4. A new sidebar item "Quản trị người dùng" appears.

SERVER-SIDE ENFORCEMENT
-----------------------
- Admin APIs check ADMIN role on the server.
- Editor route has a server layout guard: only ADMIN/TEACHER may open it.
- Disabled accounts are blocked at login.
- Disabled users' server sessions are invalidated.
- Role/status changes revoke that user's current sessions.
- The currently signed-in admin cannot demote, disable, or delete itself.
- The system prevents removal of the last active admin.

DATABASE CHANGES
----------------
User now includes:
  accessRole String @default("TEACHER")
  isActive   Boolean @default(true)

SECURITY NOTES
--------------
A16 keeps A15 security:
- scrypt + random salt for passwords
- HttpOnly server session cookie
- only token hashes stored in SQLite
- same-origin checks on state-changing APIs
- temporary login lockout after repeated failures

PROJECT STORAGE NOTE
--------------------
A16 controls access to authoring, but project/video/game data is still stored
using the existing local browser/IndexedDB project system. It is NOT yet moved
into per-user cloud/server storage.

A future cloud-data phase can add:
- project ownership in the database
- assigned courses for learners
- server-side project storage
- organization/school workspaces
- sharing and collaboration
