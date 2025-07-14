-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "faFlightId" TEXT NOT NULL,
    "ident" TEXT NOT NULL,
    "identIcao" TEXT NOT NULL,
    "identIata" TEXT,
    "registration" TEXT,
    "aircraftType" TEXT,
    "originCode" TEXT NOT NULL,
    "originIata" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "destinationIata" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "scheduledOut" DATETIME NOT NULL,
    "scheduledOff" DATETIME NOT NULL,
    "scheduledOn" DATETIME NOT NULL,
    "scheduledIn" DATETIME NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Flight_faFlightId_key" ON "Flight"("faFlightId");

-- CreateIndex
CREATE INDEX "Flight_userId_idx" ON "Flight"("userId");

-- CreateIndex
CREATE INDEX "Flight_faFlightId_idx" ON "Flight"("faFlightId");

-- CreateIndex
CREATE INDEX "Flight_scheduledOff_idx" ON "Flight"("scheduledOff");
