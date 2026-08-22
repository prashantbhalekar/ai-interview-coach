import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { ResumeStatusResponseDto } from './dto/resume-status-response.dto';
import type { ResumeUploadResponseDto } from './dto/resume-upload-response.dto';
import { ResumeQueueService } from './resume-queue.service';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly resumeQueueService: ResumeQueueService,
  ) {}

  async uploadResume(userId: string, file?: UploadedFile): Promise<ResumeUploadResponseDto> {
    this.validatePdf(file);

    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `resumes/${userId}/${Date.now()}-${safeFileName}`;

    const storedObject = await this.storageService.upload({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const createdResume = await this.prisma.resume.create({
      data: {
        userId,
        status: 'UPLOADED',
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: storedObject.key,
        storageBucket: storedObject.bucket,
        storageUrl: storedObject.url,
      },
    });

    const queueJobId = await this.resumeQueueService.enqueueResumeProcessing(createdResume.id);

    const resume = await this.prisma.resume.update({
      where: {
        id: createdResume.id,
      },
      data: {
        status: 'QUEUED',
      },
    });

    return {
      resumeId: resume.id,
      status: resume.status,
      queueJobId,
      fileName: resume.fileName,
      createdAt: resume.createdAt,
    };
  }

  async getResumeStatus(userId: string, resumeId: string): Promise<ResumeStatusResponseDto> {
    const resume = await this.prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return {
      id: resume.id,
      status: resume.status,
      fileName: resume.fileName,
      mimeType: resume.mimeType,
      sizeBytes: resume.sizeBytes,
      storageKey: resume.storageKey,
      storageBucket: resume.storageBucket,
      storageUrl: resume.storageUrl,
      failureReason: resume.failureReason,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }

  private validatePdf(file?: UploadedFile): asserts file is UploadedFile {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    const lowerFileName = file.originalname.toLowerCase();
    const isPdfMime = file.mimetype === 'application/pdf';
    const hasPdfExtension = lowerFileName.endsWith('.pdf');

    if (!isPdfMime || !hasPdfExtension) {
      throw new BadRequestException('Only PDF files are accepted');
    }
  }
}
