import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { name: dto.name, isActive: true },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid name or PIN');
    }

    const pinValid = await bcrypt.compare(dto.pin, employee.pin);
    if (!pinValid) {
      throw new UnauthorizedException('Invalid name or PIN');
    }

    const payload: JwtPayload = {
      sub: employee.id,
      name: employee.name,
      role: employee.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
      },
    };
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const expectedCode = this.config.get<string>('ADMIN_REGISTRATION_CODE');
    if (!expectedCode || dto.registrationCode !== expectedCode) {
      throw new ForbiddenException('Invalid registration code');
    }

    const existing = await this.prisma.employee.findFirst({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('An employee with this name already exists');
    }

    const hashedPin = await bcrypt.hash(dto.pin, 12);

    const employee = await this.prisma.employee.create({
      data: {
        name: dto.name,
        pin: hashedPin,
        role: 'admin',
        phone: dto.phone,
      },
      select: { id: true, name: true, role: true },
    });

    const payload: JwtPayload = {
      sub: employee.id,
      name: employee.name,
      role: employee.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      employee,
    };
  }
}
