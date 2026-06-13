import { IsString, Length, IsOptional } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
