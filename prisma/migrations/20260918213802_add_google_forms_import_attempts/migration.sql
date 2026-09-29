-- CreateTable
CREATE TABLE "google_forms_import_attempts" (
    "state" TEXT NOT NULL,
    "encryptedCodeVerifier" TEXT,
    "encryptedAccessToken" TEXT,
    "userId" TEXT NOT NULL,
    "returnTo" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_forms_import_attempts_pkey" PRIMARY KEY ("state")
);

-- CreateIndex
CREATE INDEX "google_forms_import_attempts_expiresAt_idx" ON "google_forms_import_attempts"("expiresAt");

-- AddForeignKey
ALTER TABLE "google_forms_import_attempts" ADD CONSTRAINT "google_forms_import_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
