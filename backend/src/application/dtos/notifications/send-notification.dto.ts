import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NotificationType } from '@/domain/enums/enums'; 

export class SendNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo da notificação' })
  @IsNotEmpty()
  @IsEnum(NotificationType, {
    message: 'O tipo deve ser individual ou collective',
  })
  type!: NotificationType;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsInt()
  associationId!: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Obrigatório se o tipo for individual',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ValidateIf((o) => o.type === NotificationType.INDIVIDUAL)
  userIds?: number[];

  @ApiProperty({ example: 'Aviso Importante' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  subject!: string;

  @ApiProperty({ example: 'Lembre-se de registrar a coleta...' })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  message!: string;

  @ApiProperty({ required: false, example: 'default-template' })
  @IsOptional()
  @IsString()
  template?: string;
}