-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "district" TEXT;
ALTER TABLE "Profile" ADD COLUMN "latitude" REAL;
ALTER TABLE "Profile" ADD COLUMN "longitude" REAL;
ALTER TABLE "Profile" ADD COLUMN "region" TEXT;

-- CreateTable
CREATE TABLE "Kundali" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "birthTime" TEXT,
    "birthPlace" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "timezone" TEXT,
    "zodiacSign" TEXT,
    "nakshatra" TEXT,
    "moonSign" TEXT,
    "metadata" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kundali_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kundali_userId_key" ON "Kundali"("userId");

-- CreateIndex
CREATE INDEX "Kundali_zodiacSign_idx" ON "Kundali"("zodiacSign");

-- CreateIndex
CREATE INDEX "Kundali_nakshatra_idx" ON "Kundali"("nakshatra");

-- CreateIndex
CREATE INDEX "Profile_latitude_longitude_idx" ON "Profile"("latitude", "longitude");
