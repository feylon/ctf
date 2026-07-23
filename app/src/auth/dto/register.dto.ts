import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { Transform } from 'class-transformer';

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: faker.internet.username(),
    description: 'Foydalanuvchining usernamei (3-32 belgi: harf, raqam, _ . -)',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: "Username faqat harf, raqam va _ . - belgilaridan iborat bo'lishi kerak" })
  username!: string;

  @ApiProperty({
    example: faker.person.fullName(),
    description: "Foydalanuvchining to'liq ismi",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    example: faker.internet.email(),
    description: 'Foydalanuvchining email manzili',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: faker.internet.password({ length: 10 }),
    description: "Kamida 6 ta belgidan iborat parol",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    example: faker.string.numeric(6),
    description: 'Emailga yuborilgan OTP kodi',
  })
  @IsString()
  @Length(6, 6)
  otp!: string;
}
