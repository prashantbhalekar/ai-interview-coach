import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkLiveness() {
    return this.healthService.getLivenessPayload();
  }

  @Get('readiness')
  async checkReadiness() {
    const readiness = await this.healthService.getReadinessPayload();
    if (!readiness.success) {
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }
}
