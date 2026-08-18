import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AssociationLoginDto {
  @ApiProperty({
    description: 'Email da associação',
    example: 'associacao@example.com',
  })
  @IsEmail()
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  email!: string;

  @ApiProperty({
    description: 'Senha da associação',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  password!: string;
}
