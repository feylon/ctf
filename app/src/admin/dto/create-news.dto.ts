import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: 'Musobaqa boshlanish vaqti o\'zgardi!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'Hurmatli qatnashchilar, texnik sabablarga ko\'ra musobaqa 1 soat kechroq boshlanadi.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}