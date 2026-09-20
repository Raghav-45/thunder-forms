-- File limits are scoped to an anonymous respondent upload session, not all
-- pending uploads for the form. Match the lookup used by the upload route.
DROP INDEX "file_uploads_formId_fieldId_status_idx";

CREATE INDEX "file_uploads_formId_fieldId_sessionId_status_idx"
ON "file_uploads"("formId", "fieldId", "sessionId", "status");
