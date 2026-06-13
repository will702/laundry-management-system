import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
