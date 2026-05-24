/**
 * Seed script — Sport manager dev data (FULL VARIANT COVERAGE).
 *
 * 2 fiktivní kluby + 1 reálný:
 *   1. FC Hvězda Strašnice (fotbal, U13 + U15)      — modrá / zlatá     | tier: pro  (fiktivní)
 *   2. TJ Sokol Měcholupy  (florbal, U11)           — zelená / oranžová | tier: free (fiktivní)
 *   3. ABC Braník fotbal, z.s. — REÁLNÝ klub (zal. 1914, Praha 4-Braník) | tier: pro
 *                          Ženské kategorie: Přípravka / WU13 / WU15 / WU18 / Ženy A
 *                          Reálná data (klub, kategorie, trenéři, hřiště) z abcbranik.cz;
 *                          hráčky / rodiče / rozpis / přiřazení cvičení = simulováno.
 *
 * Demonstrates EVERY enum value + edge case from the schema:
 *   - MemberStatus: ACTIVE, INACTIVE, SUSPENDED, ARCHIVED
 *   - TeamRole: PLAYER, HEAD_COACH, ASSISTANT_COACH, TEAM_MANAGER, MEDIC
 *   - ClubRoleType: OWNER, ADMIN, FINANCE, COMMUNICATIONS, FACILITY
 *   - GuardianRelationship: PARENT, STEP_PARENT, LEGAL_GUARDIAN, OTHER
 *   - EventType: PRACTICE, MATCH, TOURNAMENT, MEETING, SOCIAL
 *   - HomeAway: HOME, AWAY, NEUTRAL
 *   - RSVPStatus: YES, NO, MAYBE, PENDING
 *   - ConversationType: TEAM, COACHES, PARENTS, DM, GROUP, ANNOUNCEMENT
 *   - WaiverType: GDPR, HEALTH, LIABILITY, MEDIA_CONSENT
 *   - PaymentStatus: PENDING, PROCESSING, PAID, FAILED, REFUNDED
 *   - NotificationType: all 10 variants
 *   - Multi-role: 16yo Šimon is PLAYER on U15 AND ASSISTANT_COACH on U13
 *   - Multi-tenant: Tomáš Mertin = parent in Hvězda + HEAD_COACH in Sokol
 *   - Divorced parents (different permission masks)
 *   - Step-parent + Legal guardian relationships
 *   - Privacy DM (Dad NOT participant)
 *   - TrainingTemplate that materializes Events
 *   - Detached event (was from template, then unlinked)
 *   - ClubFeatureAudit entry
 *   - PushToken example
 *   - Edited message, deleted (soft) message
 *
 * Dev login matrix (password "heslo123" for all):
 *   admin@hvezda.cz       Pavel Dvořák       — Hvězda OWNER
 *   coach@hvezda.cz       Miroslav Horák     — Hvězda HEAD_COACH (U13)
 *   parent@hvezda.cz      Lucie Pekařová     — Hvězda parent (Mom of Anna)
 *   admin@sokoli.cz       Jana Procházková   — Sokol OWNER
 *   tomas@example.com     Tomáš Mertin       — multi-tenant: Hvězda parent + Sokol HEAD_COACH
 *   admin@branik.cz       Markéta Svobodová  — ABC Braník OWNER+ADMIN+FINANCE (simulováno)
 *   maly@abcbranik.cz     Lukáš Malý         — ABC Braník šéftrenér žen + Ženy A HEAD_COACH (reálný)
 *   kapitanka@branik.cz   (simulovaná hráčka)— ABC Braník Ženy A kapitánka
 *   platform@example.com  Petr Platforma     — SaaS platform admin
 */
import {
  PrismaClient,
  ClubRoleType,
  ConversationType,
  EventType,
  GuardianRelationship,
  HomeAway,
  MemberStatus,
  NotificationType,
  PaymentStatus,
  RSVPStatus,
  TeamRole,
  WaiverType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEV_PASSWORD = 'heslo123';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function offset(daysFromNow: number, hour = 10, minute = 0): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

function avatarUrl(email: string, isMinor = false): string {
  if (isMinor) {
    // Deterministic cartoon-style avatar for children
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`;
  }
  // Deterministic realistic photo for adults (same email → same photo every time)
  return `https://i.pravatar.cc/128?u=${encodeURIComponent(email)}`;
}

// Deterministic REAL portrait photo with a fixed gender (randomuser.me).
// Used for ABC Bráník (ženský klub) — skutečné fotky hráček/trenérek,
// otcové dostanou mužský portrét. Stejný email → stejná fotka.
function photoUrl(email: string, gender: 'women' | 'men'): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % 100; // randomuser.me má 0–99 portrétů na pohlaví
  return `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

// ----------------------------------------------------------------------------
// Club brand SVG logos
// ----------------------------------------------------------------------------

const HVEZDA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#1e3a8a" stroke="#f59e0b" stroke-width="3"/><path d="M50 14L60 40L88 40L66 58L74 86L50 70L26 86L34 58L12 40L40 40Z" fill="#f59e0b"/></svg>`;

const SOKOL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#16a34a" stroke="#ea580c" stroke-width="3"/><path d="M50 22 C32 36 30 58 38 76 C45 80 50 76 50 70 C50 76 55 80 62 76 C70 58 68 36 50 22 Z" fill="#fff"/><circle cx="44" cy="48" r="2.5" fill="#16a34a"/><path d="M50 60 L46 66 L54 66 Z" fill="#ea580c"/></svg>`;

// ABC Braník (reálný klub, zal. 1914) — klubové barvy světle modrá + bílá.
// Monogram "ABC" + rok založení 1914 nad stylizovaným míčem.
const BRANIK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0284c7" stroke="#ffffff" stroke-width="3"/><text x="50" y="40" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">ABC</text><circle cx="50" cy="58" r="12" fill="#ffffff"/><path d="M50 49 l4 2.9 -1.5 4.8 -5 0 -1.5 -4.8 z" fill="#0284c7"/><text x="50" y="86" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#bae6fd" text-anchor="middle" letter-spacing="2">1914</text></svg>`;

// ----------------------------------------------------------------------------
// Czech names
// ----------------------------------------------------------------------------

const CHILD_FIRST    = ['Tomáš', 'Jakub', 'Filip', 'David', 'Vojtěch', 'Adam', 'Matyáš', 'Lukáš', 'Ondřej', 'Štěpán', 'Karel', 'Petr', 'Jan', 'Marek', 'Šimon'];
const SURNAMES       = ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný', 'Pospíšil', 'Hájek', 'Marek', 'Růžička', 'Beneš', 'Fiala', 'Sedláček'];
const PARENT_FIRST_M = ['Petr', 'Martin', 'Pavel', 'Jiří', 'Tomáš', 'Michal', 'David', 'Marek'];
const PARENT_FIRST_F = ['Lucie', 'Hana', 'Jana', 'Kateřina', 'Eva', 'Zuzana', 'Tereza', 'Barbora'];
// ABC Bráník — ženské kategorie: dívčí křestní jména + přechýlená příjmení.
const GIRL_FIRST     = ['Eliška', 'Tereza', 'Adéla', 'Natálie', 'Karolína', 'Kristýna', 'Barbora', 'Anežka', 'Viktorie', 'Nela', 'Sofie', 'Ema', 'Laura', 'Klára', 'Julie', 'Rozálie', 'Amálie', 'Magdaléna', 'Veronika', 'Denisa'];
const FEM_SURNAMES   = ['Nováková', 'Svobodová', 'Novotná', 'Dvořáková', 'Černá', 'Procházková', 'Kučerová', 'Veselá', 'Horáková', 'Němcová', 'Pokorná', 'Pospíšilová', 'Hájková', 'Marková', 'Růžičková', 'Benešová', 'Fialová', 'Sedláčková', 'Kratochvílová', 'Urbanová'];

// ----------------------------------------------------------------------------
// Tréninkové plány — přiřazení cvičení z knihovny (apps/web/lib/training-library.ts)
// do naplánovaných tréninkových slotů. Drilly se ukládají do Event.description
// markerem `<!-- drills: id1,id2 -->` (viz components/admin/event/event-drills-tab.tsx).
// Reálné rozpisy ABC Braník nejsou veřejné → simulováno dle úrovně kategorie.
// ----------------------------------------------------------------------------

type SessionPlan = { title: string; drills: string[] };

const SESSION_PLANS: Record<'mini' | 'youth' | 'women', SessionPlan[]> = {
  // Přípravka — hravé, koordinace, dribling
  mini: [
    { title: 'Hra s míčem a koordinace', drills: ['w5', 'd2', 'd1', 'g3'] },
    { title: 'Vedení míče a zakončení', drills: ['w6', 'd1', 'g2'] },
    { title: 'Pohybové hry', drills: ['w5', 'w6', 'd2', 'g3'] },
  ],
  // WU13 / WU15 / WU18 — technika, herní situace
  youth: [
    { title: 'Přihrávka a držení míče', drills: ['w1', 'p1', 'p4', 't2', 'g1'] },
    { title: 'Obranné chování 1v1', drills: ['w7', 'def1', 's1', 'g1'] },
    { title: 'Přechodová fáze a zakončení', drills: ['w1', 'p4', 's1', 't2', 'g1'] },
  ],
  // Ženy A — intenzita, kondice, taktika
  women: [
    { title: 'Vysoký presink a rychlý přechod', drills: ['w7', 'def2', 'p9', 't1', 'g1'] },
    { title: 'Kondice a zakončení pod tlakem', drills: ['f1', 's4', 'p10', 't1'] },
    { title: 'Budování útoku přes stopera', drills: ['w7', 'p10', 'p9', 's4', 'g1'] },
  ],
};

function planDescription(p: SessionPlan): string {
  return (
    `Tréninková jednotka — ${p.title}\n\n` +
    `1) Rozcvička a aktivace (15 min)\n` +
    `2) Hlavní nácvikový blok (40 min)\n` +
    `3) Herní část (25 min)\n` +
    `4) Vyklusání a strečink (10 min)\n\n` +
    `Cvičení z knihovny zařazená do tréninku níže.\n` +
    `<!-- drills: ${p.drills.join(',')} -->`
  );
}

// Přiřadí rotující tréninkové plány (drilly z knihovny) všem PRACTICE eventům týmu.
async function assignDrillPlans(teamId: string, level: 'mini' | 'youth' | 'women') {
  const plans = SESSION_PLANS[level];
  const practices = await prisma.event.findMany({
    where: { teamId, type: EventType.PRACTICE },
    orderBy: { startsAt: 'asc' },
    select: { id: true },
  });
  for (let i = 0; i < practices.length; i++) {
    await prisma.event.update({
      where: { id: practices[i]!.id },
      data: { description: planDescription(plans[i % plans.length]!) },
    });
  }
  return practices.length;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🧹 Wiping old data…');

  await prisma.$executeRawUnsafe(`SET row_security = OFF`).catch(() => {});

  // Wipe in dependency order
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.trainingTemplate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.waiverSignature.deleteMany();
  await prisma.waiver.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.guardianLink.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.team.deleteMany();
  await prisma.clubRole.deleteMany();
  await prisma.member.deleteMany();
  await prisma.session.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.clubFeatureAudit.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Seeding…');

  const devHash = await bcrypt.hash(DEV_PASSWORD, 12);

  // ==========================================================================
  // Platform admin (no club)
  // ==========================================================================

  const platformAdmin = await prisma.user.create({
    data: {
      email: 'platform@example.com', passwordHash: devHash,
      firstName: 'Petr', lastName: 'Platforma', locale: 'cs',
      isPlatformAdmin: true,
      avatarUrl: avatarUrl('platform@example.com', false),
    },
  });

  // ==========================================================================
  // CLUB 1: FC Hvězda Strašnice
  // ==========================================================================

  console.log('  ⚽ FC Hvězda Strašnice…');

  const hvezda = await prisma.club.create({
    data: {
      slug: 'fc-hvezda', name: 'FC Hvězda Strašnice',
      country: 'CZ', timezone: 'Europe/Prague',
      features: {
        messages: true, notifications: true, trainingTemplates: true,
        payments: true, waivers: true, calendar: true, gallery: true,
        springCup: false,
      },
      config: {
        tier: 'pro', limits: { maxMembers: 200, maxTeams: 10 },
        logoSvg: HVEZDA_LOGO_SVG,
        theme: { primary: '#1e3a8a', secondary: '#f59e0b', tertiary: '#0f172a', styleId: 1 },
      },
    },
  });

  const u13 = await prisma.team.create({
    data: { clubId: hvezda.id, name: 'U13 Strašnice', sport: 'Fotbal', ageGroup: 'U13', season: '2025/26' },
  });
  const u15 = await prisma.team.create({
    data: { clubId: hvezda.id, name: 'U15 Strašnice', sport: 'Fotbal', ageGroup: 'U15', season: '2025/26' },
  });

  // --- Adults: ClubRoleType coverage (OWNER, ADMIN, FINANCE, COMMUNICATIONS, FACILITY) ---

  const adminH = await createUserMember({
    email: 'admin@hvezda.cz', firstName: 'Pavel', lastName: 'Dvořák',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    clubRoles: [ClubRoleType.OWNER, ClubRoleType.ADMIN, ClubRoleType.FINANCE],
  });

  const commsH = await createUserMember({
    email: 'pr@hvezda.cz', firstName: 'Iveta', lastName: 'Veselá',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    clubRoles: [ClubRoleType.COMMUNICATIONS],
  });

  const facilityH = await createUserMember({
    email: 'spravce@hvezda.cz', firstName: 'Jaroslav', lastName: 'Hájek',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    clubRoles: [ClubRoleType.FACILITY],
  });

  // --- Coaches: HEAD_COACH, ASSISTANT_COACH, TEAM_MANAGER, MEDIC ---

  const coachU13 = await createUserMember({
    email: 'coach@hvezda.cz', firstName: 'Miroslav', lastName: 'Horák',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    teamRoles: [{ teamId: u13.id, role: TeamRole.HEAD_COACH }],
  });

  const assistantU13 = await createUserMember({
    email: 'jakub.kucera@hvezda.cz', firstName: 'Jakub', lastName: 'Kučera',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    teamRoles: [{ teamId: u13.id, role: TeamRole.ASSISTANT_COACH }],
  });

  const teamMgrU13 = await createUserMember({
    email: 'manager.u13@hvezda.cz', firstName: 'Renata', lastName: 'Sedláčková',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    teamRoles: [{ teamId: u13.id, role: TeamRole.TEAM_MANAGER }],
  });

  const medicU13 = await createUserMember({
    email: 'doktor@hvezda.cz', firstName: 'Aleš', lastName: 'Beneš',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    teamRoles: [{ teamId: u13.id, role: TeamRole.MEDIC }, { teamId: u15.id, role: TeamRole.MEDIC }],
  });

  const coachU15 = await createUserMember({
    email: 'coach.u15@hvezda.cz', firstName: 'Roman', lastName: 'Fiala',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    teamRoles: [{ teamId: u15.id, role: TeamRole.HEAD_COACH }],
  });

  // --- U13 Players + parent linkage (with divorced + step-parent + legal-guardian variants) ---

  const childMembersHvezda: Array<{ id: string; firstName: string; surname: string }> = [];

  for (let i = 0; i < 11; i++) {
    const isAnna = i === 3;
    const firstName = isAnna ? 'Anna' : pick(CHILD_FIRST, i + 7);
    const surname = isAnna ? 'Pekařová' : pick(SURNAMES, i + 2);

    const child = await createUserMember({
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@kid.local`,
      firstName, lastName: surname,
      clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      isMinor: true, jerseyNumber: 7 + i, position: pick(['ÚT', 'ZÁL', 'OBR', 'BR'], i),
      teamRoles: [{ teamId: u13.id, role: TeamRole.PLAYER }],
    });
    childMembersHvezda.push({ id: child.memberId, firstName, surname });

    if (isAnna) {
      // Divorced parents
      const mom = await createUserMember({
        email: 'parent@hvezda.cz', firstName: 'Lucie', lastName: 'Pekařová',
        clubId: hvezda.id, brandColor: '#f59e0b', devHash,
      });
      const dad = await createUserMember({
        email: 'petr.pekar@hvezda.cz', firstName: 'Petr', lastName: 'Pekař',
        clubId: hvezda.id, brandColor: '#475569', devHash,
      });
      // Plus step-parent (Mom's new partner)
      const stepDad = await createUserMember({
        email: 'martin.novotny@hvezda.cz', firstName: 'Martin', lastName: 'Novotný',
        clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      });
      await prisma.guardianLink.createMany({
        data: [
          {
            guardianId: mom.memberId, childId: child.memberId,
            relationship: GuardianRelationship.PARENT, isPrimary: true,
            canViewSchedule: true, canRsvp: true, canViewPayments: true,
            canMakePayments: true, canViewMedical: true, canSignWaivers: true,
            verifiedAt: new Date(),
          },
          {
            guardianId: dad.memberId, childId: child.memberId,
            relationship: GuardianRelationship.PARENT, isPrimary: false,
            canViewSchedule: true, canRsvp: true,
            canViewPayments: false, canMakePayments: false,
            canViewMedical: false, canSignWaivers: true,
            verifiedAt: new Date(),
          },
          {
            guardianId: stepDad.memberId, childId: child.memberId,
            relationship: GuardianRelationship.STEP_PARENT, isPrimary: false,
            canViewSchedule: true, canRsvp: false,
            canViewPayments: false, canMakePayments: false,
            canViewMedical: false, canSignWaivers: false,
            verifiedAt: new Date(),
          },
        ],
      });
    } else if (i === 5) {
      // LEGAL_GUARDIAN case (parent unavailable, grandparent has legal custody)
      const legalGuardian = await createUserMember({
        email: `babicka.${surname.toLowerCase()}@hvezda.cz`,
        firstName: 'Marie', lastName: surname,
        clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      });
      await prisma.guardianLink.create({
        data: {
          guardianId: legalGuardian.memberId, childId: child.memberId,
          relationship: GuardianRelationship.LEGAL_GUARDIAN, isPrimary: true,
          canViewSchedule: true, canRsvp: true, canViewPayments: true,
          canMakePayments: true, canViewMedical: true, canSignWaivers: true,
          verifiedAt: new Date(),
        },
      });
    } else if (i === 7) {
      // OTHER relationship (uncle/older sibling acting as guardian)
      const other = await createUserMember({
        email: `stryc.${surname.toLowerCase()}@hvezda.cz`,
        firstName: 'Václav', lastName: surname,
        clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      });
      await prisma.guardianLink.create({
        data: {
          guardianId: other.memberId, childId: child.memberId,
          relationship: GuardianRelationship.OTHER, isPrimary: true,
          canViewSchedule: true, canRsvp: true, canViewPayments: false,
          canMakePayments: false, canViewMedical: false, canSignWaivers: false,
          verifiedAt: null, // unverified — admin must approve
        },
      });
    } else {
      // Standard PARENT
      const parentFirst = pick(PARENT_FIRST_M, i);
      const parent = await createUserMember({
        email: `${parentFirst.toLowerCase()}.${surname.toLowerCase()}@parent.local`,
        firstName: parentFirst, lastName: surname,
        clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      });
      await prisma.guardianLink.create({
        data: {
          guardianId: parent.memberId, childId: child.memberId,
          relationship: GuardianRelationship.PARENT, isPrimary: true,
          canViewSchedule: true, canRsvp: true, canViewPayments: true,
          canMakePayments: true, canViewMedical: true, canSignWaivers: true,
          verifiedAt: new Date(),
        },
      });
    }
  }

  // --- U15 Players ---

  const u15Children: Array<{ id: string; firstName: string; surname: string }> = [];
  for (let i = 0; i < 9; i++) {
    const firstName = pick(CHILD_FIRST.slice().reverse(), i);
    const surname = pick(SURNAMES.slice().reverse(), i + 1);
    const child = await createUserMember({
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}.u15@kid.local`,
      firstName, lastName: surname,
      clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
      isMinor: true, jerseyNumber: 100 + i, position: pick(['ÚT', 'ZÁL', 'OBR', 'BR'], i),
      teamRoles: [{ teamId: u15.id, role: TeamRole.PLAYER }],
    });
    u15Children.push({ id: child.memberId, firstName, surname });
  }

  // --- MULTI-ROLE: Šimon (16, U15 PLAYER + U13 ASSISTANT_COACH) ---

  const simon = await createUserMember({
    email: 'simon.assist@hvezda.cz', firstName: 'Šimon', lastName: 'Růžička',
    clubId: hvezda.id, brandColor: '#1e3a8a', devHash,
    isMinor: true, jerseyNumber: 11,
    teamRoles: [
      { teamId: u15.id, role: TeamRole.PLAYER },
      { teamId: u13.id, role: TeamRole.ASSISTANT_COACH },
    ],
  });
  u15Children.push({ id: simon.memberId, firstName: 'Šimon', surname: 'Růžička' });

  // --- MemberStatus variants: INACTIVE, SUSPENDED, ARCHIVED ---

  await createUserMember({
    email: 'inactive.player@hvezda.cz', firstName: 'Daniel', lastName: 'Pospíšil',
    clubId: hvezda.id, brandColor: '#94a3b8', devHash, isMinor: true,
    status: MemberStatus.INACTIVE,
    teamRoles: [{ teamId: u13.id, role: TeamRole.PLAYER }],
  });
  await createUserMember({
    email: 'suspended.player@hvezda.cz', firstName: 'Roman', lastName: 'Černý',
    clubId: hvezda.id, brandColor: '#dc2626', devHash, isMinor: true,
    status: MemberStatus.SUSPENDED,
    teamRoles: [{ teamId: u13.id, role: TeamRole.PLAYER }],
  });
  await createUserMember({
    email: 'archived.player@hvezda.cz', firstName: 'Karel', lastName: 'Pokorný',
    clubId: hvezda.id, brandColor: '#64748b', devHash, isMinor: false,
    status: MemberStatus.ARCHIVED,
  });

  // --- DEDICATED TEST PLAYER (pure player, no admin/coach/parent) ---
  await createUserMember({
    email: 'hrac@hvezda.cz', firstName: 'Filip', lastName: 'Novák',
    clubId: hvezda.id, brandColor: '#0891b2', devHash,
    isMinor: false, jerseyNumber: 9, position: 'útočník',
    teamRoles: [{ teamId: u15.id, role: TeamRole.PLAYER }],
  });

  // ==========================================================================
  // CLUB 2: TJ Sokol Měcholupy (florbal, U11)
  // ==========================================================================

  console.log('  🏑 TJ Sokol Měcholupy…');

  const sokol = await prisma.club.create({
    data: {
      slug: 'sokol-mecholupy', name: 'TJ Sokol Měcholupy',
      country: 'CZ', timezone: 'Europe/Prague',
      features: {
        messages: true, notifications: true, trainingTemplates: true,
        payments: false, waivers: true, calendar: true, gallery: false,
        springCup: false,
      },
      config: {
        tier: 'free', limits: { maxMembers: 50, maxTeams: 2 },
        logoSvg: SOKOL_LOGO_SVG,
        theme: { primary: '#16a34a', secondary: '#ea580c', tertiary: '#064e3b', styleId: 2 },
      },
    },
  });

  const u11 = await prisma.team.create({
    data: { clubId: sokol.id, name: 'U11 Sokoli', sport: 'Florbal', ageGroup: 'U11', season: '2025/26' },
  });

  await createUserMember({
    email: 'admin@sokoli.cz', firstName: 'Jana', lastName: 'Procházková',
    clubId: sokol.id, brandColor: '#16a34a', devHash,
    clubRoles: [ClubRoleType.OWNER, ClubRoleType.ADMIN],
  });

  // ── Multi-tenant: Tomáš Mertin ──
  const tomasUser = await prisma.user.create({
    data: {
      email: 'tomas@example.com', passwordHash: devHash,
      firstName: 'Tomáš', lastName: 'Mertin', locale: 'cs',
      avatarUrl: avatarUrl('tomas@example.com', false),
    },
  });

  // PushToken example for Tomáš (web + ios)
  await prisma.pushToken.createMany({
    data: [
      { userId: tomasUser.id, token: 'expo-token-tomas-ios-' + Date.now(), platform: 'ios' },
      { userId: tomasUser.id, token: 'web-push-tomas-' + Date.now(), platform: 'web' },
    ],
  });

  const tomasInSokol = await prisma.member.create({
    data: { userId: tomasUser.id, clubId: sokol.id, status: MemberStatus.ACTIVE },
  });
  await prisma.teamMembership.create({
    data: { memberId: tomasInSokol.id, teamId: u11.id, role: TeamRole.HEAD_COACH },
  });

  const tomasInHvezda = await prisma.member.create({
    data: { userId: tomasUser.id, clubId: hvezda.id, status: MemberStatus.ACTIVE },
  });

  // Tomáš = parent of Anna Pekařová in Hvězda (multi-club parent edge case)
  // Anna is childMembersHvezda[3] (index 3, the isAnna child)
  if (childMembersHvezda[3]) {
    await prisma.guardianLink.create({
      data: {
        guardianId: tomasInHvezda.id, childId: childMembersHvezda[3].id,
        relationship: GuardianRelationship.OTHER, isPrimary: false,
        canViewSchedule: true, canRsvp: true,
        canViewPayments: false, canMakePayments: false,
        canViewMedical: false, canSignWaivers: false,
        verifiedAt: new Date(),
      },
    });
  }

  // ── Sokol roster: 8 kids + 1 parent each ──
  const sokolChildren: Array<{ id: string; firstName: string; surname: string }> = [];
  for (let i = 0; i < 8; i++) {
    const surname = pick(SURNAMES, i + 11);
    const firstName = pick(CHILD_FIRST, i + 1);
    const child = await createUserMember({
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@kid.sokoli`,
      firstName, lastName: surname,
      clubId: sokol.id, brandColor: '#16a34a', devHash,
      isMinor: true, jerseyNumber: 11 + i, position: pick(['ÚT', 'OB', 'BR'], i),
      teamRoles: [{ teamId: u11.id, role: TeamRole.PLAYER }],
    });
    sokolChildren.push({ id: child.memberId, firstName, surname });

    const parentFirst = pick(PARENT_FIRST_M.concat(PARENT_FIRST_F), i + 3);
    const parent = await createUserMember({
      email: `${parentFirst.toLowerCase()}.${surname.toLowerCase()}@parent.sokoli`,
      firstName: parentFirst, lastName: surname,
      clubId: sokol.id, brandColor: '#16a34a', devHash,
    });
    await prisma.guardianLink.create({
      data: {
        guardianId: parent.memberId, childId: child.memberId,
        relationship: GuardianRelationship.PARENT, isPrimary: true,
        canViewSchedule: true, canRsvp: true, canViewPayments: true,
        canMakePayments: true, canViewMedical: true, canSignWaivers: true,
        verifiedAt: new Date(),
      },
    });
  }

  // Tomáš = also guardian of first Sokol kid (multi-club parent: 2 kids in 2 clubs)
  if (sokolChildren[0]) {
    await prisma.guardianLink.create({
      data: {
        guardianId: tomasInSokol.id, childId: sokolChildren[0].id,
        relationship: GuardianRelationship.PARENT, isPrimary: false,
        canViewSchedule: true, canRsvp: true, canViewPayments: true,
        canMakePayments: true, canViewMedical: true, canSignWaivers: true,
        verifiedAt: new Date(),
      },
    });
  }

  // Sokol — TEAM_MANAGER + assistant
  await createUserMember({
    email: 'asistent@sokoli.cz', firstName: 'Lukáš', lastName: 'Marek',
    clubId: sokol.id, brandColor: '#16a34a', devHash,
    teamRoles: [{ teamId: u11.id, role: TeamRole.ASSISTANT_COACH }],
  });
  await createUserMember({
    email: 'manager@sokoli.cz', firstName: 'Eva', lastName: 'Hájková',
    clubId: sokol.id, brandColor: '#16a34a', devHash,
    teamRoles: [{ teamId: u11.id, role: TeamRole.TEAM_MANAGER }],
  });

  // ==========================================================================
  // CLUB 3: ABC Braník fotbal, z.s. — REÁLNÝ klub (zal. 1914, Praha 4-Braník)
  //
  //   Reálná data z abcbranik.cz / abcbranikdivky.websnadno.cz:
  //     - klub: název, IČO 05650241, adresa, rok 1914, barvy (světle modrá/bílá)
  //     - ženské kategorie: Přípravka / WU13 / WU15 / WU18 / Ženy A
  //     - reálné hlavní trenérky/trenéři + šéftrenér + patronka Simona Necidová
  //   Simulováno (není veřejné): hráčky, rodiče, realizační podpora, rozpis
  //     tréninků, přiřazení cvičení z knihovny do slotů, RSVP, platby, zprávy.
  // ==========================================================================

  console.log('  ⚽️ ABC Braník fotbal, z.s. (reálný klub — ženské kategorie)…');

  const branik = await prisma.club.create({
    data: {
      slug: 'abc-branik', name: 'ABC Braník',
      country: 'CZ', timezone: 'Europe/Prague',
      features: {
        messages: true, notifications: true, trainingTemplates: true,
        payments: true, waivers: true, calendar: true, gallery: true,
        springCup: true,
      },
      config: {
        tier: 'pro', limits: { maxMembers: 300, maxTeams: 12 },
        logoSvg: BRANIK_LOGO_SVG,
        // Reálné klubové barvy: světle modrá + bílá
        theme: { primary: '#0284c7', secondary: '#38bdf8', tertiary: '#0c4a6e', styleId: 1 },
        description:
          'ABC Braník fotbal, z.s. — tradiční pražský klub založený v roce 1914 ' +
          '(Za mlýnem 1774/12, Praha 4 – Braník). Ženský a dívčí fotbal zastřešuje ' +
          'Simona Necidová (SK Slavia Praha, reprezentace ČR). Kategorie: Přípravka, ' +
          'WU13, WU15, WU18 a Ženy A.',
        // Reálné rejstříkové / kontaktní údaje klubu
        legalName: 'ABC Braník fotbal, z.s.',
        ico: '05650241',
        address: 'Za mlýnem 1774/12, Praha 4 – Braník, 147 00',
        founded: 1914,
        kit: 'Adidas',
        publicEmail: 'info@abcbranik.cz',
      },
    },
  });

  const brBrand = '#0284c7';
  // Reálný areál ABC Braník — přírodní tráva + 2× umělá tráva
  const brVenues = {
    home: 'Areál Za mlýnem (Za mlýnem 1774/12, Praha 4 – Braník)',
    away: 'Hřiště soupeře',
    neutral: 'Stadion Strahov',
    social: 'Klubovna ABC Braník',
  };

  // --- Reálné ženské kategorie (názvy + ročníky dle abcbranikdivky) ---
  const prip = await prisma.team.create({
    data: { clubId: branik.id, name: 'Přípravka dívky', sport: 'Fotbal', ageGroup: 'Přípravka (2015 a ml.)', season: '2025/26' },
  });
  const wu13 = await prisma.team.create({
    data: { clubId: branik.id, name: 'WU13', sport: 'Fotbal', ageGroup: 'WU13 (2013–2014)', season: '2025/26' },
  });
  const wu15 = await prisma.team.create({
    data: { clubId: branik.id, name: 'WU15', sport: 'Fotbal', ageGroup: 'WU15 (2011–2012)', season: '2025/26' },
  });
  const wu18 = await prisma.team.create({
    data: { clubId: branik.id, name: 'WU18', sport: 'Fotbal', ageGroup: 'WU18 (2008–2010)', season: '2025/26' },
  });
  const zenyA = await prisma.team.create({
    data: { clubId: branik.id, name: 'Ženy A', sport: 'Fotbal', ageGroup: 'Ženy', season: '2025/26' },
  });

  // --- Vedení: OWNER simulován (jméno kanceláře není veřejné) ---
  const ownerB = await createUserMember({
    email: 'admin@branik.cz', firstName: 'Markéta', lastName: 'Svobodová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    clubRoles: [ClubRoleType.OWNER, ClubRoleType.ADMIN, ClubRoleType.FINANCE],
  });
  // Reálný klubový kontakt (sekretariát) — info@abcbranik.cz
  const officeB = await createUserMember({
    email: 'info@abcbranik.cz', firstName: 'Sekretariát', lastName: 'klubu',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    clubRoles: [ClubRoleType.COMMUNICATIONS, ClubRoleType.FACILITY],
  });
  // Reálná patronka dívčího/ženského fotbalu — Simona Necidová (Slavia + repre)
  const patronB = await createUserMember({
    email: 'simona.necidova@abcbranik.cz', firstName: 'Simona', lastName: 'Necidová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    position: 'Patronka dívčího fotbalu (SK Slavia Praha)',
    clubRoles: [ClubRoleType.COMMUNICATIONS],
  });

  // --- Reální hlavní trenéři kategorií + šéftrenér (jména a e-maily z webu) ---
  const coachZenyA = await createUserMember({
    email: 'maly@abcbranik.cz', firstName: 'Lukáš', lastName: 'Malý',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'men',
    position: 'Šéftrenér ženských týmů',
    teamRoles: [{ teamId: zenyA.id, role: TeamRole.HEAD_COACH }],
  });
  const coachWU18 = await createUserMember({
    email: 'martin@hauft.cz', firstName: 'Martin', lastName: 'Hauft',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'men',
    teamRoles: [{ teamId: wu18.id, role: TeamRole.HEAD_COACH }],
  });
  const coachWU15 = await createUserMember({
    email: 'mata.9977@gmail.com', firstName: 'Matěj', lastName: 'Sedláček',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'men',
    teamRoles: [{ teamId: wu15.id, role: TeamRole.HEAD_COACH }],
  });
  const coachWU13 = await createUserMember({
    email: 'jirikratoska@centrum.cz', firstName: 'Jiří', lastName: 'Krátoška',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'men',
    teamRoles: [{ teamId: wu13.id, role: TeamRole.HEAD_COACH }],
  });
  const coachPrip = await createUserMember({
    email: 'palkova010@seznam.cz', firstName: 'Aneta', lastName: 'Jindrová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    teamRoles: [{ teamId: prip.id, role: TeamRole.HEAD_COACH }],
  });

  // --- Realizační podpora — SIMULOVÁNO (asistentka, manažerka, lékařka) ---
  const assistantWU15 = await createUserMember({
    email: 'asistentka.wu15@branik.cz', firstName: 'Klára', lastName: 'Benešová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    teamRoles: [{ teamId: wu15.id, role: TeamRole.ASSISTANT_COACH }],
  });
  const mgrWU18 = await createUserMember({
    email: 'manazerka.wu18@branik.cz', firstName: 'Lucie', lastName: 'Marková',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    teamRoles: [{ teamId: wu18.id, role: TeamRole.TEAM_MANAGER }],
  });
  await createUserMember({
    email: 'lekarka@branik.cz', firstName: 'Eva', lastName: 'Fialová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    teamRoles: [
      { teamId: zenyA.id, role: TeamRole.MEDIC },
      { teamId: wu18.id, role: TeamRole.MEDIC },
      { teamId: wu15.id, role: TeamRole.MEDIC },
    ],
  });

  // --- Hráčky + rodiče — SIMULOVÁNO (privátní data nejsou veřejná) ---
  // Pomocná f-ce: vytvoří dívku (nezletilá) + 1 primárního zástupce.
  async function seedGirl(args: {
    team: string; idx: number; jersey: number; status?: MemberStatus;
    legalGuardian?: boolean;
  }) {
    const firstName = pick(GIRL_FIRST, args.idx);
    const surname = pick(FEM_SURNAMES, args.idx + 2);
    const child = await createUserMember({
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}.${args.team}@kid.branik`,
      firstName, lastName: surname,
      clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
      isMinor: true, status: args.status ?? MemberStatus.ACTIVE,
      jerseyNumber: args.jersey, position: pick(['ÚT', 'ZÁL', 'OBR', 'BR'], args.idx),
      teamRoles: [{ teamId: args.team === 'prip' ? prip.id : args.team === 'wu13' ? wu13.id : args.team === 'wu15' ? wu15.id : wu18.id, role: TeamRole.PLAYER }],
    });
    if (args.legalGuardian) {
      const lg = await createUserMember({
        email: `babicka.${surname.toLowerCase()}.${args.team}@parent.branik`,
        firstName: 'Marie', lastName: surname,
        clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
      });
      await prisma.guardianLink.create({
        data: {
          guardianId: lg.memberId, childId: child.memberId,
          relationship: GuardianRelationship.LEGAL_GUARDIAN, isPrimary: true,
          canViewSchedule: true, canRsvp: true, canViewPayments: true,
          canMakePayments: true, canViewMedical: true, canSignWaivers: true,
          verifiedAt: new Date(),
        },
      });
    } else {
      const isMom = args.idx % 2 === 0;
      const gFirst = isMom ? pick(PARENT_FIRST_F, args.idx) : pick(PARENT_FIRST_M, args.idx);
      const gSurname = isMom ? surname : surname.replace(/ová$/, '').replace(/á$/, 'ý');
      const guardian = await createUserMember({
        email: `${gFirst.toLowerCase()}.${gSurname.toLowerCase()}.${args.team}@parent.branik`,
        firstName: gFirst, lastName: gSurname,
        clubId: branik.id, brandColor: brBrand, devHash,
        realPhoto: isMom ? 'women' : 'men',
      });
      await prisma.guardianLink.create({
        data: {
          guardianId: guardian.memberId, childId: child.memberId,
          relationship: GuardianRelationship.PARENT, isPrimary: true,
          canViewSchedule: true, canRsvp: true, canViewPayments: true,
          canMakePayments: true, canViewMedical: true, canSignWaivers: true,
          verifiedAt: new Date(),
        },
      });
    }
    return { id: child.memberId, firstName, surname };
  }

  const pripChildren: Array<{ id: string }> = [];
  for (let i = 0; i < 9; i++) pripChildren.push(await seedGirl({ team: 'prip', idx: i, jersey: 2 + i }));

  const wu13Children: Array<{ id: string }> = [];
  for (let i = 0; i < 11; i++) wu13Children.push(await seedGirl({ team: 'wu13', idx: i + 1, jersey: 4 + i }));

  const wu15Children: Array<{ id: string }> = [];
  for (let i = 0; i < 12; i++) {
    wu15Children.push(await seedGirl({
      team: 'wu15', idx: i + 3, jersey: 6 + i,
      status: i === 11 ? MemberStatus.INACTIVE : MemberStatus.ACTIVE, // dlouhodobé zranění
    }));
  }

  const wu18Children: Array<{ id: string }> = [];
  for (let i = 0; i < 12; i++) {
    wu18Children.push(await seedGirl({
      team: 'wu18', idx: i + 5, jersey: 8 + i,
      status: i === 10 ? MemberStatus.SUSPENDED : MemberStatus.ACTIVE,
      legalGuardian: i === 4, // edge case: opatrovnictví babičky
    }));
  }

  // --- Ženy A: dospělé hráčky — SIMULOVÁNO + kapitánka s loginem ---
  const zenyAPlayers: Array<{ id: string; firstName: string; surname: string }> = [];
  const captain = await createUserMember({
    email: 'kapitanka@branik.cz', firstName: 'Kristýna', lastName: 'Urbanová',
    clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
    jerseyNumber: 10, position: 'ÚT',
    teamRoles: [{ teamId: zenyA.id, role: TeamRole.PLAYER }],
  });
  zenyAPlayers.push({ id: captain.memberId, firstName: 'Kristýna', surname: 'Urbanová' });
  for (let i = 0; i < 15; i++) {
    const firstName = pick(GIRL_FIRST, i + 5);
    const surname = pick(FEM_SURNAMES, i + 7);
    const status =
      i === 13 ? MemberStatus.INACTIVE :   // dlouhodobé zranění
      i === 14 ? MemberStatus.ARCHIVED :   // ukončila kariéru
      MemberStatus.ACTIVE;
    const player = await createUserMember({
      email: `${firstName.toLowerCase()}.${surname.toLowerCase()}@zena.branik`,
      firstName, lastName: surname,
      clubId: branik.id, brandColor: brBrand, devHash, realPhoto: 'women',
      status, jerseyNumber: 3 + i, position: pick(['ÚT', 'ZÁL', 'OBR', 'BR'], i),
      teamRoles: [{ teamId: zenyA.id, role: TeamRole.PLAYER }],
    });
    if (status === MemberStatus.ACTIVE) zenyAPlayers.push({ id: player.memberId, firstName, surname });
  }

  // --- Eventy pro všech 5 ženských týmů (simulovaný rozpis) ---
  const zenyAEvents = await seedRichEvents({
    clubId: branik.id, teamId: zenyA.id, coachId: coachZenyA.memberId,
    playerIds: zenyAPlayers.map(p => p.id), label: 'Ženy A ABC Braník', venues: brVenues,
  });
  const wu15Events = await seedRichEvents({
    clubId: branik.id, teamId: wu15.id, coachId: coachWU15.memberId,
    playerIds: wu15Children.map(c => c.id), label: 'WU15 ABC Braník', venues: brVenues,
  });
  await seedRichEvents({
    clubId: branik.id, teamId: wu18.id, coachId: coachWU18.memberId,
    playerIds: wu18Children.map(c => c.id), label: 'WU18 ABC Braník', venues: brVenues,
  });
  await seedRichEvents({
    clubId: branik.id, teamId: wu13.id, coachId: coachWU13.memberId,
    playerIds: wu13Children.map(c => c.id), label: 'WU13 ABC Braník', venues: brVenues,
  });
  await seedRichEvents({
    clubId: branik.id, teamId: prip.id, coachId: coachPrip.memberId,
    playerIds: pripChildren.map(c => c.id), label: 'Přípravka ABC Braník', venues: brVenues,
  });

  // --- Přiřazení cvičení z knihovny do naplánovaných tréninků (simulováno) ---
  console.log('  🏋️  Plánování tréninků — cvičení z knihovny do slotů…');
  await assignDrillPlans(zenyA.id, 'women');
  await assignDrillPlans(wu18.id, 'youth');
  await assignDrillPlans(wu15.id, 'youth');
  await assignDrillPlans(wu13.id, 'youth');
  await assignDrillPlans(prip.id, 'mini');

  // --- Šablony opakujících se tréninků (simulovaný rozpis dle úrovně) ---
  await prisma.trainingTemplate.create({
    data: {
      clubId: branik.id, teamId: wu15.id,
      name: 'WU15 — Po + St 17:30 (Za mlýnem)',
      eventType: EventType.PRACTICE, daysOfWeek: [1, 3],
      startTime: '17:30', endTime: '19:00', location: brVenues.home,
      description: 'Pravidelný trénink WU15 (simulovaný rozpis).',
      validFrom: offset(-30), validUntil: offset(60), active: true,
      createdById: coachWU15.memberId,
    },
  });
  await prisma.trainingTemplate.create({
    data: {
      clubId: branik.id, teamId: zenyA.id,
      name: 'Ženy A — Út + Čt 19:00 (Za mlýnem)',
      eventType: EventType.PRACTICE, daysOfWeek: [2, 4],
      startTime: '19:00', endTime: '20:30', location: brVenues.home,
      description: 'Pravidelný trénink A-týmu žen (simulovaný rozpis).',
      validFrom: offset(-30), validUntil: offset(60), active: true,
      createdById: coachZenyA.memberId,
    },
  });

  // --- Poplatky + platby (simulováno, všechny PaymentStatus) ---
  const brFeeWU15 = await prisma.fee.create({
    data: {
      clubId: branik.id, teamId: wu15.id,
      name: 'Členský příspěvek — jaro 2026',
      description: 'Pololetní příspěvek WU15 (leden–červen)',
      amountCents: 300000, currency: 'CZK', dueDate: offset(-20),
    },
  });
  await prisma.fee.create({
    data: {
      clubId: branik.id, teamId: zenyA.id,
      name: 'Příspěvek Ženy A 2026',
      description: 'Roční příspěvek hráček A-týmu žen',
      amountCents: 400000, currency: 'CZK', dueDate: offset(35),
    },
  });
  const brStatuses: PaymentStatus[] = [
    PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.PROCESSING,
    PaymentStatus.FAILED, PaymentStatus.REFUNDED,
  ];
  for (let i = 0; i < 5; i++) {
    const child = wu15Children[i];
    if (!child) continue;
    const link = await prisma.guardianLink.findFirst({ where: { childId: child.id, isPrimary: true } });
    if (!link) continue;
    await prisma.payment.create({
      data: {
        clubId: branik.id, feeId: brFeeWU15.id,
        payerId: link.guardianId, onBehalfOfId: child.id,
        amountCents: 300000, currency: 'CZK', status: brStatuses[i]!,
        stripePaymentIntentId: brStatuses[i] === PaymentStatus.PAID ? `pi_demo_br_${i}` : null,
        paidAt: brStatuses[i] === PaymentStatus.PAID ? offset(-18) : null,
      },
    });
  }

  // --- Waivery + podpisy (simulováno) ---
  for (const w of [
    { type: WaiverType.GDPR,          title: 'Souhlas se zpracováním osobních údajů', body: 'Souhlasím se zpracováním osobních údajů hráčky ve smyslu GDPR.' },
    { type: WaiverType.MEDIA_CONSENT, title: 'Souhlas s focením a zveřejněním fotek',  body: 'Souhlasím s pořizováním a zveřejněním fotografií hráčky v týmovém rámci.' },
  ]) {
    const waiver = await prisma.waiver.create({
      data: { clubId: branik.id, title: w.title, body: w.body, version: 1, type: w.type, requiredForMinors: true },
    });
    for (let i = 0; i < 3; i++) {
      const child = wu15Children[i];
      if (!child) continue;
      const link = await prisma.guardianLink.findFirst({ where: { childId: child.id, isPrimary: true } });
      if (!link) continue;
      await prisma.waiverSignature.create({
        data: { waiverId: waiver.id, subjectId: child.id, signedById: link.guardianId, ipAddress: '10.0.3.' + (20 + i) },
      });
    }
  }

  // --- Konverzace (TEAM / COACHES / PARENTS / DM / ANNOUNCEMENT) ---
  const brTeamChat = await prisma.conversation.create({
    data: {
      clubId: branik.id, teamId: zenyA.id, type: ConversationType.TEAM,
      title: 'Ženy A — týmový chat',
      participants: { create: [
        { memberId: coachZenyA.memberId },
        ...zenyAPlayers.map(p => ({ memberId: p.id })),
      ] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: brTeamChat.id, senderId: coachZenyA.memberId, body: 'Holky, jarní část začíná! Trénink Út+Čt 19:00 na Za mlýnem. 💪', createdAt: offset(-9, 9) },
      { conversationId: brTeamChat.id, senderId: captain.memberId, body: 'Těšíme se! Kdo veze dresy na sobotu, napište mi.', createdAt: offset(-2, 19) },
    ],
  });

  const brCoachesChat = await prisma.conversation.create({
    data: {
      clubId: branik.id, type: ConversationType.COACHES,
      title: 'Trenéři ženských kategorií',
      participants: { create: [
        { memberId: coachZenyA.memberId },
        { memberId: coachWU18.memberId },
        { memberId: coachWU15.memberId },
        { memberId: coachWU13.memberId },
        { memberId: coachPrip.memberId },
        { memberId: patronB.memberId },
      ] },
    },
  });
  await prisma.message.create({
    data: { conversationId: brCoachesChat.id, senderId: coachZenyA.memberId, body: 'Sjednoťme si metodiku přechodu WU18 → Ženy A. Návrh pošlu do pátku.', createdAt: offset(-1, 21) },
  });

  const brParentsChat = await prisma.conversation.create({
    data: {
      clubId: branik.id, teamId: wu13.id, type: ConversationType.PARENTS,
      title: 'WU13 — rodiče',
      participants: { create: [{ memberId: ownerB.memberId }, { memberId: officeB.memberId }] },
    },
  });
  await prisma.message.create({
    data: { conversationId: brParentsChat.id, senderId: officeB.memberId, body: 'Milí rodiče, jarní rozpis WU13 je v kalendáři. Dotazy sem. ⚽', createdAt: offset(-6, 10) },
  });

  const brDm = await prisma.conversation.create({
    data: {
      clubId: branik.id, type: ConversationType.DM,
      participants: { create: [{ memberId: coachZenyA.memberId }, { memberId: captain.memberId }] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: brDm.id, senderId: coachZenyA.memberId, body: 'Kristýno, vezmeš kapitánskou pásku i na pohár?', createdAt: offset(-3, 18) },
      { conversationId: brDm.id, senderId: captain.memberId, body: 'Jasně, spolehni se! 🅰️', createdAt: offset(-3, 18, 12) },
    ],
  });

  const brAnnChat = await prisma.conversation.create({
    data: {
      clubId: branik.id, type: ConversationType.ANNOUNCEMENT,
      title: 'Klubová oznámení — ABC Braník dívky',
      participants: { create: [{ memberId: ownerB.memberId }, { memberId: officeB.memberId }, { memberId: patronB.memberId }] },
    },
  });
  await prisma.message.create({
    data: { conversationId: brAnnChat.id, senderId: patronB.memberId, body: '📢 Holky, vítejte v ABC Braník! Dívčí fotbal u nás roste — přiveď kamarádku na trénink nazkoušku zdarma. — Simona Necidová', createdAt: offset(-5, 9) },
  });

  // --- Notifikace ---
  const brSampleEvent = zenyAEvents.future[0]?.id ?? null;
  await prisma.notification.createMany({
    data: [
      { clubId: branik.id, memberId: ownerB.memberId,    type: NotificationType.EVENT_CREATED,    title: 'Nový zápas v kalendáři', body: 'Sobota — Ženy A', link: brSampleEvent ? `/admin/events/${brSampleEvent}` : null, read: false, createdAt: offset(-1, 8) },
      { clubId: branik.id, memberId: coachZenyA.memberId, type: NotificationType.RSVP_REMINDER,    title: '4 hráčky nepotvrdily účast', read: false, createdAt: offset(-1, 14) },
      { clubId: branik.id, memberId: coachZenyA.memberId, type: NotificationType.MESSAGE,          title: 'Nová zpráva v týmovém chatu', read: false, createdAt: offset(-1, 19) },
      { clubId: branik.id, memberId: ownerB.memberId,    type: NotificationType.PAYMENT_RECEIVED, title: 'Nová platba 3 000 Kč', body: 'Příspěvek WU15 — jaro 2026.', read: true, createdAt: offset(-18) },
      { clubId: branik.id, memberId: ownerB.memberId,    type: NotificationType.WAIVER_PENDING,   title: 'Souhlasy čekají na podpis', read: false, createdAt: offset(-2) },
      { clubId: branik.id, memberId: ownerB.memberId,    type: NotificationType.ANNOUNCEMENT,     title: 'Vítejte v Sport manageru!', read: true, createdAt: offset(-25) },
    ],
  });

  // --- Feature audit (platform admin zapnul Pro/platby Bráníku) ---
  await prisma.clubFeatureAudit.create({
    data: {
      clubId: branik.id,
      changedByUserId: platformAdmin.id,
      reason: 'ABC Braník upgradoval na Pro tarif (ženské kategorie + platby).',
      before: { features: { ...(branik.features as object), payments: false }, config: branik.config },
      after:  { features: branik.features, config: branik.config },
      changedAt: offset(-22),
    },
  });

  // ==========================================================================
  // EVENTS — every EventType + every HomeAway + multi-team
  // ==========================================================================

  console.log('  📅 Events (PRACTICE/MATCH/TOURNAMENT/MEETING/SOCIAL × HOME/AWAY/NEUTRAL)…');

  const u13Players = childMembersHvezda.map(c => c.id);
  const u15Players = u15Children.map(c => c.id);
  const u11Players = sokolChildren.map(c => c.id);

  const u13Events  = await seedRichEvents({ clubId: hvezda.id, teamId: u13.id, coachId: coachU13.memberId, playerIds: u13Players, label: 'U13 Hvězda' });
  const u15Events  = await seedRichEvents({ clubId: hvezda.id, teamId: u15.id, coachId: coachU15.memberId, playerIds: u15Players, label: 'U15 Hvězda' });
  const u11Events  = await seedRichEvents({ clubId: sokol.id, teamId: u11.id, coachId: tomasInSokol.id,    playerIds: u11Players, label: 'U11 Sokoli' });

  // ==========================================================================
  // TRAINING TEMPLATE + materialized events + 1 detached event
  // ==========================================================================

  console.log('  📋 Training template + detached event…');

  const tmpl = await prisma.trainingTemplate.create({
    data: {
      clubId: hvezda.id, teamId: u13.id,
      name: 'Pondělí + středa 17:30 (UMT Strahov)',
      eventType: EventType.PRACTICE,
      daysOfWeek: [1, 3], // Monday + Wednesday
      startTime: '17:30', endTime: '19:00',
      location: 'UMT Strahov',
      description: 'Pravidelný trénink U13.',
      validFrom: offset(-30),
      validUntil: offset(60),
      active: true,
      createdById: coachU13.memberId,
    },
  });

  // Pick one of the future U13 events and link it to template; mark another as detached
  if (u13Events.future[0]) {
    await prisma.event.update({
      where: { id: u13Events.future[0].id },
      data: { templateId: tmpl.id },
    });
  }
  if (u13Events.future[1]) {
    await prisma.event.update({
      where: { id: u13Events.future[1].id },
      data: { templateId: tmpl.id, detached: true }, // was from template, then detached
    });
  }

  // ==========================================================================
  // FEES + PAYMENTS — every PaymentStatus
  // ==========================================================================

  console.log('  💸 Fees + payments (all statuses)…');

  const feeJesen = await prisma.fee.create({
    data: {
      clubId: hvezda.id, teamId: u13.id,
      name: 'Členský příspěvek — podzim 2025',
      description: 'Čtvrtletní členský příspěvek (září–prosinec)',
      amountCents: 350000, currency: 'CZK',
      dueDate: offset(-30),
    },
  });

  const feeSoustred = await prisma.fee.create({
    data: {
      clubId: hvezda.id, teamId: u13.id,
      name: 'Soustředění Mariánské Lázně',
      description: 'Týdenní soustředění (29. 6. – 5. 7. 2026)',
      amountCents: 580000, currency: 'CZK',
      dueDate: offset(40),
    },
  });

  // Map first 5 children → 5 payment statuses
  const statuses: PaymentStatus[] = [
    PaymentStatus.PAID,
    PaymentStatus.PENDING,
    PaymentStatus.PROCESSING,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ];
  for (let i = 0; i < 5; i++) {
    const child = childMembersHvezda[i];
    if (!child) continue;
    // Find this child's primary parent (guardian)
    const guardianLink = await prisma.guardianLink.findFirst({
      where: { childId: child.id, isPrimary: true },
    });
    if (!guardianLink) continue;
    await prisma.payment.create({
      data: {
        clubId: hvezda.id, feeId: feeJesen.id,
        payerId: guardianLink.guardianId,
        onBehalfOfId: child.id,
        amountCents: 350000, currency: 'CZK',
        status: statuses[i]!,
        stripePaymentIntentId: statuses[i] === PaymentStatus.PAID ? `pi_demo_${i}` : null,
        paidAt: statuses[i] === PaymentStatus.PAID ? offset(-25) : null,
      },
    });
  }

  // ==========================================================================
  // WAIVERS — every WaiverType + signatures
  // ==========================================================================

  console.log('  📝 Waivers (GDPR/HEALTH/LIABILITY/MEDIA_CONSENT)…');

  const waiverTypes: Array<{ type: WaiverType; title: string; body: string }> = [
    { type: WaiverType.GDPR,          title: 'Souhlas se zpracováním osobních údajů', body: 'Souhlasím se zpracováním osobních údajů hráče ve smyslu GDPR.' },
    { type: WaiverType.HEALTH,        title: 'Prohlášení o zdravotní způsobilosti',   body: 'Prohlašuji, že hráč je zdravotně způsobilý k provozování sportu.' },
    { type: WaiverType.LIABILITY,     title: 'Prohlášení o odpovědnosti',              body: 'Beru na vědomí rizika spojená se sportovní činností.' },
    { type: WaiverType.MEDIA_CONSENT, title: 'Souhlas s focením a zveřejněním fotek',   body: 'Souhlasím s pořizováním a zveřejněním fotografií hráče v týmovém rámci.' },
  ];

  for (const w of waiverTypes) {
    const waiver = await prisma.waiver.create({
      data: {
        clubId: hvezda.id, title: w.title, body: w.body,
        version: 1, type: w.type, requiredForMinors: true,
      },
    });
    // Sign for first 3 children (by their primary guardian)
    for (let i = 0; i < 3; i++) {
      const child = childMembersHvezda[i];
      if (!child) continue;
      const link = await prisma.guardianLink.findFirst({ where: { childId: child.id, isPrimary: true } });
      if (!link) continue;
      await prisma.waiverSignature.create({
        data: {
          waiverId: waiver.id, subjectId: child.id, signedById: link.guardianId,
          ipAddress: '192.168.1.' + (10 + i),
        },
      });
    }
  }

  // ==========================================================================
  // CONVERSATIONS — every ConversationType
  // ==========================================================================

  console.log('  💬 Conversations (TEAM/COACHES/PARENTS/DM/GROUP/ANNOUNCEMENT)…');

  // 1. TEAM — U13 chat
  const teamChat = await prisma.conversation.create({
    data: {
      clubId: hvezda.id, teamId: u13.id, type: ConversationType.TEAM,
      title: 'U13 Strašnice — týmový chat',
      participants: { create: [
        ...childMembersHvezda.map(c => ({ memberId: c.id })),
        { memberId: coachU13.memberId },
        { memberId: assistantU13.memberId },
        { memberId: teamMgrU13.memberId },
        { memberId: medicU13.memberId },
        { memberId: adminH.memberId },
      ] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: teamChat.id, senderId: coachU13.memberId, body: 'Vítejte v sezóně 2025/26! 👋', createdAt: offset(-10, 9) },
      { conversationId: teamChat.id, senderId: coachU13.memberId, body: 'Připomínám zítra trénink 17:30 na Strahově. Vezměte si štulpny.', createdAt: offset(-2, 18) },
      { conversationId: teamChat.id, senderId: assistantU13.memberId, body: 'Pokud nestíháte přijít včas, dejte vědět. Děkuji!', createdAt: offset(-2, 19) },
    ],
  });

  // 2. COACHES — interní chat trenérů
  const coachesChat = await prisma.conversation.create({
    data: {
      clubId: hvezda.id, teamId: u13.id, type: ConversationType.COACHES,
      title: 'U13 — trenéři',
      participants: { create: [
        { memberId: coachU13.memberId },
        { memberId: assistantU13.memberId },
        { memberId: teamMgrU13.memberId },
      ] },
    },
  });
  await prisma.message.create({
    data: { conversationId: coachesChat.id, senderId: coachU13.memberId, body: 'Tohle vidíme jen my, trenéři. Pojďme probrat sestavu na sobotu.', createdAt: offset(-1, 22) },
  });

  // 3. PARENTS — chat rodičů
  const parentsChat = await prisma.conversation.create({
    data: {
      clubId: hvezda.id, teamId: u13.id, type: ConversationType.PARENTS,
      title: 'U13 — rodiče',
      participants: { create: [{ memberId: adminH.memberId }, { memberId: commsH.memberId }] },
    },
  });
  await prisma.message.create({
    data: { conversationId: parentsChat.id, senderId: commsH.memberId, body: 'Milí rodiče, podzimní rozpis je v kalendáři. Případné dotazy směřujte sem.', createdAt: offset(-7, 10) },
  });

  // 4. DM — Coach ↔ Mom (Dad NOT participant — privacy demo)
  const mom = await prisma.user.findUnique({ where: { email: 'parent@hvezda.cz' } });
  const momMember = mom ? await prisma.member.findFirst({ where: { userId: mom.id, clubId: hvezda.id } }) : null;
  if (momMember) {
    const dm = await prisma.conversation.create({
      data: {
        clubId: hvezda.id, type: ConversationType.DM,
        participants: { create: [{ memberId: coachU13.memberId }, { memberId: momMember.id }] },
      },
    });
    await prisma.message.createMany({
      data: [
        { conversationId: dm.id, senderId: coachU13.memberId, body: 'Dobrý den, paní Pekařová, jak je Aně po sobotě?', createdAt: offset(-3, 19) },
        { conversationId: dm.id, senderId: momMember.id, body: 'Dobrý den, díky — kotník už je lepší. Dnes byla u doktora.', createdAt: offset(-3, 20), editedAt: offset(-3, 20, 5) },
        // Soft-deleted message
        { conversationId: dm.id, senderId: momMember.id, body: '[smazáno]', createdAt: offset(-3, 20, 10), deletedAt: offset(-3, 20, 12) },
      ],
    });
  }

  // 5. GROUP — výjezd do Mariánských Lázní (subset rodičů)
  const groupChat = await prisma.conversation.create({
    data: {
      clubId: hvezda.id, type: ConversationType.GROUP,
      title: 'Soustředění M.L. — organizace',
      participants: { create: [
        { memberId: teamMgrU13.memberId },
        ...childMembersHvezda.slice(0, 4).map(async c => {
          const link = await prisma.guardianLink.findFirst({ where: { childId: c.id, isPrimary: true } });
          return link ? { memberId: link.guardianId } : null;
        }).filter(Boolean) as any[],
      ] },
    },
  }).catch(() => null);
  if (groupChat) {
    await prisma.message.create({
      data: { conversationId: groupChat.id, senderId: teamMgrU13.memberId, body: 'Posílám info k odjezdu — sraz v 7:00 na Strahově.', createdAt: offset(-4) },
    });
  }

  // 6. ANNOUNCEMENT — celoklubový broadcast
  const annChat = await prisma.conversation.create({
    data: {
      clubId: hvezda.id, type: ConversationType.ANNOUNCEMENT,
      title: 'Klubová oznámení',
      participants: { create: [
        { memberId: adminH.memberId },
        { memberId: commsH.memberId },
      ] },
    },
  });
  await prisma.message.create({
    data: { conversationId: annChat.id, senderId: commsH.memberId, body: '📢 Pozor: tento víkend od 9:00 brigáda na hřišti — všichni vítáni!', createdAt: offset(-5, 9) },
  });

  // Sokol team chat
  const sokolTeamConv = await prisma.conversation.create({
    data: {
      clubId: sokol.id, teamId: u11.id, type: ConversationType.TEAM,
      title: 'U11 Sokoli — týmový chat',
      participants: { create: [
        { memberId: tomasInSokol.id },
        ...sokolChildren.map(c => ({ memberId: c.id })),
      ] },
    },
  });
  await prisma.message.create({
    data: { conversationId: sokolTeamConv.id, senderId: tomasInSokol.id, body: 'Tak co, jste připraveni na první zápas sezóny? 🏑', createdAt: offset(-1, 17) },
  });

  // ==========================================================================
  // NOTIFICATIONS — every NotificationType
  // ==========================================================================

  console.log('  🔔 Notifications (all 10 types)…');

  const sampleEvent = u13Events.future[0]?.id ?? null;

  await prisma.notification.createMany({
    data: [
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.EVENT_CREATED,    title: 'Nový zápas v kalendáři', body: 'Sobota — Slavia U13', link: sampleEvent ? `/admin/events/${sampleEvent}` : null, read: false, createdAt: offset(-1, 8) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.EVENT_UPDATED,    title: 'Změna místa tréninku', body: 'Středeční trénink přesunut na UMT Tatran.', read: false, createdAt: offset(-1, 12) },
      { clubId: hvezda.id, memberId: coachU13.memberId,  type: NotificationType.EVENT_CANCELLED,  title: 'Zápas zrušen', body: 'Sobotní zápas zrušen kvůli počasí.', read: true,  createdAt: offset(-2) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.RSVP_REMINDER,    title: '3 hráči nepotvrdili účast', read: false, createdAt: offset(-1, 14) },
      { clubId: hvezda.id, memberId: coachU13.memberId,  type: NotificationType.MESSAGE,          title: 'Nová zpráva v U13 chatu',  read: false, createdAt: offset(-1, 19) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.PAYMENT_DUE,      title: '5 plateb po splatnosti',   read: false, createdAt: offset(-3) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.PAYMENT_RECEIVED, title: 'Nová platba 3 500 Kč', body: 'Platba za podzimní příspěvek došla.', read: true, createdAt: offset(-25) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.ANNOUNCEMENT,     title: 'Vítejte v Sport manageru!', read: true, createdAt: offset(-30) },
      { clubId: hvezda.id, memberId: adminH.memberId,    type: NotificationType.WAIVER_PENDING,   title: '2 souhlasy čekají na podpis', read: false, createdAt: offset(-2) },
      { clubId: hvezda.id, memberId: coachU13.memberId,  type: NotificationType.GENERAL,          title: 'Tipy pro nové trenéry',     body: 'Mrkni na náš onboarding průvodce.', read: false, createdAt: offset(-7) },
    ],
  });

  // ==========================================================================
  // CLUB FEATURE AUDIT — platform admin enabled payments for Hvězda
  // ==========================================================================

  console.log('  📊 Feature audit log…');

  await prisma.clubFeatureAudit.create({
    data: {
      clubId: hvezda.id,
      changedByUserId: platformAdmin.id,
      reason: 'Klub upgradoval na Pro tarif a požádal o aktivaci plateb.',
      before: { features: { ...(hvezda.features as object), payments: false }, config: hvezda.config },
      after:  { features: hvezda.features, config: hvezda.config },
      changedAt: offset(-15),
    },
  });

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  const counts = {
    clubs: await prisma.club.count(),
    users: await prisma.user.count(),
    members: await prisma.member.count(),
    teams: await prisma.team.count(),
    teamMemberships: await prisma.teamMembership.count(),
    clubRoles: await prisma.clubRole.count(),
    guardianLinks: await prisma.guardianLink.count(),
    events: await prisma.event.count(),
    eventAttendances: await prisma.eventAttendance.count(),
    trainingTemplates: await prisma.trainingTemplate.count(),
    fees: await prisma.fee.count(),
    payments: await prisma.payment.count(),
    waivers: await prisma.waiver.count(),
    waiverSignatures: await prisma.waiverSignature.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count(),
    pushTokens: await prisma.pushToken.count(),
    featureAudit: await prisma.clubFeatureAudit.count(),
  };

  console.log('\n✅ Seed complete:');
  console.table(counts);
  console.log('\n🔑 Login (heslo123 for all):');
  console.table([
    { email: 'admin@hvezda.cz',         name: 'Pavel Dvořák',     role: 'Hvězda OWNER + ADMIN + FINANCE' },
    { email: 'coach@hvezda.cz',         name: 'Miroslav Horák',   role: 'Hvězda U13 HEAD_COACH' },
    { email: 'parent@hvezda.cz',        name: 'Lucie Pekařová',   role: 'Hvězda parent (Mom of Anna — divorced)' },
    { email: 'petr.pekar@hvezda.cz',    name: 'Petr Pekař',       role: 'Hvězda parent (Dad — privacy: nevidí DM)' },
    { email: 'simon.assist@hvezda.cz',  name: 'Šimon Růžička',    role: 'multi-role: U15 PLAYER + U13 ASSISTANT_COACH' },
    { email: 'admin@sokoli.cz',         name: 'Jana Procházková', role: 'Sokol OWNER' },
    { email: 'tomas@example.com',       name: 'Tomáš Mertin',     role: 'multi-tenant: Hvězda parent + Sokol HEAD_COACH' },
    { email: 'admin@branik.cz',         name: 'Markéta Svobodová', role: 'ABC Braník OWNER+ADMIN+FINANCE (simulováno)' },
    { email: 'maly@abcbranik.cz',       name: 'Lukáš Malý',       role: 'ABC Braník šéftrenér žen + Ženy A HEAD_COACH (reálný)' },
    { email: 'kapitanka@branik.cz',     name: 'Kristýna Urbanová', role: 'ABC Braník Ženy A kapitánka (simulovaná hráčka)' },
    { email: 'platform@example.com',    name: 'Petr Platforma',   role: 'Platform admin' },
  ]);
}

// ============================================================================
// User + Member helper
// ============================================================================

type CreateUserMemberArgs = {
  email: string;
  firstName: string;
  lastName: string;
  clubId: string;
  devHash: string;
  brandColor?: string;
  status?: MemberStatus;
  isMinor?: boolean;
  jerseyNumber?: number;
  position?: string;
  clubRoles?: ClubRoleType[];
  teamRoles?: { teamId: string; role: TeamRole }[];
  /** Skutečná portrétní fotka daného pohlaví místo pravatar/dicebear (ABC Bráník). */
  realPhoto?: 'women' | 'men';
};

async function createUserMember(args: CreateUserMemberArgs) {
  const fullName = `${args.firstName} ${args.lastName}`;
  const user = await prisma.user.create({
    data: {
      email: args.email, passwordHash: args.devHash,
      firstName: args.firstName, lastName: args.lastName, locale: 'cs',
      avatarUrl: args.realPhoto
        ? photoUrl(args.email, args.realPhoto)
        : avatarUrl(args.email, args.isMinor ?? false),
    },
  });

  const member = await prisma.member.create({
    data: {
      userId: user.id, clubId: args.clubId,
      status: args.status ?? MemberStatus.ACTIVE,
      isMinor: args.isMinor ?? false,
      jerseyNumber: args.jerseyNumber,
      position: args.position,
    },
  });

  if (args.clubRoles?.length) {
    await prisma.clubRole.createMany({
      data: args.clubRoles.map(role => ({ memberId: member.id, role })),
    });
  }

  if (args.teamRoles?.length) {
    await prisma.teamMembership.createMany({
      data: args.teamRoles.map(tr => ({ memberId: member.id, teamId: tr.teamId, role: tr.role })),
    });
  }

  return { userId: user.id, memberId: member.id };
}

// ============================================================================
// Events helper — covers every EventType + every HomeAway
// ============================================================================

async function seedRichEvents(args: {
  clubId: string;
  teamId: string;
  coachId: string;
  playerIds: string[];
  label: string;
  venues?: { home: string; away: string; neutral: string; social?: string };
}) {
  const past: Array<{ id: string }> = [];
  const future: Array<{ id: string }> = [];
  const isHvezda = args.label.includes('Hvězda');
  const venueHome = args.venues?.home ?? (isHvezda ? 'UMT Strahov' : 'Sokolovna Měcholupy');
  const venueAway = args.venues?.away ?? (isHvezda ? 'Eden Aréna' : 'Hala TJ JM Chodov');
  const venueNeutral = args.venues?.neutral ?? 'Strahovský stadion';
  const venueSocial = args.venues?.social ?? 'Pizza Coloseum Strašnice';

  // Past trainings (PRACTICE, no homeAway)
  for (let d = -28; d <= -1; d += 4) {
    const ev = await prisma.event.create({
      data: {
        clubId: args.clubId, teamId: args.teamId, type: EventType.PRACTICE,
        title: `Trénink — ${args.label}`,
        startsAt: offset(d, 17, 30), endsAt: offset(d, 19, 0),
        location: venueHome, createdById: args.coachId,
      },
    });
    past.push({ id: ev.id });
  }

  // Past matches — HOME, AWAY, NEUTRAL
  const matchVariants = [
    { home: HomeAway.HOME,    location: venueHome,    title: `Liga — ${args.label} vs Sparta` },
    { home: HomeAway.AWAY,    location: venueAway,    title: `Liga — Bohemka vs ${args.label}` },
    { home: HomeAway.NEUTRAL, location: venueNeutral, title: `Pohárový zápas — ${args.label} vs Slavia` },
  ];
  for (let i = 0; i < matchVariants.length; i++) {
    const m = matchVariants[i]!;
    const dayOffset = -21 + i * 7;
    const ev = await prisma.event.create({
      data: {
        clubId: args.clubId, teamId: args.teamId, type: EventType.MATCH,
        title: m.title,
        startsAt: offset(dayOffset, 10, 0), endsAt: offset(dayOffset, 11, 30),
        location: m.location, opponent: 'Soupeř ' + i, homeAway: m.home,
        createdById: args.coachId,
      },
    });
    past.push({ id: ev.id });
  }

  // TOURNAMENT (past, weekend)
  const tournament = await prisma.event.create({
    data: {
      clubId: args.clubId, teamId: args.teamId, type: EventType.TOURNAMENT,
      title: `Podzimní turnaj — ${args.label}`,
      startsAt: offset(-14, 8, 0), endsAt: offset(-14, 17, 0),
      location: venueNeutral, opponent: 'Více soupeřů', homeAway: HomeAway.NEUTRAL,
      createdById: args.coachId,
    },
  });
  past.push({ id: tournament.id });

  // MEETING (past — schůze rodičů)
  const meeting = await prisma.event.create({
    data: {
      clubId: args.clubId, teamId: args.teamId, type: EventType.MEETING,
      title: `Schůzka rodičů — ${args.label}`,
      startsAt: offset(-10, 18, 0), endsAt: offset(-10, 19, 30),
      location: 'Klubovna', createdById: args.coachId,
    },
  });
  past.push({ id: meeting.id });

  // SOCIAL (future — týmové posezení)
  const social = await prisma.event.create({
    data: {
      clubId: args.clubId, teamId: args.teamId, type: EventType.SOCIAL,
      title: `Týmové posezení — ${args.label}`,
      startsAt: offset(20, 18, 0), endsAt: offset(20, 21, 0),
      location: venueSocial, createdById: args.coachId,
    },
  });
  future.push({ id: social.id });

  // Future trainings
  for (let d = 1; d <= 28; d += 4) {
    const ev = await prisma.event.create({
      data: {
        clubId: args.clubId, teamId: args.teamId, type: EventType.PRACTICE,
        title: `Trénink — ${args.label}`,
        startsAt: offset(d, 17, 30), endsAt: offset(d, 19, 0),
        location: venueHome, rsvpDeadline: offset(d, 12, 0),
        createdById: args.coachId,
      },
    });
    future.push({ id: ev.id });
  }

  // Future matches
  for (let i = 0; i < matchVariants.length; i++) {
    const m = matchVariants[i]!;
    const dayOffset = 7 + i * 7;
    const ev = await prisma.event.create({
      data: {
        clubId: args.clubId, teamId: args.teamId, type: EventType.MATCH,
        title: m.title.replace('Sparta', 'Slavia').replace('Bohemka', 'Sparta').replace('Slavia', 'Viktorka'),
        startsAt: offset(dayOffset, 10, 0), endsAt: offset(dayOffset, 11, 30),
        location: m.location, opponent: 'Budoucí soupeř ' + i, homeAway: m.home,
        rsvpDeadline: offset(dayOffset - 1, 18, 0),
        createdById: args.coachId,
      },
    });
    future.push({ id: ev.id });
  }

  // Attendance — every RSVPStatus
  const PAST_PATTERN: Array<{ status: RSVPStatus; attended: boolean | null }> = [
    { status: RSVPStatus.YES,   attended: true },
    { status: RSVPStatus.YES,   attended: false }, // RSVP'd yes but didn't show
    { status: RSVPStatus.NO,    attended: false },
    { status: RSVPStatus.MAYBE, attended: true },
    { status: RSVPStatus.PENDING, attended: false },
  ];
  const FUTURE_PATTERN: RSVPStatus[] = [RSVPStatus.YES, RSVPStatus.YES, RSVPStatus.MAYBE, RSVPStatus.NO, RSVPStatus.PENDING];

  for (const ev of past) {
    for (let i = 0; i < args.playerIds.length; i++) {
      const r = PAST_PATTERN[i % PAST_PATTERN.length]!;
      await prisma.eventAttendance.create({
        data: { eventId: ev.id, memberId: args.playerIds[i]!, respondedById: args.playerIds[i]!, status: r.status, attended: r.attended },
      });
    }
  }
  for (const ev of future) {
    for (let i = 0; i < args.playerIds.length; i++) {
      await prisma.eventAttendance.create({
        data: { eventId: ev.id, memberId: args.playerIds[i]!, respondedById: args.playerIds[i]!, status: FUTURE_PATTERN[i % FUTURE_PATTERN.length]! },
      });
    }
  }

  return { past, future };
}

// ============================================================================

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
