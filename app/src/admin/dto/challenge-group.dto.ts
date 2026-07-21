import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChallengeGroupDto {
  @ApiProperty({ example: 'Web Security 2026', description: 'Challenge guruhi nomi' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateChallengeGroupDto {
  @ApiProperty({ example: 'Advanced Web Security', description: 'Challenge guruhi nomi' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}