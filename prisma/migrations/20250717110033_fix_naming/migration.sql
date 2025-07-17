/*
  Warnings:

  - You are about to drop the `ASAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ASAccount";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AsAccount" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "password" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
