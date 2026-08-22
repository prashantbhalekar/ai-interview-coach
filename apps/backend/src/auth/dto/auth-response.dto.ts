import type { UserResponseDto } from '../../users/dto/user-response.dto';

export interface AuthResponseDto {
  accessToken: string;
  user: UserResponseDto;
}
