import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      success: true,
      service: 'backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
