-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slackId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_slackId_key" ON "Invite"("slackId");
