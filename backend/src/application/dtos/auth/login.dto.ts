import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
