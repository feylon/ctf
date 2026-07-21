import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProblemDto {
  @ApiProperty({ example: 'A0001' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'A+B' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Ikkita butun sonning yig\'indisini toping...' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '42' })
  @IsString()
  @IsNotEmpty()
  flag!: string; // Admin ochiq holda kiritadi, bazaga hashlanib tushadi

  @ApiProperty({ example: 35 })
  @IsNumber()
  @Min(0)
  difficulty!: number;

  @ApiProperty({ example: 'Uzun sonlar arifmetikasi' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  points!: number;
}