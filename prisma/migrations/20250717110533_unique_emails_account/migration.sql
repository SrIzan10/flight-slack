/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `AsAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AsAccount_email_key" ON "AsAccount"("email");
