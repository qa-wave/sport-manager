/**
 * AI assistant tools — every tool is scoped to a single club + the calling
 * member's role. The `clubId` comes from the verified JWT/club context (closure,
 * NOT from model input), and `prisma.withClub()` enforces Postgres RLS on top.
 *
 * Which tools a member sees is data-driven: the club admin configures per-tool
 * role buckets (see ClubAiSettings.toolRoles). A tool the member's buckets don't
 * cover is omitted entirely — the model can't call what it can't see.
 *
 * Read tools execute server-side. Write actions (createEvent, sendEventReminder,
 * markAttendance) are defined WITHOUT an `execute` so the AI SDK surfaces them to
 * the client for human confirmation; the client then performs the action through
 * the existing, audited REST endpoints.
 */
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import {
  type ClubAiSettings,
  type AiRoleBucket,
  aiToolAllowedBuckets,
} from '@sport-manager/contracts';
import { prisma } from '../prisma';
import type { MemberContext } from '../../types/hono';

const COACH_TEAM_ROLES = ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'];

/** Which coarse role buckets does this member belong to? Additive. */
function memberBuckets(m: MemberContext): AiRoleBucket[] {
  const b = new Set<AiRoleBucket>(['member']);
  if (m.clubRoles.some((r) => r === 'OWNER' || r === 'ADMIN')) b.add('admin');
  if (m.clubRoles.some((r) => r === 'FINANCE')) b.add('finance');
  if (m.teamRoles.some((t) => COACH_TEAM_ROLES.includes(t.role))) b.add('coach');
  return [...b];
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
const fullName = (u: { firstName: string; lastName: string }) =>
  `${u.firstName} ${u.lastName}`;

/** Define every tool, then return only the ones this member+club config allows. */
export function buildClubTools(
  clubId: string,
  member: MemberContext,
  settings: ClubAiSettings,
): ToolSet {
  const all: ToolSet = {
    getUpcomingEvents: tool({
      description:
        'Vrátí nadcházející události klubu (tréninky, zápasy, schůzky) v daném počtu dní dopředu, včetně počtu potvrzených účastníků.',
      inputSchema: z.object({ daysAhead: z.number().int().min(1).max(90).default(14) }),
      execute: async ({ daysAhead }) => {
        const now = new Date();
        const to = new Date(now.getTime() + daysAhead * 86_400_000);
        const events = await prisma.withClub(clubId, (tx) =>
          tx.event.findMany({
            where: { clubId, startsAt: { gte: now, lte: to } },
            select: {
              id: true,
              title: true,
              type: true,
              startsAt: true,
              location: true,
              _count: { select: { attendances: { where: { status: 'YES' } } } },
            },
            orderBy: { startsAt: 'asc' },
            take: 25,
          }),
        );
        return events.map((e) => ({
          id: e.id,
          nazev: e.title,
          typ: e.type,
          datum: fmtDate(e.startsAt),
          cas: fmtTime(e.startsAt),
          misto: e.location ?? 'Neurčeno',
          potvrzeno: e._count.attendances,
        }));
      },
    }),

    getEventRsvpStats: tool({
      description:
        'Pro konkrétní událost (podle eventId z getUpcomingEvents) vrátí, kdo potvrdil účast (YES), kdo odmítl (NO), kdo váhá (MAYBE) a kolik lidí neodpovědělo.',
      inputSchema: z.object({ eventId: z.string() }),
      execute: async ({ eventId }) => {
        const event = await prisma.withClub(clubId, (tx) =>
          tx.event.findFirst({
            where: { id: eventId, clubId },
            select: {
              title: true,
              attendances: {
                select: {
                  status: true,
                  member: { select: { user: { select: { firstName: true, lastName: true } } } },
                },
              },
            },
          }),
        );
        if (!event) return { chyba: 'Událost nenalezena nebo k ní nemáte přístup.' };
        const by = (s: string) =>
          event.attendances.filter((a) => a.status === s).map((a) => fullName(a.member.user));
        return {
          udalost: event.title,
          prijde: by('YES'),
          neprijde: by('NO'),
          vaha: by('MAYBE'),
          bez_odpovedi: event.attendances.filter((a) => a.status === 'PENDING').length,
        };
      },
    }),

    searchDrills: tool({
      description:
        'Vyhledá cvičení a drilly v tréninkové knihovně podle klíčových slov (název, popis, tagy). Vrací i obecná cvičení i vlastní cvičení klubu.',
      inputSchema: z.object({
        query: z.string().describe('Klíčové slovo, např. "přihrávka", "rychlost", "koleno"'),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      execute: async ({ query, limit }) => {
        const exercises = await prisma.withClub(clubId, (tx) =>
          tx.exercise.findMany({
            where: {
              AND: [
                { OR: [{ clubId }, { clubId: null }] },
                {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { has: query } },
                  ],
                },
              ],
            },
            select: {
              name: true,
              description: true,
              difficulty: true,
              durationMinutes: true,
              category: { select: { name: true } },
            },
            take: limit,
          }),
        );
        return exercises.map((e) => ({
          nazev: e.name,
          kategorie: e.category?.name ?? 'Obecné',
          popis: e.description?.slice(0, 140) ?? '',
          obtiznost: e.difficulty ?? 'neuvedeno',
          trvani_min: e.durationMinutes ?? null,
        }));
      },
    }),

    getMemberStats: tool({
      description:
        'Vrátí přehled členské základny klubu — celkový počet členů, rozpad podle stavu a počty členů v týmech.',
      inputSchema: z.object({}),
      execute: async () => {
        const [total, byStatus, teams] = await prisma.withClub(clubId, (tx) =>
          Promise.all([
            tx.member.count({ where: { clubId } }),
            tx.member.groupBy({ by: ['status'], where: { clubId }, _count: true }),
            tx.team.findMany({
              where: { clubId },
              select: {
                name: true,
                _count: { select: { memberships: { where: { leftAt: null } } } },
              },
            }),
          ]),
        );
        return {
          celkem_clenu: total,
          podle_stavu: byStatus.map((s) => ({ stav: s.status, pocet: s._count })),
          tymy: teams.map((t) => ({ tym: t.name, clenu: t._count.memberships })),
        };
      },
    }),

    getUnpaidPayments: tool({
      description:
        'Vrátí seznam nezaplacených (čekajících) plateb — kdo, kolik, za co a do kdy.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(15) }),
      execute: async ({ limit }) => {
        const payments = await prisma.withClub(clubId, (tx) =>
          tx.payment.findMany({
            where: { clubId, status: 'PENDING' },
            select: {
              amountCents: true,
              currency: true,
              payer: { select: { user: { select: { firstName: true, lastName: true, email: true } } } },
              fee: { select: { name: true, dueDate: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
          }),
        );
        return payments.map((p) => ({
          clen: fullName(p.payer.user),
          email: p.payer.user.email,
          castka: `${(p.amountCents / 100).toFixed(0)} ${p.currency.toUpperCase()}`,
          za: p.fee.name,
          splatnost: p.fee.dueDate ? fmtDate(p.fee.dueDate) : 'neuvedeno',
        }));
      },
    }),

    // ---- Write actions (HITL: no execute → client confirms → audited REST) ----
    createEvent: tool({
      description:
        'Navrhne vytvoření nové události (trénink/zápas/schůzka). Vyžaduje potvrzení uživatele v aplikaci. Časy uváděj v ISO 8601 (např. 2026-06-05T17:30:00). Datum odvozuj z aktuálního data v systémové zprávě.',
      inputSchema: z.object({
        type: z.enum(['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL']),
        title: z.string().min(1).max(200),
        startsAt: z.string().describe('ISO 8601 začátek'),
        endsAt: z.string().describe('ISO 8601 konec'),
        location: z.string().max(300).optional(),
      }),
    }),

    sendEventReminder: tool({
      description:
        'Navrhne odeslání RSVP připomínky e-mailem členům, kteří dosud neodpověděli na konkrétní událost (podle eventId z getUpcomingEvents). Vyžaduje potvrzení uživatele.',
      inputSchema: z.object({ eventId: z.string().describe('ID události z getUpcomingEvents') }),
    }),

    markAttendance: tool({
      description:
        'Navrhne označení docházky na události (podle eventId). Ve výchozím stavu označí všechny členy týmu jako PŘÍTOMNÉ; jména v poli absent budou označena jako NEPŘÍTOMNÁ. Vyžaduje potvrzení uživatele.',
      inputSchema: z.object({
        eventId: z.string().describe('ID události z getUpcomingEvents'),
        absent: z
          .array(z.string())
          .optional()
          .describe('Jména členů, kteří CHYBĚLI (např. ["Filip Novák"]). Prázdné = všichni přítomní.'),
      }),
    }),
  };

  // Filter by the club's per-tool role config.
  const mine = memberBuckets(member);
  const result: ToolSet = {};
  for (const [key, def] of Object.entries(all)) {
    if (!def) continue;
    const allowed = aiToolAllowedBuckets(settings, key);
    if (allowed.some((bucket) => mine.includes(bucket))) {
      result[key] = def;
    }
  }
  return result;
}
