import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsOptional, Length } from 'class-validator';

class InsightsDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}

class FooterNotesDto {
  @IsString()
  @Length(1, 100)
  businessName: string;

  @IsString()
  @IsOptional()
  context?: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('insights')
  getSalesInsights(@Body() dto: InsightsDto) {
    return this.aiService.getSalesInsights(dto.startDate, dto.endDate);
  }

  @Post('footer-notes')
  writeFooterNotes(@Body() dto: FooterNotesDto) {
    return this.aiService.writeFooterNotes(dto.businessName, dto.context);
  }

  @Get('forecast')
  getDemandForecast() {
    return this.aiService.getDemandForecast();
  }
}
