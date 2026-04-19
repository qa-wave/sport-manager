/**
 * Seed script — rich dev data set.
 *
 * Creates two clubs (ABC Braník + TJ Spartak Kbely) with realistic
 * rosters, events, conversations, fees, payments and waivers.
 *
 * DATA HYGIENE (important):
 *   - ABC Braník uses COMPLETELY FICTIONAL Czech names (no overlap with Spartak).
 *   - TJ Spartak Kbely uses the REAL roster scraped from Týmuj (27 players + 5 staff).
 *   - The ONLY cross-club person is Alex Mertin — our multi-tenant proof.
 *
 * Preserves architecturally-critical cases:
 *   (1) Multi-role user: Alex Mertin (16y) is PLAYER on U15 + U19 AND ASSISTANT_COACH on U9 Braník,
 *       and PLAYER on Spartak Kbely U9.
 *   (2) Divorced-parent privacy: Mom + Dad have different GuardianLink masks.
 *
 * Dev accounts (password "password" for all of them):
 *   - admin@example.com             (Jan Novák — Braník owner)
 *   - coach@example.com             (Martin Procházka — Braník head coach)
 *   - mom@example.com               (Lucie Pecková)
 *   - dad@example.com               (Tomáš Mertin)
 *   - alex@example.com              (Alex Mertin — multi-tenant)
 *   - admin@spartak-kbely.example.com  (Vít Mrkvička — Spartak owner)
 *   - platform@example.com          (SaaS platform admin — /platform-admin/*)
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
  RSVPStatus,
  TeamRole,
  WaiverType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEV_PASSWORD = 'password';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function d(iso: string) {
  return new Date(iso);
}

function future(daysFromNow: number, hour = 10) {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  dt.setHours(hour, 0, 0, 0);
  return dt;
}

function past(daysAgo: number, hour = 10) {
  return future(-daysAgo, hour);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding...');

  const devHash = await bcrypt.hash(DEV_PASSWORD, 12);

  await prisma.$executeRawUnsafe(`SET row_security = OFF`).catch(() => {});

  // ---------- Wipe ----------
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
  await prisma.guardianLink.deleteMany();
  await prisma.teamMembership.deleteMany();
  await prisma.clubRole.deleteMany();
  await prisma.member.deleteMany();
  await prisma.team.deleteMany();
  await prisma.session.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clubFeatureAudit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  // ==========================================================================
  //  CLUB 1 — ABC Braník (the main dev club — FICTIONAL NAMES ONLY)
  // ==========================================================================
  const club = await prisma.club.create({
    data: {
      slug: 'abc-branik',
      name: 'ABC Braník',
      country: 'CZ',
      timezone: 'Europe/Prague',
      // Per-tenant customization — Braník gets every module enabled and a
      // bumped `pro` tier. Demonstrates "everything on, large club".
      features: {
        messages: true,
        trainingTemplates: true,
        payments: true,
        notifications: true,
        waivers: true,
        calendar: true,
        gallery: false,
        springCup: false,
      },
      config: {
        tier: 'pro',
        limits: { maxMembers: 500, maxTeams: 20 },
      },
    },
  });

  // ---- Teams ----
  const [muziA, muziB, u19, u15, u12, u9, zeny, wu15] = await Promise.all([
    prisma.team.create({
      data: { clubId: club.id, name: 'Muži A', sport: 'football', ageGroup: 'Senior', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'Muži B', sport: 'football', ageGroup: 'Senior', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'U19', sport: 'football', ageGroup: 'U19', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'U15', sport: 'football', ageGroup: 'U15', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'U12', sport: 'football', ageGroup: 'U12', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'U9', sport: 'football', ageGroup: 'U9', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'Ženy', sport: 'football', ageGroup: 'Senior', season: '2025-26' },
    }),
    prisma.team.create({
      data: { clubId: club.id, name: 'WU15', sport: 'football', ageGroup: 'U15', season: '2025-26' },
    }),
  ]);

  // ---- Users (bulk) ----
  //
  // NAMING RULE: Everything under Braník uses fictional Czech names that DO NOT
  // appear in the real Spartak Kbely Týmuj roster. Only Alex Mertin crosses
  // clubs (intentionally, as multi-tenant proof).
  //
  // Banned surnames (reserved for Spartak): Danihelka, Donev, Hladík, Hrubý,
  // Korenčík(ová), Korovskyi, Křenek, Neuvirth, Niessner, Novák/Nováková,
  // Pecka, Pechar, Rajtr, Růžička, Slavata, Snihura, Tomašuk, Vávra, Velička,
  // Venhuda, Vomáčka, Zavoral, Žaba, Mrkvička, Stejskal, Frydrychová.
  // (Šimák and Váňa kept under Braník for dev-account stability; Spartak uses
  // its own real Šimák + Váňa as separate records with different emails.)
  const userDefs: Array<{
    key: string;
    email: string;
    firstName: string;
    lastName: string;
    dob?: string;
    pw?: boolean;
  }> = [
    // Staff & admin — dev accounts (DO NOT CHANGE emails/names the user logs in with)
    { key: 'admin',        email: 'admin@example.com',          firstName: 'Jan',       lastName: 'Novotný',     pw: true },
    { key: 'headCoach',    email: 'coach@example.com',          firstName: 'Martin',    lastName: 'Procházka',   pw: true },
    { key: 'assistCoach1', email: 'assistant1@example.com',     firstName: 'Petra',     lastName: 'Svobodová',   pw: true },
    { key: 'assistCoach2', email: 'assistant2@example.com',     firstName: 'Ondřej',    lastName: 'Beneš',       pw: true },
    { key: 'coachU9',      email: 'coach.u9@example.com',       firstName: 'Filip',     lastName: 'Dvořák',      pw: true },
    { key: 'teamMgr',      email: 'manager@example.com',        firstName: 'Eva',       lastName: 'Králová',     pw: true },
    { key: 'medic',        email: 'medic@example.com',          firstName: 'David',     lastName: 'Kučera',      pw: true },
    { key: 'commsMgr',     email: 'comms@example.com',          firstName: 'Zuzana',    lastName: 'Marková',     pw: true },

    // Parents (dev mom/dad + fictional supporting cast — NO Spartak surnames)
    { key: 'mom',          email: 'mom@example.com',            firstName: 'Lucie',     lastName: 'Pecková',     pw: true },
    { key: 'dad',          email: 'dad@example.com',            firstName: 'Tomáš',     lastName: 'Mertin',      pw: true },
    { key: 'parentAlena',  email: 'alena.dvorakova@example.com', firstName: 'Alena',    lastName: 'Dvořáková',   pw: true },
    { key: 'parentPavel',  email: 'pavel.horak@example.com',    firstName: 'Pavel',     lastName: 'Horák',       pw: true },
    { key: 'parentJirina', email: 'jirina.kovarova@example.com', firstName: 'Jiřina',   lastName: 'Kovářová',    pw: true },
    { key: 'parentRadek',  email: 'radek.novotny@example.com',  firstName: 'Radek',     lastName: 'Nový',        pw: true },
    { key: 'parentMarketa',email: 'marketa.bartosova@example.com', firstName: 'Markéta', lastName: 'Bartošová',  pw: true },
    { key: 'parentMichal', email: 'michal.cerny@example.com',   firstName: 'Michal',    lastName: 'Černý',       pw: true },

    // Players — fictional Czech kids' names. Alex is the only cross-club person.
    // Alex = 16y (born 2009), plays U15/U19, assists U9.
    { key: 'alex',     email: 'alex@example.com',               firstName: 'Alex',       lastName: 'Mertin',      dob: '2009-06-12', pw: true },

    // U19 player (born 2009)
    { key: 'vojta',    email: 'vojta.fiala@example.com',        firstName: 'Vojtěch',    lastName: 'Fiala',       dob: '2009-03-18' },

    // U15 players (born 2010-2012)
    { key: 'jakub',    email: 'jakub.dvorak@example.com',       firstName: 'Jakub',      lastName: 'Dvořák',      dob: '2011-05-20' },
    { key: 'tomasH',   email: 'tomas.horak@example.com',        firstName: 'Tomáš',      lastName: 'Horák',       dob: '2011-08-14' },
    { key: 'marek',    email: 'marek.kovar@example.com',        firstName: 'Marek',      lastName: 'Kovář',       dob: '2010-11-02' },
    { key: 'oliver',   email: 'oliver.pokorny@example.com',     firstName: 'Oliver',     lastName: 'Pokorný',     dob: '2012-01-27' },
    { key: 'matejC',   email: 'matej.cerny@example.com',        firstName: 'Matěj',      lastName: 'Černý',       dob: '2012-04-09' },

    // U12 players (born 2013-2014)
    { key: 'adela',    email: 'adela.bartosova@example.com',    firstName: 'Adéla',      lastName: 'Bartošová',   dob: '2013-09-25' },
    { key: 'eliska',   email: 'eliska.nova@example.com',        firstName: 'Eliška',     lastName: 'Nová',        dob: '2014-03-06' },
    { key: 'jonas',    email: 'jonas.pokorny@example.com',      firstName: 'Jonáš',      lastName: 'Pokorný',     dob: '2013-11-14' },

    // U9 players (born 2015-2017) — Matyáš Peroutka is Mom's son (our primary dev child)
    { key: 'matyasBr', email: 'matyas.peroutka@example.com',    firstName: 'Matyáš',     lastName: 'Peroutka',    dob: '2017-09-03' },
    { key: 'anicka',   email: 'anicka.kovarova@example.com',    firstName: 'Anička',     lastName: 'Kovářová',    dob: '2016-07-11' },
    { key: 'viktorie', email: 'viktorie.fialova@example.com',   firstName: 'Viktorie',   lastName: 'Fialová',     dob: '2016-12-18' },
    { key: 'kubik',    email: 'kubik.horak@example.com',        firstName: 'Kubík',      lastName: 'Horák',       dob: '2017-02-22' },
    { key: 'sarka',    email: 'sarka.cerna@example.com',        firstName: 'Šárka',      lastName: 'Černá',       dob: '2015-05-30' },
    { key: 'dominikP', email: 'dominik.prochazka@example.com',  firstName: 'Dominik',    lastName: 'Procházka',   dob: '2016-10-04' },

    // WU15 girls (born 2010-2012) — Tereza + Klára
    { key: 'tereza',   email: 'tereza.horakova@example.com',    firstName: 'Tereza',     lastName: 'Horáková',    dob: '2011-02-08' },
    { key: 'klara',    email: 'klara.mala@example.com',         firstName: 'Klára',      lastName: 'Malá',        dob: '2010-06-17' },

    // U19 second player — Albert (fictional)
    { key: 'albertCZ', email: 'albert.becvar@example.com',      firstName: 'Albert',     lastName: 'Bečvář',      dob: '2009-12-01' },
  ];

  const users: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const u of userDefs) {
    users[u.key] = await prisma.user.create({
      data: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: u.pw ? devHash : null,
        dateOfBirth: u.dob ? d(u.dob) : null,
      },
    });
  }

  // ---- Members (in ABC Braník) ----
  const members: Record<string, Awaited<ReturnType<typeof prisma.member.create>>> = {};
  const memberDefs: Array<{
    key: string;
    userKey: string;
    minor?: boolean;
    jersey?: number;
    pos?: string;
    medical?: string;
  }> = [
    // Staff
    { key: 'admin',        userKey: 'admin' },
    { key: 'headCoach',    userKey: 'headCoach' },
    { key: 'assistCoach1', userKey: 'assistCoach1' },
    { key: 'assistCoach2', userKey: 'assistCoach2' },
    { key: 'coachU9',      userKey: 'coachU9' },
    { key: 'teamMgr',      userKey: 'teamMgr' },
    { key: 'medic',        userKey: 'medic' },
    { key: 'commsMgr',     userKey: 'commsMgr' },
    // Parents
    { key: 'mom',           userKey: 'mom' },
    { key: 'dad',           userKey: 'dad' },
    { key: 'parentAlena',   userKey: 'parentAlena' },
    { key: 'parentPavel',   userKey: 'parentPavel' },
    { key: 'parentJirina',  userKey: 'parentJirina' },
    { key: 'parentRadek',   userKey: 'parentRadek' },
    { key: 'parentMarketa', userKey: 'parentMarketa' },
    { key: 'parentMichal',  userKey: 'parentMichal' },
    // Players (Alex, U19, U15, U12, U9, WU15)
    { key: 'alex',      userKey: 'alex',      jersey: 10, pos: 'AM',  minor: false },
    { key: 'vojta',     userKey: 'vojta',     jersey: 9,  pos: 'CF',  minor: false },
    { key: 'albertCZ',  userKey: 'albertCZ',  jersey: 1,  pos: 'GK',  minor: false },
    { key: 'jakub',     userKey: 'jakub',     jersey: 7,  pos: 'LW',  minor: true },
    { key: 'tomasH',    userKey: 'tomasH',    jersey: 8,  pos: 'CM',  minor: true },
    { key: 'marek',     userKey: 'marek',     jersey: 5,  pos: 'CB',  minor: true },
    { key: 'oliver',    userKey: 'oliver',    jersey: 11, pos: 'RW',  minor: true },
    { key: 'matejC',    userKey: 'matejC',    jersey: 4,  pos: 'DM',  minor: true },
    { key: 'adela',     userKey: 'adela',     jersey: 6,  pos: 'RB',  minor: true, medical: 'Astma — inhalátor před tréninkem.' },
    { key: 'eliska',    userKey: 'eliska',    jersey: 14, minor: true },
    { key: 'jonas',     userKey: 'jonas',     jersey: 2,  minor: true },
    { key: 'matyasBr',  userKey: 'matyasBr',  jersey: 7,  minor: true, medical: 'Potravinová alergie — arašídy. Adrenalinové pero v tašce.' },
    { key: 'anicka',    userKey: 'anicka',    jersey: 12, minor: true },
    { key: 'viktorie',  userKey: 'viktorie',  jersey: 13, minor: true },
    { key: 'kubik',     userKey: 'kubik',     jersey: 15, minor: true },
    { key: 'sarka',     userKey: 'sarka',     jersey: 16, minor: true },
    { key: 'dominikP',  userKey: 'dominikP',  jersey: 17, minor: true },
    { key: 'tereza',    userKey: 'tereza',    jersey: 3,  pos: 'LB',  minor: true },
    { key: 'klara',     userKey: 'klara',     jersey: 10, pos: 'CF',  minor: true },
  ];
  for (const m of memberDefs) {
    members[m.key] = await prisma.member.create({
      data: {
        userId: users[m.userKey]!.id,
        clubId: club.id,
        isMinor: m.minor ?? false,
        jerseyNumber: m.jersey,
        position: m.pos,
        medicalNotes: m.medical,
      },
    });
  }

  // ---- Club-level roles ----
  await prisma.clubRole.createMany({
    data: [
      { memberId: members.admin!.id, role: ClubRoleType.OWNER },
      { memberId: members.admin!.id, role: ClubRoleType.FINANCE },
      { memberId: members.admin!.id, role: ClubRoleType.ADMIN },
      { memberId: members.commsMgr!.id, role: ClubRoleType.COMMUNICATIONS },
    ],
  });

  // ---- Team memberships ----
  const tm = (memberId: string, teamId: string, role: TeamRole) => ({ memberId, teamId, role });
  await prisma.teamMembership.createMany({
    data: [
      // Muži A — coaching staff
      tm(members.headCoach!.id, muziA.id, TeamRole.HEAD_COACH),
      tm(members.medic!.id,     muziA.id, TeamRole.MEDIC),

      // U19 — Alex + Vojta + Albert (fictional) + staff
      tm(members.alex!.id,         u19.id, TeamRole.PLAYER),
      tm(members.vojta!.id,        u19.id, TeamRole.PLAYER),
      tm(members.albertCZ!.id,     u19.id, TeamRole.PLAYER),
      tm(members.headCoach!.id,    u19.id, TeamRole.HEAD_COACH),
      tm(members.assistCoach1!.id, u19.id, TeamRole.ASSISTANT_COACH),

      // U15 — Jakub, Tomáš H, Marek, Oliver, Matěj Č + Alex (multi-role)
      tm(members.jakub!.id,        u15.id, TeamRole.PLAYER),
      tm(members.tomasH!.id,       u15.id, TeamRole.PLAYER),
      tm(members.marek!.id,        u15.id, TeamRole.PLAYER),
      tm(members.oliver!.id,       u15.id, TeamRole.PLAYER),
      tm(members.matejC!.id,       u15.id, TeamRole.PLAYER),
      // (1) MULTI-ROLE: Alex is PLAYER on U15 AND ASSISTANT_COACH on U9
      tm(members.alex!.id,         u15.id, TeamRole.PLAYER),
      tm(members.assistCoach2!.id, u15.id, TeamRole.HEAD_COACH),

      // U12 — Adéla, Eliška, Jonáš
      tm(members.adela!.id,        u12.id, TeamRole.PLAYER),
      tm(members.eliska!.id,       u12.id, TeamRole.PLAYER),
      tm(members.jonas!.id,        u12.id, TeamRole.PLAYER),
      tm(members.teamMgr!.id,      u12.id, TeamRole.TEAM_MANAGER),

      // U9 — Matyáš P, Anička, Viktorie, Kubík, Šárka, Dominik
      tm(members.matyasBr!.id,     u9.id, TeamRole.PLAYER),
      tm(members.anicka!.id,       u9.id, TeamRole.PLAYER),
      tm(members.viktorie!.id,     u9.id, TeamRole.PLAYER),
      tm(members.kubik!.id,        u9.id, TeamRole.PLAYER),
      tm(members.sarka!.id,        u9.id, TeamRole.PLAYER),
      tm(members.dominikP!.id,     u9.id, TeamRole.PLAYER),
      tm(members.coachU9!.id,      u9.id, TeamRole.HEAD_COACH),
      // (1) MULTI-ROLE: Alex is ASSISTANT_COACH on U9
      tm(members.alex!.id,         u9.id, TeamRole.ASSISTANT_COACH),

      // WU15 — girls from U12+U15 who also play women's youth
      tm(members.adela!.id,        wu15.id, TeamRole.PLAYER),
      tm(members.tereza!.id,       wu15.id, TeamRole.PLAYER),
      tm(members.klara!.id,        wu15.id, TeamRole.PLAYER),
      tm(members.assistCoach1!.id, wu15.id, TeamRole.HEAD_COACH),
      tm(members.medic!.id,        wu15.id, TeamRole.MEDIC),
    ],
  });

  // ---- Guardian links ----
  const gl = (
    guardianId: string,
    childId: string,
    rel: GuardianRelationship,
    primary: boolean,
    perms: { pay: boolean; medical: boolean; waivers: boolean },
  ) => ({
    guardianId,
    childId,
    relationship: rel,
    isPrimary: primary,
    canViewSchedule: true,
    canRsvp: true,
    canViewPayments: perms.pay,
    canMakePayments: perms.pay,
    canViewMedical: perms.medical,
    canSignWaivers: perms.waivers,
    verifiedAt: new Date(),
  });

  await prisma.guardianLink.createMany({
    data: [
      // (2) DIVORCED-PARENT PRIVACY: Mom=full, Dad=schedule+RSVP only
      gl(members.mom!.id, members.matyasBr!.id, GuardianRelationship.PARENT, true,  { pay: true,  medical: true,  waivers: true }),
      gl(members.dad!.id, members.matyasBr!.id, GuardianRelationship.PARENT, false, { pay: false, medical: false, waivers: false }),

      // Fictional supporting families — normal full-permission guardian links
      gl(members.parentAlena!.id,   members.jakub!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentAlena!.id,   members.adela!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentPavel!.id,   members.tomasH!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentPavel!.id,   members.kubik!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentJirina!.id,  members.marek!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentJirina!.id,  members.anicka!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentRadek!.id,   members.oliver!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentRadek!.id,   members.jonas!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentMarketa!.id, members.eliska!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentMarketa!.id, members.tereza!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentMichal!.id,  members.matejC!.id,   GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      gl(members.parentMichal!.id,  members.sarka!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),

      // Staff-who-are-also-parents patterns
      // Petra (assistant coach) is Viktorie's mom
      gl(members.assistCoach1!.id,  members.viktorie!.id, GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      // Ondřej (assistant coach) is Dominik P.'s dad
      gl(members.assistCoach2!.id,  members.dominikP!.id, GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      // Zuzana (comms manager) is Vojtěch's mom
      gl(members.commsMgr!.id,      members.vojta!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      // Admin Jan is Albert Bečvář's dad
      gl(members.admin!.id,         members.albertCZ!.id, GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
      // Head coach Martin is Klára's dad
      gl(members.headCoach!.id,     members.klara!.id,    GuardianRelationship.PARENT, true, { pay: true, medical: true, waivers: true }),
    ],
  });

  // ---- Conversations ----
  const u9Chat = await prisma.conversation.create({
    data: {
      clubId: club.id, teamId: u9.id, type: ConversationType.TEAM,
      title: 'U9 — Týmový chat',
      participants: { create: [
        { memberId: members.mom!.id }, { memberId: members.dad!.id },
        { memberId: members.coachU9!.id }, { memberId: members.alex!.id },
        { memberId: members.parentJirina!.id }, { memberId: members.parentPavel!.id },
      ]},
    },
  });
  const u19Chat = await prisma.conversation.create({
    data: {
      clubId: club.id, teamId: u19.id, type: ConversationType.TEAM,
      title: 'U19 — Týmový chat',
      participants: { create: [
        { memberId: members.headCoach!.id }, { memberId: members.assistCoach1!.id },
        { memberId: members.alex!.id }, { memberId: members.vojta!.id },
        { memberId: members.albertCZ!.id }, { memberId: members.medic!.id },
      ]},
    },
  });
  const u15Chat = await prisma.conversation.create({
    data: {
      clubId: club.id, teamId: u15.id, type: ConversationType.TEAM,
      title: 'U15 — Týmový chat',
      participants: { create: [
        { memberId: members.assistCoach2!.id }, { memberId: members.teamMgr!.id },
        { memberId: members.jakub!.id }, { memberId: members.tomasH!.id },
        { memberId: members.parentAlena!.id }, { memberId: members.parentPavel!.id },
        { memberId: members.parentJirina!.id },
      ]},
    },
  });
  const wu15Chat = await prisma.conversation.create({
    data: {
      clubId: club.id, teamId: wu15.id, type: ConversationType.TEAM,
      title: 'WU15 — Týmový chat',
      participants: { create: [
        { memberId: members.assistCoach1!.id }, { memberId: members.tereza!.id },
        { memberId: members.klara!.id }, { memberId: members.adela!.id },
        { memberId: members.parentMarketa!.id }, { memberId: members.medic!.id },
      ]},
    },
  });
  // Coach-only channel
  const coachesChannel = await prisma.conversation.create({
    data: {
      clubId: club.id, type: ConversationType.COACHES,
      title: 'Trenérský kanál',
      participants: { create: [
        { memberId: members.headCoach!.id }, { memberId: members.assistCoach1!.id },
        { memberId: members.assistCoach2!.id }, { memberId: members.coachU9!.id },
        { memberId: members.admin!.id },
      ]},
    },
  });
  // PRIVATE DMs — Dad CANNOT see the Coach↔Mom DM
  const coachMomDm = await prisma.conversation.create({
    data: {
      clubId: club.id, type: ConversationType.DM,
      title: 'Trenér Dvořák & Lucie',
      participants: { create: [
        { memberId: members.coachU9!.id }, { memberId: members.mom!.id },
      ]},
    },
  });
  const adminCoachDm = await prisma.conversation.create({
    data: {
      clubId: club.id, type: ConversationType.DM,
      title: 'Jan & Martin',
      participants: { create: [
        { memberId: members.admin!.id }, { memberId: members.headCoach!.id },
      ]},
    },
  });
  // Club-wide announcement
  const announcements = await prisma.conversation.create({
    data: {
      clubId: club.id, type: ConversationType.ANNOUNCEMENT,
      title: 'Klubové oznámení',
      participants: { create: [
        { memberId: members.admin!.id }, { memberId: members.commsMgr!.id },
        { memberId: members.headCoach!.id }, { memberId: members.assistCoach1!.id },
        { memberId: members.assistCoach2!.id }, { memberId: members.mom!.id },
        { memberId: members.dad!.id }, { memberId: members.parentAlena!.id },
        { memberId: members.parentPavel!.id }, { memberId: members.parentJirina!.id },
        { memberId: members.parentRadek!.id }, { memberId: members.parentMarketa!.id },
        { memberId: members.parentMichal!.id },
      ]},
    },
  });

  // ---- Messages ----
  await prisma.message.createMany({
    data: [
      { conversationId: u9Chat.id, senderId: members.coachU9!.id, body: 'Připomínka: sobotní zápas začíná v 10:00. Doražte prosím do 9:30.', createdAt: past(3, 18) },
      { conversationId: u9Chat.id, senderId: members.mom!.id, body: 'Matyáš tam bude! Má si vzít vlastní pití, nebo bude k dispozici?', createdAt: past(3, 19) },
      { conversationId: u9Chat.id, senderId: members.coachU9!.id, body: 'Vezměte si vlastní lahve s vodou. O poločase budou pomeranče.', createdAt: past(3, 19) },
      { conversationId: u9Chat.id, senderId: members.alex!.id, body: 'Můžu přijít dřív a pomoct s kužely, trenére.', createdAt: past(2, 20) },
      { conversationId: u9Chat.id, senderId: members.coachU9!.id, body: 'To by bylo super, díky Alexi!', createdAt: past(2, 20) },

      { conversationId: u19Chat.id, senderId: members.headCoach!.id, body: 'Čtvrteční trénink zrušen kvůli podmáčenému hřišti. Místo toho posilovna v 17:00.', createdAt: past(5, 16) },
      { conversationId: u19Chat.id, senderId: members.alex!.id, body: 'Jasně, vezmu si sálovky.', createdAt: past(5, 17) },
      { conversationId: u19Chat.id, senderId: members.vojta!.id, body: 'Můžu vzít kamaráda do posilovny? Přemýšlí, že se přidá ke klubu.', createdAt: past(5, 17) },
      { conversationId: u19Chat.id, senderId: members.headCoach!.id, body: 'Jasně, Vojto, čím víc tím líp. Ať vyplní hostovský souhlas.', createdAt: past(5, 18) },

      { conversationId: u15Chat.id, senderId: members.assistCoach2!.id, body: 'Sestava na neděli: Jakub LW, Tomáš CM, Marek CB. Kompletní soupiska v příloze.', createdAt: past(1, 10) },
      { conversationId: u15Chat.id, senderId: members.parentAlena!.id, body: 'Jakub se těší, díky trenére!', createdAt: past(1, 11) },
      { conversationId: u15Chat.id, senderId: members.teamMgr!.id, body: 'Dresy jsou vyprané a sbalené. Budu tam v 8:30 na přípravu.', createdAt: past(1, 12) },

      { conversationId: wu15Chat.id, senderId: members.assistCoach1!.id, body: 'Holky, los soutěže je venku. Začínáme venku proti FK Slavoj Vyšehrad 25.', createdAt: past(7, 14) },
      { conversationId: wu15Chat.id, senderId: members.tereza!.id, body: 'Super!! Už se nemůžu dočkat!', createdAt: past(7, 15) },
      { conversationId: wu15Chat.id, senderId: members.klara!.id, body: 'Bude autobus, nebo vezou rodiče?', createdAt: past(7, 16) },
      { conversationId: wu15Chat.id, senderId: members.assistCoach1!.id, body: 'Zatím rodiče. Sdílení jízd najdete v aplikaci v sekci Události.', createdAt: past(7, 16) },

      { conversationId: coachMomDm.id, senderId: members.coachU9!.id, body: 'Rychlá poznámka k Matyášově alergii — můžete potvrdit, že má léky v tašce na sobotu?', createdAt: past(4, 9) },
      { conversationId: coachMomDm.id, senderId: members.mom!.id, body: 'Ano, adrenalinové pero je v přední kapse. Záložní jsem dala do lékárničky, kterou jste mi dal.', createdAt: past(4, 10) },
      { conversationId: coachMomDm.id, senderId: members.coachU9!.id, body: 'Výborně, děkuji Lucie.', createdAt: past(4, 10) },

      { conversationId: adminCoachDm.id, senderId: members.admin!.id, body: 'Martine, musíme probrat rozpočet na příští sezónu. Můžeš dát dohromady seznam vybavení?', createdAt: past(10, 11) },
      { conversationId: adminCoachDm.id, senderId: members.headCoach!.id, body: 'Pracuji na tom. Měl bych to mít do konce týdne. Potřebujeme nové rozlišováky a aspoň 20 míčů.', createdAt: past(10, 14) },
      { conversationId: adminCoachDm.id, senderId: members.admin!.id, body: 'Jasně. Podívám se na stav účtu.', createdAt: past(9, 9) },

      { conversationId: coachesChannel.id, senderId: members.headCoach!.id, body: 'Info pro tým: hřiště 1 a 2 se od pondělí renovují. Dva týdny používejte hřiště 3 a 4.', createdAt: past(6, 8) },
      { conversationId: coachesChannel.id, senderId: members.assistCoach1!.id, body: 'Jasně. Aktualizuji rozvrh tréninků WU15.', createdAt: past(6, 9) },
      { conversationId: coachesChannel.id, senderId: members.assistCoach2!.id, body: 'Stejně tak pro U15. Dnes pošlu rodičům aktualizované lokace.', createdAt: past(6, 9) },

      { conversationId: announcements.id, senderId: members.admin!.id, body: 'Klubové grilování — sobota 24. května, 13:00 ve Sportovním areálu Braník. Všechny rodiny vítány!', createdAt: past(14, 10) },
      { conversationId: announcements.id, senderId: members.commsMgr!.id, body: 'Registrace na sezónu 2026-27 se otevírá 1. června. Sleva 10 % pro stávající členy, kteří se registrují do 15. června.', createdAt: past(8, 10) },
      { conversationId: announcements.id, senderId: members.admin!.id, body: 'Připomínka: všechny neuhrazené příspěvky musí být zaplaceny do konce dubna. Zkontrolujte sekci Platby v aplikaci.', createdAt: past(2, 10) },
    ],
  });

  // ---- Fees ----
  const [feeU9, feeU15, feeU19, feeWU15, feeClub] = await Promise.all([
    prisma.fee.create({ data: { clubId: club.id, teamId: u9.id,  name: 'U9 Sezónní příspěvek 2025-26',  amountCents: 600000, currency: 'CZK', dueDate: d('2026-09-01') } }),
    prisma.fee.create({ data: { clubId: club.id, teamId: u15.id, name: 'U15 Sezónní příspěvek 2025-26', amountCents: 800000, currency: 'CZK', dueDate: d('2026-09-01') } }),
    prisma.fee.create({ data: { clubId: club.id, teamId: u19.id, name: 'U19 Sezónní příspěvek 2025-26', amountCents: 1000000, currency: 'CZK', dueDate: d('2026-09-01') } }),
    prisma.fee.create({ data: { clubId: club.id, teamId: wu15.id,name: 'WU15 Sezónní příspěvek',        amountCents: 700000, currency: 'CZK', dueDate: d('2026-09-01') } }),
    prisma.fee.create({ data: { clubId: club.id,                 name: 'Roční klubový příspěvek', description: 'Pojištění + přístup k zázemí', amountCents: 200000, currency: 'CZK', dueDate: d('2026-06-01') } }),
  ]);

  // ---- Payments (mix of PAID, PENDING, FAILED) ----
  const pay = (feeId: string, payerId: string, onBehalfOfId: string | null, status: 'PAID' | 'PENDING' | 'PROCESSING' | 'FAILED', amountCents: number) => ({
    clubId: club.id, feeId, payerId, onBehalfOfId, amountCents, currency: 'CZK', status: status as any,
    paidAt: status === 'PAID' ? past(Math.floor(Math.random() * 30)) : null,
  });
  await prisma.payment.createMany({
    data: [
      // U9 fee
      pay(feeU9.id, members.mom!.id, members.matyasBr!.id, 'PAID', 600000),
      pay(feeU9.id, members.parentPavel!.id, members.kubik!.id, 'PAID', 600000),
      pay(feeU9.id, members.parentJirina!.id, members.anicka!.id, 'PAID', 600000),
      pay(feeU9.id, members.dad!.id, null, 'PENDING', 600000), // Dad hasn't paid his share

      // U15 fee
      pay(feeU15.id, members.parentAlena!.id, members.jakub!.id, 'PAID', 800000),
      pay(feeU15.id, members.parentPavel!.id, members.tomasH!.id, 'PAID', 800000),
      pay(feeU15.id, members.parentJirina!.id, members.marek!.id, 'PENDING', 800000),
      pay(feeU15.id, members.parentRadek!.id, members.oliver!.id, 'PAID', 800000),

      // U19 fee
      pay(feeU19.id, members.alex!.id, null, 'PAID', 1000000), // Alex is 16, pays his own
      pay(feeU19.id, members.admin!.id, members.albertCZ!.id, 'PAID', 1000000),
      pay(feeU19.id, members.commsMgr!.id, members.vojta!.id, 'PAID', 1000000),

      // WU15
      pay(feeWU15.id, members.parentMarketa!.id, members.tereza!.id, 'PAID', 700000),
      pay(feeWU15.id, members.headCoach!.id, members.klara!.id, 'PAID', 700000),
      pay(feeWU15.id, members.parentAlena!.id, members.adela!.id, 'FAILED', 700000), // card declined

      // Club membership fee
      pay(feeClub.id, members.parentAlena!.id, null, 'PAID', 200000),
      pay(feeClub.id, members.parentPavel!.id, null, 'PAID', 200000),
      pay(feeClub.id, members.parentJirina!.id, null, 'PAID', 200000),
      pay(feeClub.id, members.parentRadek!.id, null, 'PENDING', 200000),
      pay(feeClub.id, members.parentMarketa!.id, null, 'PENDING', 200000),
      pay(feeClub.id, members.parentMichal!.id, null, 'PAID', 200000),
    ],
  });

  // ---- Events (past + upcoming) ----
  const evt = (
    teamId: string | null, type: EventType, title: string, start: Date, end: Date,
    loc: string, extra?: { opponent?: string; homeAway?: HomeAway; desc?: string },
  ) => ({
    clubId: club.id, teamId, type, title, description: extra?.desc,
    startsAt: start, endsAt: end, location: loc, opponent: extra?.opponent,
    homeAway: extra?.homeAway, createdById: members.headCoach!.id,
  });

  const events = await Promise.all([
    // Past events
    prisma.event.create({ data: evt(u9.id,  EventType.MATCH, 'ABC Braník vs SK Dolní Chabry', past(7, 10), past(7, 11), 'Braník - UMT 1 (105x61m)', { opponent: 'SK Dolní Chabry', homeAway: HomeAway.HOME }) }),
    prisma.event.create({ data: evt(u19.id, EventType.PRACTICE, 'U19 Posilovna', past(5, 17), past(5, 19), 'Sportovní areál Braník, Hřiště 2') }),
    prisma.event.create({ data: evt(u15.id, EventType.MATCH, 'FK Meteor B vs ABC Braník', past(3, 14), past(3, 16), 'Stadion Dolní Chabry', { opponent: 'FK Meteor Praha B', homeAway: HomeAway.AWAY }) }),

    // Upcoming events
    prisma.event.create({ data: evt(u9.id,  EventType.PRACTICE, 'U9 Trénink',  future(1, 17), future(1, 18), 'Sportovní areál Braník, Hřiště 2') }),
    prisma.event.create({ data: evt(u19.id, EventType.MATCH,    'ABC Braník vs FK Admira Praha', future(3, 15), future(3, 17), 'Braník - UMT 1 (105x61m)', { opponent: 'FK Admira Praha', homeAway: HomeAway.HOME }) }),
    prisma.event.create({ data: evt(u15.id, EventType.PRACTICE, 'U15 Trénink', future(2, 17), future(2, 18), 'Sportovní areál Braník, Hřiště 2') }),
    prisma.event.create({ data: evt(wu15.id,EventType.MATCH,    'WU15 vs FK Slavoj Vyšehrad', future(5, 14), future(5, 16), 'Hřiště FK Slavoj Vyšehrad', { opponent: 'FK Slavoj Vyšehrad', homeAway: HomeAway.AWAY }) }),
    prisma.event.create({ data: evt(u12.id, EventType.PRACTICE, 'U12 Trénink', future(1, 16), future(1, 17), 'Sportovní areál Braník, Hřiště 2') }),
    prisma.event.create({ data: evt(null,   EventType.SOCIAL,   'Klubové grilování', future(14, 13), future(14, 17), 'Sportovní areál Braník', { desc: 'Všechny rodiny vítány! Grilování, nápoje a turnaj v malém fotbale.' }) }),
    prisma.event.create({ data: evt(null,   EventType.MEETING,  'Valná hromada', future(21, 19), future(21, 21), 'Klubovna ABC Braník', { desc: 'Shrnutí sezóny, finance, volby výboru. Účast všech členů vítána.' }) }),
    prisma.event.create({ data: evt(u12.id, EventType.TOURNAMENT, 'Jarní pohár — U12', future(10, 9), future(10, 16), 'Stadion FK Dukla Praha', { desc: 'Turnaj 8 týmů, každý s každým. Vezměte si svačinu.' }) }),
    prisma.event.create({ data: evt(u9.id,  EventType.MATCH,    'ABC Braník vs TJ Praga', future(8, 10), future(8, 11), 'Stadion TJ Praga', { opponent: 'TJ Praga', homeAway: HomeAway.AWAY }) }),
  ]);

  // ---- RSVPs (for upcoming events) ----
  const rsvps: Array<{ eventId: string; memberId: string; respondedById: string; status: RSVPStatus; note?: string }> = [];
  const upcoming = events.slice(3);

  // U9 Training — Matyáš YES (mom), Kubík MAYBE, Anička YES
  rsvps.push({ eventId: upcoming[0]!.id, memberId: members.matyasBr!.id, respondedById: members.mom!.id, status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[0]!.id, memberId: members.kubik!.id, respondedById: members.parentPavel!.id, status: RSVPStatus.MAYBE, note: 'Závisí na pracovním rozvrhu' });
  rsvps.push({ eventId: upcoming[0]!.id, memberId: members.anicka!.id, respondedById: members.parentJirina!.id, status: RSVPStatus.YES });

  // U19 Match — Alex YES, Albert YES, Vojta MAYBE
  rsvps.push({ eventId: upcoming[1]!.id, memberId: members.alex!.id,     respondedById: members.alex!.id,     status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[1]!.id, memberId: members.albertCZ!.id, respondedById: members.admin!.id,    status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[1]!.id, memberId: members.vojta!.id,    respondedById: members.commsMgr!.id, status: RSVPStatus.MAYBE, note: 'Možná škola' });

  // U15 Training — Jakub YES, Tomáš H YES, Marek NO (vacation)
  rsvps.push({ eventId: upcoming[2]!.id, memberId: members.jakub!.id,  respondedById: members.parentAlena!.id, status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[2]!.id, memberId: members.tomasH!.id, respondedById: members.parentPavel!.id, status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[2]!.id, memberId: members.marek!.id,  respondedById: members.parentJirina!.id, status: RSVPStatus.NO, note: 'Rodinná dovolená' });

  // WU15 Match — Tereza YES, Klára YES, Adéla MAYBE
  rsvps.push({ eventId: upcoming[3]!.id, memberId: members.tereza!.id, respondedById: members.parentMarketa!.id, status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[3]!.id, memberId: members.klara!.id,  respondedById: members.headCoach!.id,     status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[3]!.id, memberId: members.adela!.id,  respondedById: members.parentAlena!.id,   status: RSVPStatus.MAYBE, note: 'Může kolidovat s U12' });

  // Klubové grilování — various
  rsvps.push({ eventId: upcoming[5]!.id, memberId: members.admin!.id,        respondedById: members.admin!.id,        status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[5]!.id, memberId: members.headCoach!.id,    respondedById: members.headCoach!.id,    status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[5]!.id, memberId: members.mom!.id,          respondedById: members.mom!.id,          status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[5]!.id, memberId: members.parentAlena!.id,  respondedById: members.parentAlena!.id,  status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[5]!.id, memberId: members.parentMarketa!.id,respondedById: members.parentMarketa!.id,status: RSVPStatus.MAYBE });

  // Jarní pohár — U12 players
  rsvps.push({ eventId: upcoming[7]!.id, memberId: members.adela!.id,  respondedById: members.parentAlena!.id,   status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[7]!.id, memberId: members.eliska!.id, respondedById: members.parentMarketa!.id, status: RSVPStatus.YES });
  rsvps.push({ eventId: upcoming[7]!.id, memberId: members.jonas!.id,  respondedById: members.parentRadek!.id,   status: RSVPStatus.YES });

  await prisma.eventAttendance.createMany({ data: rsvps });

  // ---- Waivers ----
  const [gdpr, health, media, liability] = await Promise.all([
    prisma.waiver.create({ data: { clubId: club.id, title: 'Souhlas GDPR',              body: 'Souhlasím se zpracováním osobních údajů pro provoz klubu, včetně kontaktování zákonných zástupců, správy soupisek a zveřejňování výsledků zápasů.', type: WaiverType.GDPR } }),
    prisma.waiver.create({ data: { clubId: club.id, title: 'Zdravotní prohlášení',       body: 'Prohlašuji, že výše uvedený hráč je v dobrém zdravotním stavu a je způsobilý k účasti na fotbalovém tréninku a soutěžních zápasech. Případné zdravotní potíže jsou uvedeny v sekci zdravotních poznámek.', type: WaiverType.HEALTH } }),
    prisma.waiver.create({ data: { clubId: club.id, title: 'Souhlas s focením',          body: 'Souhlasím s pořizováním fotografií a videí mého dítěte během klubových aktivit a jejich zveřejněním na webových stránkách klubu a sociálních sítích pro propagační účely.', type: WaiverType.MEDIA_CONSENT } }),
    prisma.waiver.create({ data: { clubId: club.id, title: 'Prohlášení o odpovědnosti',  body: 'Beru na vědomí rizika spojená s účastí ve fotbale a souhlasím se zproštěním ABC Braník odpovědnosti za zranění vzniklá během tréninků a zápasů.', type: WaiverType.LIABILITY } }),
  ]);

  const waiverSigs: Array<{ waiverId: string; subjectId: string; signedById: string }> = [];
  const sigAllWaivers = (subjectId: string, signerId: string) => {
    for (const w of [gdpr, health, media, liability]) {
      waiverSigs.push({ waiverId: w.id, subjectId, signedById: signerId });
    }
  };
  // Most parents sign all waivers for their kids
  sigAllWaivers(members.matyasBr!.id, members.mom!.id);
  sigAllWaivers(members.jakub!.id,    members.parentAlena!.id);
  sigAllWaivers(members.adela!.id,    members.parentAlena!.id);
  sigAllWaivers(members.tomasH!.id,   members.parentPavel!.id);
  sigAllWaivers(members.kubik!.id,    members.parentPavel!.id);
  sigAllWaivers(members.marek!.id,    members.parentJirina!.id);
  sigAllWaivers(members.anicka!.id,   members.parentJirina!.id);
  sigAllWaivers(members.oliver!.id,   members.parentRadek!.id);
  sigAllWaivers(members.jonas!.id,    members.parentRadek!.id);
  sigAllWaivers(members.eliska!.id,   members.parentMarketa!.id);
  sigAllWaivers(members.tereza!.id,   members.parentMarketa!.id);
  sigAllWaivers(members.matejC!.id,   members.parentMichal!.id);
  sigAllWaivers(members.sarka!.id,    members.parentMichal!.id);
  sigAllWaivers(members.viktorie!.id, members.assistCoach1!.id);
  sigAllWaivers(members.dominikP!.id, members.assistCoach2!.id);
  sigAllWaivers(members.vojta!.id,    members.commsMgr!.id);
  sigAllWaivers(members.albertCZ!.id, members.admin!.id);
  sigAllWaivers(members.klara!.id,    members.headCoach!.id);
  // Matyáš Peroutka (dad's side) — only GDPR + health signed by mom, dad refuses media/liability
  // (documented path — already covered above by sigAllWaivers on matyasBr)
  // We'll leave Šárka WITHOUT media consent to show a pending state:
  // — Handled below by removing one specific signature
  waiverSigs.pop(); // drop one of Klára's sigs to create variety — but actually we want klara full. Re-add:
  waiverSigs.push({ waiverId: liability.id, subjectId: members.klara!.id, signedById: members.headCoach!.id });
  // Create an intentional onboarding-gap for Dominik P: remove his media consent
  const idxDominikMedia = waiverSigs.findIndex(
    (s) => s.subjectId === members.dominikP!.id && s.waiverId === media.id,
  );
  if (idxDominikMedia >= 0) waiverSigs.splice(idxDominikMedia, 1);

  await prisma.waiverSignature.createMany({ data: waiverSigs });

  // ==========================================================================
  //  TRAINING TEMPLATES for U9 Braník (MVP demo)
  // ==========================================================================
  const tz = 'Europe/Prague';
  const seedValidFrom = new Date(); seedValidFrom.setHours(0, 0, 0, 0);
  const seedValidUntil = new Date(); seedValidUntil.setDate(seedValidUntil.getDate() + 90); seedValidUntil.setHours(23, 59, 0, 0);

  function tzOffsetMsForSeed(utcMs: number, zone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = dtf.formatToParts(new Date(utcMs));
    const lookup: Record<string, string> = {};
    for (const p of parts) if (p.type !== 'literal') lookup[p.type] = p.value;
    const hour = lookup.hour === '24' ? 0 : Number(lookup.hour);
    const local = Date.UTC(
      Number(lookup.year), Number(lookup.month) - 1, Number(lookup.day),
      hour, Number(lookup.minute), Number(lookup.second),
    );
    return local - utcMs;
  }
  function zonedToUtcForSeed(y: number, m: number, day: number, hh: number, mm: number, zone: string): Date {
    const naive = Date.UTC(y, m, day, hh, mm, 0, 0);
    let offset = tzOffsetMsForSeed(naive, zone);
    let utc = naive - offset;
    const offset2 = tzOffsetMsForSeed(utc, zone);
    if (offset2 !== offset) { utc = naive - offset2; }
    return new Date(utc);
  }
  function localDayOfWeekForSeed(utc: Date, zone: string): number {
    const w = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short' }).format(utc);
    return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[w] ?? 0;
  }
  function localPartsForSeed(utc: Date, zone: string): { y: number; m: number; d: number } {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = dtf.formatToParts(utc);
    const l: Record<string, string> = {};
    for (const p of parts) if (p.type !== 'literal') l[p.type] = p.value;
    return { y: Number(l.year), m: Number(l.month) - 1, d: Number(l.day) };
  }

  const templates = [
    {
      key: 'umt',
      name: 'U9 UMT úterý + čtvrtek',
      daysOfWeek: [2, 4],
      startTime: '16:30',
      endTime: '18:00',
      location: 'Sportovní areál Braník, UMT 2',
    },
    {
      key: 'gym',
      name: 'U9 Sobotní posilovna',
      daysOfWeek: [6],
      startTime: '09:00',
      endTime: '10:00',
      location: 'Posilovna Kavčí hory',
    },
  ];

  let totalGeneratedEvents = 0;
  for (const t of templates) {
    const tpl = await prisma.trainingTemplate.create({
      data: {
        clubId: club.id,
        teamId: u9.id,
        name: t.name,
        eventType: EventType.PRACTICE,
        daysOfWeek: t.daysOfWeek,
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        validFrom: seedValidFrom,
        validUntil: seedValidUntil,
        active: true,
        createdById: members.coachU9!.id,
      },
    });

    const [sh, sm] = t.startTime.split(':').map(Number) as [number, number];
    const [eh, em] = t.endTime.split(':').map(Number) as [number, number];
    const daySet = new Set(t.daysOfWeek);
    const candidates: Array<Parameters<typeof prisma.event.createMany>[0]['data'] extends Array<infer U> ? U : never> = [];

    let cursor = localPartsForSeed(seedValidFrom, tz);
    const end = localPartsForSeed(seedValidUntil, tz);
    let cursorUtc = Date.UTC(cursor.y, cursor.m, cursor.d);
    const endUtc = Date.UTC(end.y, end.m, end.d);

    while (cursorUtc <= endUtc) {
      const startsAt = zonedToUtcForSeed(cursor.y, cursor.m, cursor.d, sh, sm, tz);
      const endsAt = zonedToUtcForSeed(cursor.y, cursor.m, cursor.d, eh, em, tz);
      const dow = localDayOfWeekForSeed(startsAt, tz);
      if (daySet.has(dow) && startsAt >= seedValidFrom && startsAt <= seedValidUntil) {
        candidates.push({
          clubId: club.id,
          teamId: u9.id,
          templateId: tpl.id,
          type: EventType.PRACTICE,
          title: t.name,
          startsAt,
          endsAt,
          location: t.location,
          createdById: members.coachU9!.id,
          detached: false,
        });
      }
      cursorUtc += 24 * 3600 * 1000;
      const next = localPartsForSeed(new Date(cursorUtc), tz);
      cursor = next;
      cursorUtc = Date.UTC(cursor.y, cursor.m, cursor.d);
    }

    const res = await prisma.event.createMany({ data: candidates, skipDuplicates: true });
    totalGeneratedEvents += res.count;
    console.log(`  Template "${t.name}": generated ${res.count} events`);
  }
  console.log(`  Total Braník training-template events: ${totalGeneratedEvents}`);

  // ==========================================================================
  //  CLUB 2 — TJ Spartak Kbely (REAL Týmuj roster — 27 players + 5 staff)
  //  Proves multi-tenant RLS isolation and demonstrates a full real-world team.
  // ==========================================================================
  const club2 = await prisma.club.create({
    data: {
      slug: 'spartak-kbely',
      name: 'TJ Spartak Kbely',
      country: 'CZ',
      timezone: 'Europe/Prague',
      // Per-tenant customization — Spartak has the `messages` module DISABLED
      // (demonstrates that a club without a flag gets 404 on /conversations)
      // and is on the default `basic` tier with the default 200-member cap.
      features: {
        messages: false,
        trainingTemplates: true,
        payments: true,
        notifications: true,
        waivers: true,
        calendar: true,
        gallery: false,
        springCup: false,
      },
      config: {
        tier: 'basic',
        limits: { maxMembers: 200, maxTeams: 10 },
      },
    },
  });
  const skTeam = await prisma.team.create({
    data: { clubId: club2.id, name: 'Spartak Kbely U9', sport: 'football', ageGroup: 'U9', season: '2025-26' },
  });

  // ---- Spartak Staff (5) ----
  type SpartakUserDef = { key: string; email: string; firstName: string; lastName: string; dob?: string; pw?: boolean };
  const spartakStaff: SpartakUserDef[] = [
    { key: 'skAdmin',  email: 'admin@spartak-kbely.example.com',        firstName: 'Vít',       lastName: 'Mrkvička',     pw: true },
    { key: 'skCoach1', email: 'pavel.stejskal@spartak-kbely.example.com', firstName: 'Pavel',   lastName: 'Stejskal',     pw: true },
    { key: 'skCoach2', email: 'tomas.simak@spartak-kbely.example.com',  firstName: 'Tomáš',     lastName: 'Šimák',        pw: true },
    { key: 'skCoach3', email: 'filip.vana@spartak-kbely.example.com',   firstName: 'Filip',     lastName: 'Váňa',         pw: true },
    { key: 'skCoach4', email: 'michaela.frydrychova@spartak-kbely.example.com', firstName: 'Michaela', lastName: 'Frydrychová', pw: true },
  ];

  // ---- Spartak Players (27 — real roster) ----
  // Alex Mertin is NOT created here — he already exists (see Braník users) and
  // we only add a Member row for him in club2.
  const spartakPlayers: SpartakUserDef[] = [
    { key: 'sk_matyas_d',      email: 'matyas.danihelka@spartak-kbely.example.com',  firstName: 'Matyáš',    lastName: 'Danihelka',  dob: '2017-03-15' },
    { key: 'sk_mirek_d',       email: 'mirek.danihelka@spartak-kbely.example.com',    firstName: 'Mirek',     lastName: 'Danihelka',  dob: '2017-07-22' },
    { key: 'sk_dominik_donev', email: 'dominik.donev@spartak-kbely.example.com',      firstName: 'Dominik',   lastName: 'Donev',      dob: '2017-01-10' },
    { key: 'sk_samuel_h',      email: 'samuel.hladik@spartak-kbely.example.com',      firstName: 'Samuel',    lastName: 'Hladík',     dob: '2017-05-04' },
    { key: 'sk_adam_hruby',    email: 'adam.hruby@spartak-kbely.example.com',         firstName: 'Adam',      lastName: 'Hrubý',      dob: '2017-11-28' },
    { key: 'sk_viktor_k',      email: 'viktor.korencik@spartak-kbely.example.com',    firstName: 'Viktor',    lastName: 'Korenčík',   dob: '2017-09-16' },
    { key: 'sk_vlad_k',        email: 'vladyslav.korovskyi@spartak-kbely.example.com',firstName: 'Vladyslav', lastName: 'Korovskyi',  dob: '2017-02-19' },
    { key: 'sk_pavel_krenek',  email: 'pavel.krenek@spartak-kbely.example.com',       firstName: 'Pavel',     lastName: 'Křenek',     dob: '2017-06-05' },
    { key: 'sk_lukas_n',       email: 'lukas.neuvirth@spartak-kbely.example.com',     firstName: 'Lukáš',     lastName: 'Neuvirth',   dob: '2017-10-12' },
    { key: 'sk_marek_niess',   email: 'marek.niessner@spartak-kbely.example.com',     firstName: 'Marek',     lastName: 'Niessner',   dob: '2017-04-23' },
    { key: 'sk_tim_niess',     email: 'tim.niessner@spartak-kbely.example.com',       firstName: 'Tim',       lastName: 'Niessner',   dob: '2017-04-23' },
    { key: 'sk_albert_n',      email: 'albert.novak@spartak-kbely.example.com',       firstName: 'Albert',    lastName: 'Novák',      dob: '2017-08-30' },
    { key: 'sk_kristyna_n',    email: 'kristyna.novakova@spartak-kbely.example.com',  firstName: 'Kristýna',  lastName: 'Nováková',   dob: '2017-12-07' },
    { key: 'sk_jan_pecka',     email: 'jan.pecka@spartak-kbely.example.com',          firstName: 'Jan',       lastName: 'Pecka',      dob: '2017-02-02' },
    { key: 'sk_matyas_p',      email: 'matyas.pechar@spartak-kbely.example.com',      firstName: 'Matyáš',    lastName: 'Pechar',     dob: '2017-06-18' },
    { key: 'sk_hubert_r',      email: 'hubert.rajtr@spartak-kbely.example.com',       firstName: 'Hubert',    lastName: 'Rajtr',      dob: '2017-01-25' },
    { key: 'sk_adam_r',        email: 'adam.ruzicka@spartak-kbely.example.com',       firstName: 'Adam',      lastName: 'Růžička',    dob: '2017-07-11' },
    { key: 'sk_jiri_s',        email: 'jiri.slavata@spartak-kbely.example.com',       firstName: 'Jiří',      lastName: 'Slavata',    dob: '2017-05-21' },
    { key: 'sk_david_snihura', email: 'david.snihura@spartak-kbely.example.com',      firstName: 'David',     lastName: 'Snihura',    dob: '2017-03-08' },
    { key: 'sk_richard_t',     email: 'richard.tomasuk@spartak-kbely.example.com',    firstName: 'Richard',   lastName: 'Tomašuk',    dob: '2017-09-04' },
    { key: 'sk_lukas_v',       email: 'lukas.vavra@spartak-kbely.example.com',        firstName: 'Lukáš',     lastName: 'Vávra',      dob: '2017-11-17' },
    { key: 'sk_david_v',       email: 'david.velicka@spartak-kbely.example.com',      firstName: 'David',     lastName: 'Velička',    dob: '2017-04-29' },
    { key: 'sk_jonas_v',       email: 'jonas.venhuda@spartak-kbely.example.com',      firstName: 'Jonáš',     lastName: 'Venhuda',    dob: '2017-08-14' },
    { key: 'sk_albert_vom',    email: 'albert.vomacka@spartak-kbely.example.com',     firstName: 'Albert',    lastName: 'Vomáčka',    dob: '2017-06-26' },
    { key: 'sk_richard_z',     email: 'richard.zavoral@spartak-kbely.example.com',    firstName: 'Richard',   lastName: 'Zavoral',    dob: '2017-10-03' },
    { key: 'sk_daniel_z',      email: 'daniel.zaba@spartak-kbely.example.com',        firstName: 'Daniel',    lastName: 'Žaba',       dob: '2017-12-20' },
  ];

  const spartakUsers: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const u of [...spartakStaff, ...spartakPlayers]) {
    spartakUsers[u.key] = await prisma.user.create({
      data: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: u.pw ? devHash : null,
        dateOfBirth: u.dob ? d(u.dob) : null,
      },
    });
  }

  // ---- Spartak Members ----
  const spartakMembers: Record<string, Awaited<ReturnType<typeof prisma.member.create>>> = {};

  // Staff — adults, no jersey
  for (const s of spartakStaff) {
    spartakMembers[s.key] = await prisma.member.create({
      data: { userId: spartakUsers[s.key]!.id, clubId: club2.id, isMinor: false },
    });
  }

  // Players — minors, sequential jerseys (skip 7, reserved for Alex)
  let jerseyCounter = 1;
  for (const p of spartakPlayers) {
    if (jerseyCounter === 7) jerseyCounter++; // Alex owns #7
    spartakMembers[p.key] = await prisma.member.create({
      data: {
        userId: spartakUsers[p.key]!.id,
        clubId: club2.id,
        isMinor: true,
        jerseyNumber: jerseyCounter++,
      },
    });
  }

  // Alex is also a Spartak member (multi-tenant proof) — jersey #7 as in Týmuj
  const alexSk = await prisma.member.create({
    data: { userId: users.alex!.id, clubId: club2.id, jerseyNumber: 7, isMinor: false },
  });
  spartakMembers['alex'] = alexSk;

  // ---- Spartak Club roles + Team memberships ----
  await prisma.clubRole.createMany({
    data: [
      { memberId: spartakMembers.skAdmin!.id, role: ClubRoleType.OWNER },
      { memberId: spartakMembers.skAdmin!.id, role: ClubRoleType.ADMIN },
      { memberId: spartakMembers.skAdmin!.id, role: ClubRoleType.FINANCE },
    ],
  });

  const skTm = (memberId: string, role: TeamRole) => ({ memberId, teamId: skTeam.id, role });
  await prisma.teamMembership.createMany({
    data: [
      // Coaching staff (Vít is HEAD_COACH, others ASSISTANT_COACH)
      skTm(spartakMembers.skAdmin!.id,  TeamRole.HEAD_COACH),
      skTm(spartakMembers.skCoach1!.id, TeamRole.ASSISTANT_COACH),
      skTm(spartakMembers.skCoach2!.id, TeamRole.ASSISTANT_COACH),
      skTm(spartakMembers.skCoach3!.id, TeamRole.ASSISTANT_COACH),
      skTm(spartakMembers.skCoach4!.id, TeamRole.ASSISTANT_COACH),

      // All 27 players
      skTm(spartakMembers.alex!.id,             TeamRole.PLAYER),
      skTm(spartakMembers.sk_matyas_d!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_mirek_d!.id,       TeamRole.PLAYER),
      skTm(spartakMembers.sk_dominik_donev!.id, TeamRole.PLAYER),
      skTm(spartakMembers.sk_samuel_h!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_adam_hruby!.id,    TeamRole.PLAYER),
      skTm(spartakMembers.sk_viktor_k!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_vlad_k!.id,        TeamRole.PLAYER),
      skTm(spartakMembers.sk_pavel_krenek!.id,  TeamRole.PLAYER),
      skTm(spartakMembers.sk_lukas_n!.id,       TeamRole.PLAYER),
      skTm(spartakMembers.sk_marek_niess!.id,   TeamRole.PLAYER),
      skTm(spartakMembers.sk_tim_niess!.id,     TeamRole.PLAYER),
      skTm(spartakMembers.sk_albert_n!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_kristyna_n!.id,    TeamRole.PLAYER),
      skTm(spartakMembers.sk_jan_pecka!.id,     TeamRole.PLAYER),
      skTm(spartakMembers.sk_matyas_p!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_hubert_r!.id,      TeamRole.PLAYER),
      skTm(spartakMembers.sk_adam_r!.id,        TeamRole.PLAYER),
      skTm(spartakMembers.sk_jiri_s!.id,        TeamRole.PLAYER),
      skTm(spartakMembers.sk_david_snihura!.id, TeamRole.PLAYER),
      skTm(spartakMembers.sk_richard_t!.id,     TeamRole.PLAYER),
      skTm(spartakMembers.sk_lukas_v!.id,       TeamRole.PLAYER),
      skTm(spartakMembers.sk_david_v!.id,       TeamRole.PLAYER),
      skTm(spartakMembers.sk_jonas_v!.id,       TeamRole.PLAYER),
      skTm(spartakMembers.sk_albert_vom!.id,    TeamRole.PLAYER),
      skTm(spartakMembers.sk_richard_z!.id,     TeamRole.PLAYER),
      skTm(spartakMembers.sk_daniel_z!.id,      TeamRole.PLAYER),
    ],
  });

  // ---- Spartak fee ----
  await prisma.fee.create({
    data: {
      clubId: club2.id,
      teamId: skTeam.id,
      name: 'U9 Sezónní příspěvek Spartak Kbely',
      amountCents: 500000,
      currency: 'CZK',
      dueDate: d('2026-06-01'),
    },
  });

  // ---- Spartak training templates (úterý + čtvrtek 16:30) ----
  // Mirrors Týmuj pattern: tréninky Út+Čt 16:30–18:00.
  const skTemplate = await prisma.trainingTemplate.create({
    data: {
      clubId: club2.id,
      teamId: skTeam.id,
      name: 'Spartak U9 úterý + čtvrtek',
      eventType: EventType.PRACTICE,
      daysOfWeek: [2, 4],
      startTime: '16:30',
      endTime: '18:00',
      location: 'Hřiště TJ Spartak Kbely',
      validFrom: seedValidFrom,
      validUntil: seedValidUntil,
      active: true,
      createdById: spartakMembers.skAdmin!.id,
    },
  });

  // Generate Spartak training events
  {
    const sh = 16, sm = 30, eh = 18, em = 0;
    const daySet = new Set([2, 4]);
    const candidates: Array<Parameters<typeof prisma.event.createMany>[0]['data'] extends Array<infer U> ? U : never> = [];

    let cursor = localPartsForSeed(seedValidFrom, tz);
    const end = localPartsForSeed(seedValidUntil, tz);
    let cursorUtc = Date.UTC(cursor.y, cursor.m, cursor.d);
    const endUtc = Date.UTC(end.y, end.m, end.d);

    while (cursorUtc <= endUtc) {
      const startsAt = zonedToUtcForSeed(cursor.y, cursor.m, cursor.d, sh, sm, tz);
      const endsAt = zonedToUtcForSeed(cursor.y, cursor.m, cursor.d, eh, em, tz);
      const dow = localDayOfWeekForSeed(startsAt, tz);
      if (daySet.has(dow) && startsAt >= seedValidFrom && startsAt <= seedValidUntil) {
        candidates.push({
          clubId: club2.id,
          teamId: skTeam.id,
          templateId: skTemplate.id,
          type: EventType.PRACTICE,
          title: skTemplate.name,
          startsAt,
          endsAt,
          location: skTemplate.location!,
          createdById: spartakMembers.skAdmin!.id,
          detached: false,
        });
      }
      cursorUtc += 24 * 3600 * 1000;
      const next = localPartsForSeed(new Date(cursorUtc), tz);
      cursor = next;
      cursorUtc = Date.UTC(cursor.y, cursor.m, cursor.d);
    }

    const res = await prisma.event.createMany({ data: candidates, skipDuplicates: true });
    console.log(`  Spartak template: generated ${res.count} events`);
  }

  // One upcoming match for Spartak (mirrors Týmuj schedule)
  await prisma.event.create({
    data: {
      clubId: club2.id,
      teamId: skTeam.id,
      type: EventType.MATCH,
      title: 'FK Admira Praha vs Spartak Kbely U9',
      startsAt: future(2, 17),
      endsAt: future(2, 18),
      location: 'Stadion FK Admira Praha',
      opponent: 'FK Admira Praha',
      homeAway: HomeAway.AWAY,
      createdById: spartakMembers.skAdmin!.id,
    },
  });

  // ==========================================================================
  //  PLATFORM ADMIN (global — can edit features/config for any club)
  //  Logs in via /auth/login like any user, then uses /platform-admin/* routes.
  // ==========================================================================
  await prisma.user.create({
    data: {
      email: 'platform@example.com',
      firstName: 'Tomáš',
      lastName: 'Mertin (SaaS)',
      passwordHash: devHash,
      isPlatformAdmin: true,
    },
  });

  // ==========================================================================
  //  Notifications (Braník-scoped)
  // ==========================================================================
  const notificationDefs: Array<{
    memberId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
    read?: boolean;
    hoursAgo: number;
  }> = [
    // Admin
    { memberId: members.admin!.id, type: NotificationType.EVENT_CREATED, title: 'Nový trénink: U15 Příprava', body: 'Středa 16. dubna, 17:00 — Braník UMT 1', link: '/admin/events', hoursAgo: 1 },
    { memberId: members.admin!.id, type: NotificationType.PAYMENT_DUE, title: '3 nezaplacené příspěvky', body: 'Sezónní příspěvky mají splatnost 1. 5.', link: '/admin/payments', hoursAgo: 3 },
    { memberId: members.admin!.id, type: NotificationType.WAIVER_PENDING, title: 'Nepodepsaný souhlas: Dominik Procházka', body: 'Souhlas s focením — čeká na podpis rodiče', link: '/admin/members', hoursAgo: 5 },
    { memberId: members.admin!.id, type: NotificationType.MESSAGE, title: 'Nová zpráva od Martina Procházky', body: 'Ahoj, potřebuju řešit rozpis na víkend...', link: '/admin/messages', hoursAgo: 8 },
    { memberId: members.admin!.id, type: NotificationType.RSVP_REMINDER, title: 'Nízká účast: Sobotní zápas', body: 'Pouze 6 z 15 hráčů potvrdilo účast', link: '/admin/events', hoursAgo: 12 },
    { memberId: members.admin!.id, type: NotificationType.PAYMENT_RECEIVED, title: 'Platba přijata: Radek Nový', body: '8 000 Kč — U15 Sezónní příspěvek', link: '/admin/payments', hoursAgo: 24, read: true },
    { memberId: members.admin!.id, type: NotificationType.ANNOUNCEMENT, title: 'Nové klubové oznámení odesláno', body: 'Letní kemp 2026 — informace', hoursAgo: 48, read: true },
    // Head coach
    { memberId: members.headCoach!.id, type: NotificationType.EVENT_UPDATED, title: 'Změna: U15 Přátelák vs. Meteor', body: 'Přesunutý čas: 10:00 → 11:00', link: '/admin/events', hoursAgo: 2 },
    { memberId: members.headCoach!.id, type: NotificationType.RSVP_REMINDER, title: 'Čeká na odpověď: 4 hráči', body: 'Středeční trénink — deadline zítra', link: '/admin/events', hoursAgo: 6 },
    { memberId: members.headCoach!.id, type: NotificationType.MESSAGE, title: 'Nová zpráva v kanálu Trenéři', body: 'Petra: Mám nový rozpis na květen...', link: '/admin/messages', hoursAgo: 10 },
    // Mom
    { memberId: members.mom!.id, type: NotificationType.EVENT_CREATED, title: 'Nová akce: U9 Turnaj Kbely', body: 'Sobota 19. 4. — celý den', link: '/admin/events', hoursAgo: 4 },
    { memberId: members.mom!.id, type: NotificationType.PAYMENT_DUE, title: 'Platba k úhradě: U9 Příspěvek', body: '6 000 Kč — splatnost 1. 5.', link: '/admin/payments', hoursAgo: 18 },
    { memberId: members.mom!.id, type: NotificationType.ANNOUNCEMENT, title: 'Klubové oznámení: Letní kemp', body: 'Přihlášky otevřeny do 30. 4.', link: '/admin/messages', hoursAgo: 26 },
    { memberId: members.mom!.id, type: NotificationType.EVENT_CANCELLED, title: 'Zrušeno: Čtvrteční trénink', body: 'Důvod: údržba hřiště', link: '/admin/events', hoursAgo: 50, read: true },
  ];

  for (const n of notificationDefs) {
    await prisma.notification.create({
      data: {
        clubId: club.id,
        memberId: n.memberId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        link: n.link ?? null,
        read: n.read ?? false,
        createdAt: new Date(Date.now() - n.hoursAgo * 3600_000),
      },
    });
  }

  // ==========================================================================
  //  Verification
  // ==========================================================================
  console.log('\n=== Verification ===');

  const alexRoles = await prisma.teamMembership.findMany({
    where: { member: { userId: users.alex!.id } },
    include: { team: { select: { name: true, club: { select: { name: true } } } } },
  });
  console.log(
    `\n(1) Alex's roles across ALL clubs (${alexRoles.length} expected: 4):`,
    alexRoles.map((r) => `${r.team.club.name} / ${r.team.name} = ${r.role}`),
  );

  const matyasGuardians = await prisma.guardianLink.findMany({
    where: { childId: members.matyasBr!.id },
    include: { guardian: { include: { user: true } } },
  });
  console.log(
    `\n(2) Matyáš Peroutka's guardians and permission masks:`,
    matyasGuardians.map((g) => ({
      name: `${g.guardian.user.firstName} ${g.guardian.user.lastName}`,
      payments: g.canViewPayments,
      medical: g.canViewMedical,
      waivers: g.canSignWaivers,
    })),
  );

  const dadVisibleConversations = await prisma.conversation.findMany({
    where: { participants: { some: { memberId: members.dad!.id } } },
    select: { title: true, type: true },
  });
  console.log(
    `\n(3) Conversations Dad can see (should NOT include "Trenér Dvořák & Lucie"):`,
    dadVisibleConversations,
  );

  const dadVisiblePayments = await prisma.payment.findMany({
    where: {
      OR: [
        { payerId: members.dad!.id },
        { onBehalfOf: { guardianLinks: { some: { guardianId: members.dad!.id, canViewPayments: true } } } },
      ],
    },
  });
  console.log(
    `\n(4) Payments Dad can see (should be 1 — his own pending): ${dadVisiblePayments.length}`,
  );

  // Per-club member counts (proves no data mixing)
  const branikMemberCount  = await prisma.member.count({ where: { clubId: club.id } });
  const spartakMemberCount = await prisma.member.count({ where: { clubId: club2.id } });
  console.log(
    `\n(5) Members per club — Braník: ${branikMemberCount}, Spartak Kbely: ${spartakMemberCount}`,
  );

  // Cross-club name check — any lastName appearing in BOTH clubs besides Alex Mertin?
  const branikSurnames = new Set(
    (await prisma.member.findMany({ where: { clubId: club.id }, include: { user: true } }))
      .map((m) => m.user.lastName),
  );
  const spartakSurnamesAll = await prisma.member.findMany({
    where: { clubId: club2.id },
    include: { user: true },
  });
  const overlap = spartakSurnamesAll
    .filter((m) => branikSurnames.has(m.user.lastName) && m.user.firstName !== 'Alex')
    .map((m) => `${m.user.firstName} ${m.user.lastName}`);
  console.log(
    `\n(6) Surname overlap between clubs (should be [] — only Alex Mertin crosses): ${JSON.stringify(overlap)}`,
  );

  const counts = {
    clubs: await prisma.club.count(),
    users: await prisma.user.count(),
    members: await prisma.member.count(),
    teams: await prisma.team.count(),
    teamMemberships: await prisma.teamMembership.count(),
    guardianLinks: await prisma.guardianLink.count(),
    events: await prisma.event.count(),
    eventsFromTemplates: await prisma.event.count({ where: { templateId: { not: null } } }),
    trainingTemplates: await prisma.trainingTemplate.count(),
    rsvps: await prisma.eventAttendance.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    fees: await prisma.fee.count(),
    payments: await prisma.payment.count(),
    waivers: await prisma.waiver.count(),
    signatures: await prisma.waiverSignature.count(),
    notifications: await prisma.notification.count(),
  };
  console.log('\n(7) Row counts:', counts);
  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
