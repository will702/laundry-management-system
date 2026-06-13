import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePackageDto } from './dto/create-package.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Categories ──────────────────────────────────────────────────────
  @Post('categories')
  @UseGuards(RolesGuard) @Roles('admin')
  createCategory(@Body() dto: CreateCategoryDto) { return this.catalogService.createCategory(dto); }

  @Get('categories')
  getCategories() { return this.catalogService.getCategories(); }

  @Put('categories/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  updateCategory(@Param('id') id: string, @Body() dto: CreateCategoryDto) { return this.catalogService.updateCategory(id, dto); }

  @Delete('categories/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  deleteCategory(@Param('id') id: string) { return this.catalogService.deleteCategory(id); }

  // ── Units ────────────────────────────────────────────────────────────
  @Post('units')
  @UseGuards(RolesGuard) @Roles('admin')
  createUnit(@Body() dto: CreateUnitDto) { return this.catalogService.createUnit(dto); }

  @Get('units')
  getUnits() { return this.catalogService.getUnits(); }

  @Put('units/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  updateUnit(@Param('id') id: string, @Body() dto: CreateUnitDto) { return this.catalogService.updateUnit(id, dto); }

  @Delete('units/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  deleteUnit(@Param('id') id: string) { return this.catalogService.deleteUnit(id); }

  // ── Services ─────────────────────────────────────────────────────────
  @Post('services')
  @UseGuards(RolesGuard) @Roles('admin')
  createService(@Body() dto: CreateServiceDto) { return this.catalogService.createService(dto); }

  @Get('services')
  getServices() { return this.catalogService.getServices(); }

  @Put('services/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  updateService(@Param('id') id: string, @Body() dto: CreateServiceDto) { return this.catalogService.updateService(id, dto); }

  @Delete('services/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  deleteService(@Param('id') id: string) { return this.catalogService.deleteService(id); }

  // ── Packages ──────────────────────────────────────────────────────────
  @Post('packages')
  @UseGuards(RolesGuard) @Roles('admin')
  createPackage(@Body() dto: CreatePackageDto) { return this.catalogService.createPackage(dto); }

  @Get('packages')
  getPackages() { return this.catalogService.getPackages(); }

  @Put('packages/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  updatePackage(@Param('id') id: string, @Body() dto: CreatePackageDto) { return this.catalogService.updatePackage(id, dto); }

  @Delete('packages/:id')
  @UseGuards(RolesGuard) @Roles('admin')
  deletePackage(@Param('id') id: string) { return this.catalogService.deletePackage(id); }
}
