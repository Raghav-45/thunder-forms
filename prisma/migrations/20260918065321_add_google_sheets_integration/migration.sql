-- CreateEnum
CREATE TYPE "GoogleSheetsConnectionStatus" AS ENUM ('ACTIVE', 'REAUTH_REQUIRED');

-- CreateEnum
CREATE TYPE "GoogleSheetsIntegrationStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "GoogleSheetsDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "google_sheets_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "grantedScopes" TEXT NOT NULL,
    "status" "GoogleSheetsConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_sheets_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_sheets_oauth_attempts" (
    "state" TEXT NOT NULL,
    "encryptedCodeVerifier" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_sheets_oauth_attempts_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "google_sheets_integrations" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "spreadsheetUrl" TEXT NOT NULL,
    "spreadsheetTitle" TEXT NOT NULL,
    "sheetId" INTEGER NOT NULL,
    "sheetTitle" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "status" "GoogleSheetsIntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_sheets_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_sheets_deliveries" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "row" JSONB NOT NULL,
    "status" "GoogleSheetsDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "syncedAt" TIMESTAMP(3),
    "updatedRange" TEXT,
    "lastErrorCode" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_sheets_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_sheets_setup_locks" (
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_sheets_setup_locks_pkey" PRIMARY KEY ("formId")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_sheets_connections_userId_key" ON "google_sheets_connections"("userId");

-- CreateIndex
CREATE INDEX "google_sheets_oauth_attempts_expiresAt_idx" ON "google_sheets_oauth_attempts"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "google_sheets_integrations_formId_key" ON "google_sheets_integrations"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "google_sheets_integrations_connectionId_spreadsheetId_sheetId_key" ON "google_sheets_integrations"("connectionId", "spreadsheetId", "sheetId");

-- CreateIndex
CREATE INDEX "google_sheets_deliveries_status_nextAttemptAt_idx" ON "google_sheets_deliveries"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "google_sheets_deliveries_integrationId_responseId_key" ON "google_sheets_deliveries"("integrationId", "responseId");

-- CreateIndex
CREATE INDEX "google_sheets_setup_locks_createdAt_idx" ON "google_sheets_setup_locks"("createdAt");

-- AddForeignKey
ALTER TABLE "google_sheets_connections" ADD CONSTRAINT "google_sheets_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_oauth_attempts" ADD CONSTRAINT "google_sheets_oauth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_oauth_attempts" ADD CONSTRAINT "google_sheets_oauth_attempts_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_integrations" ADD CONSTRAINT "google_sheets_integrations_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_integrations" ADD CONSTRAINT "google_sheets_integrations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "google_sheets_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_deliveries" ADD CONSTRAINT "google_sheets_deliveries_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "google_sheets_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_deliveries" ADD CONSTRAINT "google_sheets_deliveries_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_setup_locks" ADD CONSTRAINT "google_sheets_setup_locks_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheets_setup_locks" ADD CONSTRAINT "google_sheets_setup_locks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
