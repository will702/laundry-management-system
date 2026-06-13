import { IsString, Length, IsOptional, IsInt, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  // IDR integer stored directly in basePriceCents field.
  // NOTE: Despite the field name "basePriceCents", this app stores IDR integers
  // directly (no fractional currency). IDR 5000 is stored as 5000.
  @IsInt()
  @Min(0)
  basePriceCents: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationHours?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationMinutes?: number;
}
