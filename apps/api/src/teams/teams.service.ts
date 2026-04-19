import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all teams visible to the given club. Runs inside `withClub` so
   * Postgres RLS policies filter the query at the DB layer — even if a
   * future bug removed the `where: { clubId }` clause, cross-tenant rows
   * would still be inaccessible.
   */
  async listForClub(clubId: string) {
    return this.prisma.withClub(clubId, async (tx) => {
      const teams = await tx.team.findMany({
        orderBy: [{ ageGroup: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { memberships: true } },
          memberships: {
            where: {
              role: { in: ['HEAD_COACH', 'ASSISTANT_COACH'] },
              leftAt: null,
            },
            select: {
              role: true,
              member: {
                select: {
                  id: true,
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });

      return teams.map((t) => ({
        id: t.id,
        name: t.name,
        sport: t.sport,
        ageGroup: t.ageGroup,
        season: t.season,
        memberCount: t._count.memberships,
        coaches: t.memberships.map((m) => ({
          memberId: m.member.id,
          role: m.role,
          name: `${m.member.user.firstName} ${m.member.user.lastName}`,
        })),
      }));
    });
  }
}
