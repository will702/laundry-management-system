import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePackageDto } from './dto/create-package.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    await this.requireCategory(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.requireCategory(id);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async requireCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat || !cat.isActive) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  // ─── Units ────────────────────────────────────────────────────────────────

  async createUnit(dto: CreateUnitDto) {
    return this.prisma.unit.create({ data: dto });
  }

  async getUnits() {
    return this.prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateUnit(id: string, dto: Partial<CreateUnitDto>) {
    await this.requireUnit(id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async deleteUnit(id: string) {
    await this.requireUnit(id);
    return this.prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async requireUnit(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit || !unit.isActive) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  // ─── Services ─────────────────────────────────────────────────────────────

  async createService(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        basePriceCents: dto.basePriceCents,
        durationDays: dto.durationDays ?? 0,
        durationHours: dto.durationHours ?? 0,
        durationMinutes: dto.durationMinutes ?? 0,
      },
      include: {
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  }

  async getServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  }

  async updateService(id: string, dto: Partial<CreateServiceDto>) {
    await this.requireService(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.unitId !== undefined) data.unitId = dto.unitId;
    if (dto.basePriceCents !== undefined) data.basePriceCents = dto.basePriceCents;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.durationHours !== undefined) data.durationHours = dto.durationHours;
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;

    return this.prisma.service.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
  }

  async deleteService(id: string) {
    await this.requireService(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async requireService(id: string) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc || !svc.isActive) throw new NotFoundException(`Service ${id} not found`);
    return svc;
  }

  // ─── Packages ─────────────────────────────────────────────────────────────

  async createPackage(dto: CreatePackageDto) {
    if (!dto.serviceIds || dto.serviceIds.length === 0) {
      throw new BadRequestException('Package must include at least one service');
    }

    // Fetch all specified services to compute totalPriceCents
    const services = await this.prisma.service.findMany({
      where: { id: { in: dto.serviceIds }, isActive: true },
    });

    if (services.length !== dto.serviceIds.length) {
      const foundIds = services.map((s) => s.id);
      const missing = dto.serviceIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Services not found: ${missing.join(', ')}`);
    }

    const totalPriceCents = services.reduce((sum, s) => sum + s.basePriceCents, 0);

    const pkg = await this.prisma.package.create({
      data: {
        name: dto.name,
        description: dto.description,
        totalPriceCents,
        discountedPriceCents: dto.discountedPriceCents,
        packageServices: {
          create: dto.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: {
        packageServices: {
          include: {
            service: {
              select: { id: true, name: true, basePriceCents: true },
            },
          },
        },
      },
    });

    return pkg;
  }

  async getPackages() {
    return this.prisma.package.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        packageServices: {
          include: {
            service: {
              select: { id: true, name: true, basePriceCents: true },
            },
          },
        },
      },
    });
  }

  async updatePackage(id: string, dto: Partial<CreatePackageDto>) {
    await this.requirePackage(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.discountedPriceCents !== undefined) data.discountedPriceCents = dto.discountedPriceCents;

    if (dto.serviceIds !== undefined) {
      // Re-compute totalPriceCents and replace PackageService rows
      const services = await this.prisma.service.findMany({
        where: { id: { in: dto.serviceIds }, isActive: true },
      });
      if (services.length !== dto.serviceIds.length) {
        const foundIds = services.map((s) => s.id);
        const missing = dto.serviceIds.filter((sid) => !foundIds.includes(sid));
        throw new NotFoundException(`Services not found: ${missing.join(', ')}`);
      }
      data.totalPriceCents = services.reduce((sum, s) => sum + s.basePriceCents, 0);
      data.packageServices = {
        deleteMany: {},
        create: dto.serviceIds.map((serviceId) => ({ serviceId })),
      };
    }

    return this.prisma.package.update({
      where: { id },
      data,
      include: {
        packageServices: {
          include: {
            service: {
              select: { id: true, name: true, basePriceCents: true },
            },
          },
        },
      },
    });
  }

  async deletePackage(id: string) {
    await this.requirePackage(id);
    return this.prisma.package.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async requirePackage(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg || !pkg.isActive) throw new NotFoundException(`Package ${id} not found`);
    return pkg;
  }
}
