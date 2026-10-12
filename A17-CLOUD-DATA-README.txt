VLEARNING STUDIO V1.1A17 - CLOUD DATA FOUNDATION
====================================================

GOAL
----
A17 is the first step from Local-only VLearning to an Online architecture.

A17 adds:
- PostgreSQL Cloud database dedicated to Project data
- Project ownership by authenticated account ID
- Cloud Project API
- Push Local Project snapshots to Cloud
- Pull Cloud Project snapshots back to Local
- Cloud connection/status UI in "Bài giảng mới nhất"
- Account-isolated Project data

IMPORTANT SCOPE
---------------
A17 synchronizes the STRUCTURE of a Project:
- Project metadata
- Pages
- Quiz/questions
- Completion/settings stored in Project JSON

A17 DOES NOT YET upload:
- video files
- project thumbnails
- other large media

Those remain in IndexedDB/local browser storage.
A18 will add Cloud Media Storage.

WHY A17 DOES NOT REPLACE A16 SQLITE AUTH YET
--------------------------------------------
A16 server authentication remains intact and provides the authenticated user ID.
CloudProject rows store ownerUserId from that authenticated account.

This is safe for a single VLearning server/VPS deployment and lets us move
Project data to PostgreSQL without breaking the existing account system.

A later production deployment phase can move the remaining account/session
database to managed PostgreSQL as well if desired.

POSTGRESQL SCHEMA
-----------------
File:
  prisma\cloud\schema.prisma

Generated client:
  generated\cloud-prisma

Environment variable:
  CLOUD_DATABASE_URL

Cloud table:
  CloudProject

Each row is isolated by:
  ownerUserId + projectId

API
---
GET    /api/cloud/status
GET    /api/cloud/projects
GET    /api/cloud/projects/:projectId
POST   /api/cloud/projects/sync
DELETE /api/cloud/projects/:projectId

FIRST SETUP
-----------
1. Obtain a PostgreSQL connection URL from your PostgreSQL provider.

   It normally looks like:
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require

2. Extract this ZIP into:
   C:\Users\Admin\elearning-studio

3. Run:
   SETUP-A17-CLOUD.cmd

4. Paste the PostgreSQL URL when requested.

5. The script will:
   - save CLOUD_DATABASE_URL in .env
   - install/check Prisma 6
   - generate A16 auth Prisma Client
   - generate the A17 Cloud Prisma Client
   - push the CloudProject schema to PostgreSQL
   - test the database
   - build VLearning

6. Start:
   START-VLEARNING.cmd

7. Open:
   http://localhost:3000/projects

8. Login as ADMIN or TEACHER.

9. In "Bài giảng mới nhất" look for:
   A17 CLOUD PROJECT / CLOUD ONLINE

10. Use:
   ĐẨY LÊN CLOUD
   TẢI TỪ CLOUD

VERIFY
------
Run:
  VERIFY-A17-CLOUD.cmd

SAFETY
------
- Push to Cloud does NOT delete the Local Project.
- Pull from Cloud warns before replacing a Local Project with the same ID.
- Cloud queries are scoped to the signed-in ownerUserId.
- LEARNER accounts cannot use Project Cloud sync.
- State-changing APIs use the existing same-origin protection.

ONLINE DEPLOYMENT
-----------------
A17 is "cloud-data ready", but localhost is still localhost.

To make VLearning reachable from the Internet we still need deployment:
- public server/VPS or supported Next.js host
- domain
- HTTPS
- production environment variables

That deployment stage comes after Cloud media in the recommended sequence.

BACK UP BEFORE MIGRATION
------------------------
Keep your existing .vlearning.zip backups.
Do not delete Local Projects until Cloud Project + A18 media migration has been tested.
