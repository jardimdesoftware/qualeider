import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyCollectionDto } from './create-daily-collection.dto';

export class UpdateDailyCollectionDto extends PartialType(
  CreateDailyCollectionDto,
) {}
