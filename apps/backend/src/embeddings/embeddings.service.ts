import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { EmbeddingSourceType, EmbeddingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface UpsertEmbeddingDocumentInput {
  userId: string;
  sourceType: EmbeddingSourceType;
  sourceRefId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface RegisterEmbeddingChunksInput {
  documentId: string;
  chunks: Array<{
    content: string;
    tokenCount?: number;
  }>;
}

interface MarkChunkEmbeddedInput {
  chunkId: string;
  embeddingModel: string;
  embeddingVector: number[];
}

@Injectable()
export class EmbeddingsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertDocument(input: UpsertEmbeddingDocumentInput) {
    const normalizedContent = input.content.trim();
    const contentHash = createHash('sha256').update(normalizedContent).digest('hex');
    const metadata = input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined;

    return this.prisma.embeddingDocument.upsert({
      where: {
        userId_sourceType_sourceRefId: {
          userId: input.userId,
          sourceType: input.sourceType,
          sourceRefId: input.sourceRefId,
        },
      },
      update: {
        contentHash,
        ...(metadata ? { metadata } : {}),
      },
      create: {
        userId: input.userId,
        sourceType: input.sourceType,
        sourceRefId: input.sourceRefId,
        contentHash,
        ...(metadata ? { metadata } : {}),
      },
    });
  }

  async registerChunks(input: RegisterEmbeddingChunksInput) {
    await this.prisma.embeddingChunk.deleteMany({
      where: {
        documentId: input.documentId,
      },
    });

    if (input.chunks.length === 0) {
      return [];
    }

    await this.prisma.embeddingChunk.createMany({
      data: input.chunks.map((chunk, index) => ({
        documentId: input.documentId,
        chunkIndex: index,
        content: chunk.content,
        tokenCount: chunk.tokenCount ?? null,
        embeddingStatus: EmbeddingStatus.PENDING,
      })),
    });

    return this.prisma.embeddingChunk.findMany({
      where: {
        documentId: input.documentId,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
    });
  }

  async markChunkEmbedded(input: MarkChunkEmbeddedInput) {
    return this.prisma.embeddingChunk.update({
      where: {
        id: input.chunkId,
      },
      data: {
        embeddingStatus: EmbeddingStatus.READY,
        embeddingModel: input.embeddingModel,
        embeddingDimensions: input.embeddingVector.length,
        embeddingVector: input.embeddingVector,
        failureReason: null,
      },
    });
  }

  async markChunkFailed(chunkId: string, reason: string) {
    return this.prisma.embeddingChunk.update({
      where: {
        id: chunkId,
      },
      data: {
        embeddingStatus: EmbeddingStatus.FAILED,
        failureReason: reason,
      },
    });
  }
}
