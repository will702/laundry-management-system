import { IsString, Length, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
