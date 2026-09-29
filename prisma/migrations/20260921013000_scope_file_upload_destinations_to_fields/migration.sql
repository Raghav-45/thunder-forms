-- Each file-upload field owns its own storage destination. Existing form-wide
-- rows receive an empty field ID, so already-attached files retain their
-- destination while administrators explicitly configure active fields.
ALTER TABLE "file_upload_oauth_attempts" ADD COLUMN "fieldId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "file_upload_oauth_attempts" ALTER COLUMN "fieldId" DROP DEFAULT;

ALTER TABLE "file_upload_destinations" ADD COLUMN "fieldId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "file_upload_destinations" ALTER COLUMN "fieldId" DROP DEFAULT;

DROP INDEX "file_upload_destinations_formId_key";

CREATE UNIQUE INDEX "file_upload_destinations_formId_fieldId_key"
  ON "file_upload_destinations"("formId", "fieldId");

CREATE INDEX "file_upload_destinations_formId_idx"
  ON "file_upload_destinations"("formId");
