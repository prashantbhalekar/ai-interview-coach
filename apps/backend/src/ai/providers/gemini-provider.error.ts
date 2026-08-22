import {
  GatewayTimeoutException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface GeminiProviderErrorDetails {
  httpStatus: number;
  providerCode: string;
  providerStatus: string;
  safeMessage: string;
  retriable: boolean;
}

export class GeminiProviderException extends HttpException {
  constructor(public readonly details: GeminiProviderErrorDetails) {
    super(details.safeMessage, mapToHttpStatus(details));
  }
}

function mapToHttpStatus(details: GeminiProviderErrorDetails): number {
  if (details.providerCode === 'timeout' || details.providerStatus === 'TIMEOUT') {
    return new GatewayTimeoutException().getStatus();
  }

  if (details.providerCode === 'rate_limit_exceeded' || details.providerCode === 'quota_exceeded') {
    return 429;
  }

  if (details.providerCode === 'authentication' || details.providerCode === 'permission_denied') {
    return new ServiceUnavailableException().getStatus();
  }

  if (details.httpStatus >= 500) {
    return new ServiceUnavailableException().getStatus();
  }

  return 502;
}
