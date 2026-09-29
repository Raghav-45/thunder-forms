-- CreateEnum
CREATE TYPE "FileUploadConnectionStatus" AS ENUM ('ACTIVE', 'REAUTH_REQUIRED');

-- CreateEnum
CREATE TYPE "FileUploadStatus" AS ENUM ('PENDING', 'ATTACHED');

-- CreateTable
CREATE TABLE "file_upload_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "grantedScopes" TEXT NOT NULL,
    "status" "FileUploadConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_upload_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload_oauth_attempts" (
    "state" TEXT NOT NULL,
    "encryptedCodeVerifier" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_oauth_attempts_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "file_upload_destinations" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "folderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_upload_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "sessionId" TEXT,
    "destinationId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "FileUploadStatus" NOT NULL DEFAULT 'PENDING',
    "responseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload_sessions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_connections_userId_key" ON "file_upload_connections"("userId");

-- CreateIndex
CREATE INDEX "file_upload_oauth_attempts_expiresAt_idx" ON "file_upload_oauth_attempts"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "file_upload_destinations_formId_key" ON "file_upload_destinations"("formId");

-- CreateIndex
CREATE INDEX "file_uploads_formId_fieldId_status_idx" ON "file_uploads"("formId", "fieldId", "status");

-- CreateIndex
CREATE INDEX "file_uploads_status_createdAt_idx" ON "file_uploads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "file_upload_sessions_formId_expiresAt_idx" ON "file_upload_sessions"("formId", "expiresAt");

-- AddForeignKey
ALTER TABLE "file_upload_connections" ADD CONSTRAINT "file_upload_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_oauth_attempts" ADD CONSTRAINT "file_upload_oauth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_oauth_attempts" ADD CONSTRAINT "file_upload_oauth_attempts_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_destinations" ADD CONSTRAINT "file_upload_destinations_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_destinations" ADD CONSTRAINT "file_upload_destinations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "file_upload_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "file_upload_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_upload_sessions" ADD CONSTRAINT "file_upload_sessions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "file_upload_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
