/*
  Warnings:

  - A unique constraint covering the columns `[position]` on the table `slots` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AdminPermission'
          AND n.nspname = 'public'
          AND e.enumlabel = 'ADS_MANAGE'
    ) THEN
        ALTER TYPE "AdminPermission" ADD VALUE 'ADS_MANAGE';
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "slots" ADD COLUMN     "position" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "slots_position_key" ON "slots"("position");
