import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(4, 10)
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  pin: string;
}
