-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "successBlockOrder" JSONB,
ADD COLUMN     "successMessage" TEXT,
ADD COLUMN     "successTitle" TEXT;
