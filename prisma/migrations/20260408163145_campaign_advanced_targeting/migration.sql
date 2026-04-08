-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "bidStrategy" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "placements" TEXT[],
ADD COLUMN     "scheduleEnd" TIMESTAMP(3),
ADD COLUMN     "scheduleStart" TIMESTAMP(3);
