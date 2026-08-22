import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { ResumeStatusResponseDto } from './dto/resume-status-response.dto';
import type { ResumeUploadResponseDto } from './dto/resume-upload-response.dto';
import { ResumesService } from './resumes.service';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

interface UploadedResumeFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadResume(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: UploadedResumeFile,
  ): Promise<ResumeUploadResponseDto> {
    return this.resumesService.uploadResume(request.user.sub, file);
  }

  @Get(':id/status')
  getResumeStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ResumeStatusResponseDto> {
    return this.resumesService.getResumeStatus(request.user.sub, id);
  }
}
