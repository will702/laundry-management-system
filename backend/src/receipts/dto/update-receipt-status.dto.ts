import { IsString, IsIn } from 'class-validator';

export class UpdateReceiptStatusDto {
  @IsString()
  @IsIn(['pending', 'ready', 'completed'])
  status: string;
}
