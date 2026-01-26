import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminApiKeyGuard } from '../../guards/admin-api-key.guard';
import { UpdateUserPlanDto } from './dto/update-user-plan.dto';

@UseGuards(AdminApiKeyGuard)
@Controller('admin/users')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private isLikelyId(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{24,}$/i;
    return uuidRegex.test(value) || cuidRegex.test(value);
  }

  @Get()
  async listUsers(@Query('search') search?: string) {
    const trimmedSearch = search?.trim();
    const where = trimmedSearch
      ? {
          OR: [
           { email: { contains: trimmedSearch, mode: Prisma.QueryMode.insensitive } },
           ...(this.isLikelyId(trimmedSearch) ? [{ id: trimmedSearch }] : []),
          ],
        }
      : undefined;

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          plan: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, users };
  }

  @Patch(':id/plan')
  async updateUserPlan(@Param('id') id: string, @Body() body: UpdateUserPlanDto) {
    return this.prisma.user.update({
      where: { id },
      data: { plan: body.plan },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });
  }
}
