-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "returnToHomepageText" TEXT,
ADD COLUMN     "showReturnToHomepage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showSubmitAnotherResponse" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "submitAnotherResponseText" TEXT,
ADD COLUMN     "successExtraButtons" JSONB;

-- RenameIndex
ALTER INDEX "google_sheets_integrations_connectionId_spreadsheetId_sheetId_k" RENAME TO "google_sheets_integrations_connectionId_spreadsheetId_sheet_key";
