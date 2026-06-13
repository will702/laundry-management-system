import { IsString, IsOptional, IsInt, Min, Max, IsArray, ValidateNested, Length, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceiptItemDto {
  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @Length(1, 200)
  serviceName: string;

  @IsString()
  @IsOptional()
  itemType?: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReceiptDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @Length(1, 100)
  clientName: string;

  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateReceiptItemDto)
  items: CreateReceiptItemDto[];
}
