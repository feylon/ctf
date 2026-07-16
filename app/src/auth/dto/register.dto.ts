import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: faker.internet.username(),
    description: 'Foydalanuvchining usernamei',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: faker.person.fullName(),
    description: "Foydalanuvchining to'liq ismi",
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: faker.internet.email(),
    description: 'Foydalanuvchining email manzili',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: faker.internet.password({ length: 10 }),
    description: "Kamida 6 ta belgidan iborat parol",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: faker.string.numeric(6),
    description: 'Emailga yuborilgan OTP kodi',
  })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}