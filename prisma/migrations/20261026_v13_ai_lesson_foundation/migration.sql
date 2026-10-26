CREATE TABLE "AiLessonPlan" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT '',
    "periods" INTEGER NOT NULL DEFAULT 1,
    "textbook" TEXT NOT NULL DEFAULT '',
    "objectives" TEXT NOT NULL DEFAULT '',
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiLessonPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiLessonPlan_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AiLessonPlan_ownerUserId_updatedAt_idx" ON "AiLessonPlan"("ownerUserId","updatedAt");

CREATE TABLE "AiLessonSource" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "lessonId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiLessonSource_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiLessonSource_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiLessonSource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "AiLessonPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AiLessonSource_ownerUserId_lessonId_idx" ON "AiLessonSource"("ownerUserId","lessonId");
