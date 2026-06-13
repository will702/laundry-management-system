import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { ClientsModule } from './clients/clients.module';
import { SettingsModule } from './settings/settings.module';
import { CatalogModule } from './services/catalog.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        ADMIN_REGISTRATION_CODE: Joi.string().min(8).required(),
        ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
        ANTHROPIC_API_KEY: Joi.string().optional().allow(''),
      }),
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    ClientsModule,
    SettingsModule,
    CatalogModule,
    ReceiptsModule,
    ReportsModule,
    AiModule,
  ],
})
export class AppModule {}
