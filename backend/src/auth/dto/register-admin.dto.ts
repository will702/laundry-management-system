import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class RegisterAdminDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;

  @IsString()
  registrationCode: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  phone?: string;
}
