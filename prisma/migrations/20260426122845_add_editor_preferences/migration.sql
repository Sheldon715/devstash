-- AlterTable
ALTER TABLE "User" ADD COLUMN     "editorPreferences" JSONB NOT NULL DEFAULT '{}';
