import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR...', description: 'Sizning refresh tokeningiz' })
  @IsJWT()
  @IsNotEmpty()
  refresh_token!: string;
}
