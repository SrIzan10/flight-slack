-- CreateTable
CREATE TABLE "public"."Flight" (
    "id" TEXT NOT NULL,
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
    "originTimezone" TEXT NOT NULL,
    "destinationIcao" TEXT NOT NULL,
    "destinationIata" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "destinationTimezone" TEXT NOT NULL,
    "scheduledOut" TIMESTAMP(3),
    "scheduledOff" TIMESTAMP(3) NOT NULL,
    "scheduledOn" TIMESTAMP(3) NOT NULL,
    "scheduledIn" TIMESTAMP(3),
    "estimatedOut" TIMESTAMP(3),
    "estimatedOff" TIMESTAMP(3),
    "estimatedOn" TIMESTAMP(3),
    "estimatedIn" TIMESTAMP(3),
    "actualOut" TIMESTAMP(3),
    "actualOff" TIMESTAMP(3),
    "actualOn" TIMESTAMP(3),
    "actualIn" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AsAccount" (
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastResetDate" TIMESTAMP(3),

    CONSTRAINT "AsAccount_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "public"."Invite" (
    "id" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flight_faFlightId_key" ON "public"."Flight"("faFlightId");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_mortalsId_key" ON "public"."Flight"("mortalsId");

-- CreateIndex
CREATE INDEX "Flight_userId_idx" ON "public"."Flight"("userId");

-- CreateIndex
CREATE INDEX "Flight_faFlightId_idx" ON "public"."Flight"("faFlightId");

-- CreateIndex
CREATE INDEX "Flight_scheduledOff_idx" ON "public"."Flight"("scheduledOff");

-- CreateIndex
CREATE UNIQUE INDEX "AsAccount_email_key" ON "public"."AsAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_slackId_key" ON "public"."Invite"("slackId");
