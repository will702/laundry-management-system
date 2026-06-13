import { IsString, Length, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];

  // IDR integer stored directly — see create-service.dto.ts note
  @IsInt()
  @Min(0)
  discountedPriceCents: number;
}
