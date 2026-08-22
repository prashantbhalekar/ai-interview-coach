-- CreateEnum
CREATE TYPE "ResumeProcessingStatus" AS ENUM ('UPLOADED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Resume" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "ResumeProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "storageBucket" TEXT NOT NULL,
  "storageUrl" TEXT NOT NULL,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex
CREATE INDEX "Resume_status_idx" ON "Resume"("status");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
