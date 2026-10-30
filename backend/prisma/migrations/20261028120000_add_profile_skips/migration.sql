CREATE TABLE "ProfileSkip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skippedById" TEXT NOT NULL,
    "skippedUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileSkip_skippedById_fkey" FOREIGN KEY ("skippedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileSkip_skippedUserId_fkey" FOREIGN KEY ("skippedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProfileSkip_skippedById_skippedUserId_key" ON "ProfileSkip"("skippedById", "skippedUserId");
