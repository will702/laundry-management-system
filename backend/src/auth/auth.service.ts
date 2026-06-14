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
    let employee: any = null;

    if (dto.name && dto.name.trim() !== '') {
      employee = await this.prisma.employee.findFirst({
        where: { name: dto.name, isActive: true },
      });

      if (!employee) {
        // Constant-time dummy compare to prevent timing-based username enumeration
        await bcrypt.compare(dto.pin, '$2b$12$invalidhashpadding000000000000000000000000000000000000000');
        throw new UnauthorizedException('Invalid name or PIN');
      }

      const pinValid = await bcrypt.compare(dto.pin, employee.pin);
      if (!pinValid) {
        throw new UnauthorizedException('Invalid name or PIN');
      }
    } else {
      // PIN-only login
      const employees = await this.prisma.employee.findMany({
        where: { isActive: true },
      });

      for (const emp of employees) {
        const pinValid = await bcrypt.compare(dto.pin, emp.pin);
        if (pinValid) {
          employee = emp;
          break;
        }
      }

      if (!employee) {
        // Run a dummy comparison to match timing
        await bcrypt.compare(dto.pin, '$2b$12$invalidhashpadding000000000000000000000000000000000000000');
        throw new UnauthorizedException('Invalid PIN');
      }
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

    // Enforce unique PIN
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });
    for (const emp of employees) {
      if (await bcrypt.compare(dto.pin, emp.pin)) {
        throw new ConflictException('PIN sudah digunakan');
      }
    }

    const hashedPin = await bcrypt.hash(dto.pin, 12);

    const employee = await this.prisma.employee.create({
      data: {
        name: dto.name,
        pin: hashedPin,
        role: 'admin',
        phone: dto.phone,
      },
      select: { id: true, name: true, role: true, phone: true },
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
