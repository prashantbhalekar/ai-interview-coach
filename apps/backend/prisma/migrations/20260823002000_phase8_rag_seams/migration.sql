-- CreateEnum
CREATE TYPE "EmbeddingSourceType" AS ENUM ('RESUME', 'JOB_DESCRIPTION', 'INTERVIEW_ANSWER');

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "EmbeddingDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" "EmbeddingSourceType" NOT NULL,
  "sourceRefId" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmbeddingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingChunk" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "tokenCount" INTEGER,
  "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
  "embeddingModel" TEXT,
  "embeddingDimensions" INTEGER,
  "embeddingVector" DOUBLE PRECISION[] NOT NULL DEFAULT '{}',
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmbeddingChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingDocument_userId_sourceType_sourceRefId_key" ON "EmbeddingDocument"("userId", "sourceType", "sourceRefId");

-- CreateIndex
CREATE INDEX "EmbeddingDocument_userId_sourceType_idx" ON "EmbeddingDocument"("userId", "sourceType");

-- CreateIndex
CREATE INDEX "EmbeddingDocument_updatedAt_idx" ON "EmbeddingDocument"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingChunk_documentId_chunkIndex_key" ON "EmbeddingChunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "EmbeddingChunk_embeddingStatus_idx" ON "EmbeddingChunk"("embeddingStatus");

-- CreateIndex
CREATE INDEX "EmbeddingChunk_updatedAt_idx" ON "EmbeddingChunk"("updatedAt");

-- AddForeignKey
ALTER TABLE "EmbeddingDocument"
ADD CONSTRAINT "EmbeddingDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbeddingChunk"
ADD CONSTRAINT "EmbeddingChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "EmbeddingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
