/*
  Warnings:

  - Added the required column `mortalsId` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "faFlightId" TEXT NOT NULL,
    "mortalsId" INTEGER NOT NULL,
    "ident" TEXT NOT NULL,
    "identIcao" TEXT NOT NULL,
    "identIata" TEXT,
    "registration" TEXT,
    "aircraftType" TEXT,
    "originIcao" TEXT NOT NULL,
    "originIata" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destinationIcao" TEXT NOT NULL,
    "destinationIata" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "scheduledOut" DATETIME,
    "scheduledOff" DATETIME NOT NULL,
    "scheduledOn" DATETIME NOT NULL,
    "scheduledIn" DATETIME,
    "estimatedOut" DATETIME,
    "estimatedOff" DATETIME,
    "estimatedOn" DATETIME,
    "estimatedIn" DATETIME,
    "actualOut" DATETIME,
    "actualOff" DATETIME,
    "actualOn" DATETIME,
    "actualIn" DATETIME,
    "status" TEXT NOT NULL,
    "departureDelay" INTEGER,
    "arrivalDelay" INTEGER,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "diverted" BOOLEAN NOT NULL DEFAULT false,
    "progressPercent" INTEGER,
    "gateOrigin" TEXT,
    "gateDestination" TEXT,
    "terminalOrigin" TEXT,
    "terminalDestination" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Flight" ("actualIn", "actualOff", "actualOn", "actualOut", "aircraftType", "arrivalDelay", "cancelled", "channelId", "createdAt", "departureDelay", "destinationCity", "destinationIata", "destinationIcao", "destinationName", "diverted", "estimatedIn", "estimatedOff", "estimatedOn", "estimatedOut", "faFlightId", "gateDestination", "gateOrigin", "id", "ident", "identIata", "identIcao", "originCity", "originIata", "originIcao", "originName", "progressPercent", "registration", "scheduledIn", "scheduledOff", "scheduledOn", "scheduledOut", "status", "terminalDestination", "terminalOrigin", "updatedAt", "userId") SELECT "actualIn", "actualOff", "actualOn", "actualOut", "aircraftType", "arrivalDelay", "cancelled", "channelId", "createdAt", "departureDelay", "destinationCity", "destinationIata", "destinationIcao", "destinationName", "diverted", "estimatedIn", "estimatedOff", "estimatedOn", "estimatedOut", "faFlightId", "gateDestination", "gateOrigin", "id", "ident", "identIata", "identIcao", "originCity", "originIata", "originIcao", "originName", "progressPercent", "registration", "scheduledIn", "scheduledOff", "scheduledOn", "scheduledOut", "status", "terminalDestination", "terminalOrigin", "updatedAt", "userId" FROM "Flight";
DROP TABLE "Flight";
ALTER TABLE "new_Flight" RENAME TO "Flight";
CREATE UNIQUE INDEX "Flight_faFlightId_key" ON "Flight"("faFlightId");
CREATE UNIQUE INDEX "Flight_mortalsId_key" ON "Flight"("mortalsId");
CREATE INDEX "Flight_userId_idx" ON "Flight"("userId");
CREATE INDEX "Flight_faFlightId_idx" ON "Flight"("faFlightId");
CREATE INDEX "Flight_scheduledOff_idx" ON "Flight"("scheduledOff");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
