import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CheckUsernameDto {
  @ApiProperty({ example: 'admin01', description: 'Tekshirilishi kerak bo\'lgan username' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;
}