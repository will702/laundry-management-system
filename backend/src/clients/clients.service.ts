import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        name: dto.name,
        phone: dto.phone,
      },
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async search(q: string) {
    if (!q.trim()) return this.findAll();
    return this.prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async delete(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    // Block delete if client has active receipts (not soft-deleted)
    const activeReceiptCount = await this.prisma.receipt.count({
      where: {
        clientId: id,
        status: { not: 'deleted' },
        isDeleted: false,
      },
    });

    if (activeReceiptCount > 0) {
      throw new ConflictException(
        `Cannot delete client: ${activeReceiptCount} active receipt(s) exist`,
      );
    }

    await this.prisma.client.delete({ where: { id } });
    return { id, deleted: true };
  }
}
