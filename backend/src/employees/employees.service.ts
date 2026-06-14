import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const BCRYPT_SALT_ROUNDS = 12;

// Fields to select when returning employee data (never expose pin hash)
const EMPLOYEE_SELECT = {
  id: true,
  name: true,
  role: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const existingName = await this.prisma.employee.findFirst({
      where: { name: dto.name, isActive: true },
    });
    if (existingName) {
      throw new ConflictException('Nama karyawan sudah digunakan');
    }

    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });
    for (const emp of employees) {
      if (await bcrypt.compare(dto.pin, emp.pin)) {
        throw new ConflictException('PIN sudah digunakan');
      }
    }

    const pinHash = await bcrypt.hash(dto.pin, BCRYPT_SALT_ROUNDS);

    const employee = await this.prisma.employee.create({
      data: {
        name: dto.name,
        pin: pinHash,
        phone: dto.phone,
        address: dto.address,
      },
      select: EMPLOYEE_SELECT,
    });

    return employee;
  }

  async findAll() {
    return this.prisma.employee.findMany({
      where: { isActive: true },
      select: EMPLOYEE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.pin !== undefined) {
      data.pin = await bcrypt.hash(dto.pin, BCRYPT_SALT_ROUNDS);
    }

    return this.prisma.employee.update({
      where: { id },
      data,
      select: EMPLOYEE_SELECT,
    });
  }

  async deactivate(id: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false },
      select: EMPLOYEE_SELECT,
    });
  }
}
