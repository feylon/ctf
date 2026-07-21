// src/challenges/dto/team-action.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'CyberPunks', description: 'Jamoa nomi' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class JoinTeamDto {
  @ApiProperty({ example: 'uuid-team-id', description: 'Jamoa ID raqami' })
  @IsUUID()
  @IsNotEmpty()
  teamId!: string;
}