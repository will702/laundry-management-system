-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "filePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL DEFAULT '',
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ScheduledReport" ("createdAt", "filePath", "fileSize", "id", "periodEnd", "periodStart", "reportType", "updatedAt") SELECT "createdAt", "filePath", "fileSize", "id", "periodEnd", "periodStart", "reportType", "updatedAt" FROM "ScheduledReport";
DROP TABLE "ScheduledReport";
ALTER TABLE "new_ScheduledReport" RENAME TO "ScheduledReport";
CREATE INDEX "ScheduledReport_reportType_createdAt_idx" ON "ScheduledReport"("reportType", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
