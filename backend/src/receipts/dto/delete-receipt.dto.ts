import { IsString, Length } from 'class-validator';

export class DeleteReceiptDto {
  @IsString()
  @Length(1, 500)
  reason: string;
}
