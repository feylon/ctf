import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR...', description: 'Sizning refresh tokeningiz' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}