import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
    IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ enum: ['individual', 'collective'] })
  @IsEnum(['individual', 'collective'])
  type: 'individual' | 'collective';

  @ApiProperty()
  @IsNumber()
  associationId: number;

  @ApiProperty({ required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @ValidateIf((o) => o.type === 'individual')
  userIds?: number[];

  @ApiProperty()
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  message: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  template?: string;
}