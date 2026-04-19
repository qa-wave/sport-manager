import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async listForClub(clubId: string) {
    return this.prisma.withClub(clubId, async (tx) => {
      const members = await tx.member.findMany({
        orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              dateOfBirth: true,
              avatarUrl: true,
            },
          },
          teamMemberships: {
            where: { leftAt: null },
            select: {
              role: true,
              team: { select: { id: true, name: true, ageGroup: true } },
            },
          },
          clubRoles: { select: { role: true } },
          guardianLinks: {
            select: {
              child: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          childLinks: {
            select: {
              guardian: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
              canViewPayments: true,
              canViewMedical: true,
              canSignWaivers: true,
            },
          },
        },
      });

      return members.map((m) => ({
        id: m.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        dateOfBirth: m.user.dateOfBirth,
        isMinor: m.isMinor,
        status: m.status,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        joinedAt: m.joinedAt,
        teamRoles: m.teamMemberships.map((tm) => ({
          teamId: tm.team.id,
          teamName: tm.team.name,
          ageGroup: tm.team.ageGroup,
          role: tm.role,
        })),
        clubRoles: m.clubRoles.map((cr) => cr.role),
        guardianOf: m.guardianLinks.map((gl) => ({
          memberId: gl.child.id,
          name: `${gl.child.user.firstName} ${gl.child.user.lastName}`,
        })),
        guardians: m.childLinks.map((cl) => ({
          memberId: cl.guardian.id,
          name: `${cl.guardian.user.firstName} ${cl.guardian.user.lastName}`,
          canViewPayments: cl.canViewPayments,
          canViewMedical: cl.canViewMedical,
          canSignWaivers: cl.canSignWaivers,
        })),
      }));
    });
  }

  async getById(clubId: string, memberId: string) {
    return this.prisma.withClub(clubId, async (tx) => {
      const m = await tx.member.findUnique({
        where: { id: memberId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              avatarUrl: true,
              locale: true,
            },
          },
          teamMemberships: {
            where: { leftAt: null },
            include: {
              team: { select: { id: true, name: true, ageGroup: true, sport: true, season: true } },
            },
          },
          clubRoles: { select: { role: true } },
          guardianLinks: {
            include: {
              child: {
                select: {
                  id: true,
                  jerseyNumber: true,
                  user: { select: { firstName: true, lastName: true } },
                  teamMemberships: {
                    where: { leftAt: null },
                    select: { team: { select: { name: true } }, role: true },
                  },
                },
              },
            },
          },
          childLinks: {
            include: {
              guardian: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                },
              },
            },
          },
          attendances: {
            take: 10,
            orderBy: { event: { startsAt: 'desc' } },
            include: {
              event: { select: { title: true, type: true, startsAt: true } },
            },
          },
          paymentsAsPayer: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { fee: { select: { name: true } } },
          },
          paymentsOnBehalfOf: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              fee: { select: { name: true } },
              payer: { select: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
          waiverSignaturesFor: {
            include: {
              waiver: { select: { title: true, type: true } },
              signedBy: { select: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      });

      if (!m) throw new NotFoundException('Member not found');

      return {
        id: m.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        phone: m.user.phone,
        avatarUrl: m.user.avatarUrl,
        dateOfBirth: m.user.dateOfBirth,
        locale: m.user.locale,
        isMinor: m.isMinor,
        status: m.status,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
        medicalNotes: m.medicalNotes,
        joinedAt: m.joinedAt,
        teamRoles: m.teamMemberships.map((tm) => ({
          teamId: tm.team.id,
          teamName: tm.team.name,
          ageGroup: tm.team.ageGroup,
          sport: tm.team.sport,
          season: tm.team.season,
          role: tm.role,
          joinedAt: tm.joinedAt,
        })),
        clubRoles: m.clubRoles.map((cr) => cr.role),
        guardianOf: m.guardianLinks.map((gl) => ({
          memberId: gl.child.id,
          name: `${gl.child.user.firstName} ${gl.child.user.lastName}`,
          jerseyNumber: gl.child.jerseyNumber,
          teams: gl.child.teamMemberships.map((t) => `${t.team.name} (${t.role})`),
          canViewPayments: gl.canViewPayments,
          canViewMedical: gl.canViewMedical,
          canSignWaivers: gl.canSignWaivers,
        })),
        guardians: m.childLinks.map((cl) => ({
          memberId: cl.guardian.id,
          name: `${cl.guardian.user.firstName} ${cl.guardian.user.lastName}`,
          email: cl.guardian.user.email,
          phone: cl.guardian.user.phone,
          relationship: cl.relationship,
          isPrimary: cl.isPrimary,
          canViewPayments: cl.canViewPayments,
          canMakePayments: cl.canMakePayments,
          canViewMedical: cl.canViewMedical,
          canSignWaivers: cl.canSignWaivers,
        })),
        recentAttendance: m.attendances.map((a) => ({
          eventTitle: a.event.title,
          eventType: a.event.type,
          eventDate: a.event.startsAt,
          status: a.status,
          attended: a.attended,
        })),
        paymentsMade: m.paymentsAsPayer.map((p) => ({
          feeName: p.fee.name,
          amountCents: p.amountCents,
          currency: p.currency,
          status: p.status,
          paidAt: p.paidAt,
        })),
        paymentsFor: m.paymentsOnBehalfOf.map((p) => ({
          feeName: p.fee.name,
          amountCents: p.amountCents,
          currency: p.currency,
          status: p.status,
          paidAt: p.paidAt,
          paidBy: `${p.payer.user.firstName} ${p.payer.user.lastName}`,
        })),
        waivers: m.waiverSignaturesFor.map((w) => ({
          title: w.waiver.title,
          type: w.waiver.type,
          signedAt: w.signedAt,
          signedBy: `${w.signedBy.user.firstName} ${w.signedBy.user.lastName}`,
        })),
      };
    });
  }
}
