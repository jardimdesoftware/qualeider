import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AssociationLoginDto {
  @ApiProperty({
    description: 'Email da associação',
    example: 'associacao@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha da associação',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
