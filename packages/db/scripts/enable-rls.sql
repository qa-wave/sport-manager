-- ============================================================================
-- Row-Level Security (RLS) policies for tenant isolation
-- ============================================================================
--
-- Run AFTER the initial Prisma migration has created the tables.
--
--   psql "$DATABASE_URL" -f packages/db/scripts/enable-rls.sql
--
-- Or via the pnpm script:
--
--   pnpm db:rls
--
-- The pattern:
--   - Every clubbed table has `club_id text not null`.
--   - We enable RLS and add a single policy per table that checks
--     `club_id = current_setting('app.club_id', true)`.
--   - At request time, the API sets `app.club_id` for the current
--     transaction via PrismaService.withClub() -> set_config(..., true).
--   - If `app.club_id` is NOT set, current_setting(..., true) returns
--     the empty string, which matches NO rows -> fail safe.
--
-- Tables that are NOT clubbed (User, Session, PushToken) are intentionally
-- NOT subject to RLS: they're user-scoped, not club-scoped. Access to them
-- is still gated by the JwtAuthGuard.
--
-- Admin/migration/seed workloads that legitimately need to see all clubs
-- should connect as a role with BYPASSRLS, or use the `app_admin` pattern
-- of SET LOCAL app.club_id = '<specific club>' per statement.
-- ============================================================================

-- Tables that carry club_id directly.
-- Order matches schema.prisma for easy auditing.
DO $$
DECLARE
  clubbed_table text;
  clubbed_tables text[] := ARRAY[
    'Member',
    'Team',
    'Event',
    'Conversation',
    'Fee',
    'Payment',
    'Waiver',
    'TrainingTemplate'
  ];
BEGIN
  FOREACH clubbed_table IN ARRAY clubbed_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', clubbed_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', clubbed_table);

    -- Idempotent: drop if exists, then recreate.
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', clubbed_table);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("clubId" = current_setting(''app.club_id'', true))
         WITH CHECK ("clubId" = current_setting(''app.club_id'', true))',
      clubbed_table
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Join tables: no club_id of their own; policy goes via parent.
-- ----------------------------------------------------------------------------

-- TeamMembership -> Team.clubId
ALTER TABLE "TeamMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMembership" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "TeamMembership";
CREATE POLICY tenant_isolation ON "TeamMembership"
  USING (
    EXISTS (
      SELECT 1 FROM "Team" t
      WHERE t.id = "TeamMembership"."teamId"
        AND t."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Team" t
      WHERE t.id = "TeamMembership"."teamId"
        AND t."clubId" = current_setting('app.club_id', true)
    )
  );

-- ClubRole -> Member.clubId
ALTER TABLE "ClubRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClubRole" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ClubRole";
CREATE POLICY tenant_isolation ON "ClubRole"
  USING (
    EXISTS (
      SELECT 1 FROM "Member" m
      WHERE m.id = "ClubRole"."memberId"
        AND m."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Member" m
      WHERE m.id = "ClubRole"."memberId"
        AND m."clubId" = current_setting('app.club_id', true)
    )
  );

-- GuardianLink -> Member.clubId (guardian and child are always same club)
ALTER TABLE "GuardianLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuardianLink" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "GuardianLink";
CREATE POLICY tenant_isolation ON "GuardianLink"
  USING (
    EXISTS (
      SELECT 1 FROM "Member" m
      WHERE m.id = "GuardianLink"."guardianId"
        AND m."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Member" m
      WHERE m.id = "GuardianLink"."guardianId"
        AND m."clubId" = current_setting('app.club_id', true)
    )
  );

-- EventAttendance -> Event.clubId
ALTER TABLE "EventAttendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventAttendance" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "EventAttendance";
CREATE POLICY tenant_isolation ON "EventAttendance"
  USING (
    EXISTS (
      SELECT 1 FROM "Event" e
      WHERE e.id = "EventAttendance"."eventId"
        AND e."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Event" e
      WHERE e.id = "EventAttendance"."eventId"
        AND e."clubId" = current_setting('app.club_id', true)
    )
  );

-- ConversationParticipant -> Conversation.clubId
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ConversationParticipant";
CREATE POLICY tenant_isolation ON "ConversationParticipant"
  USING (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "ConversationParticipant"."conversationId"
        AND c."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "ConversationParticipant"."conversationId"
        AND c."clubId" = current_setting('app.club_id', true)
    )
  );

-- Message -> Conversation.clubId
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Message";
CREATE POLICY tenant_isolation ON "Message"
  USING (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "Message"."conversationId"
        AND c."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "Message"."conversationId"
        AND c."clubId" = current_setting('app.club_id', true)
    )
  );

-- WaiverSignature -> Waiver.clubId
ALTER TABLE "WaiverSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaiverSignature" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "WaiverSignature";
CREATE POLICY tenant_isolation ON "WaiverSignature"
  USING (
    EXISTS (
      SELECT 1 FROM "Waiver" w
      WHERE w.id = "WaiverSignature"."waiverId"
        AND w."clubId" = current_setting('app.club_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Waiver" w
      WHERE w.id = "WaiverSignature"."waiverId"
        AND w."clubId" = current_setting('app.club_id', true)
    )
  );

-- ----------------------------------------------------------------------------
-- Smoke test (commented out — uncomment to run manually):
--
--   SET LOCAL app.club_id = '<some club id>';
--   SELECT count(*) FROM "Member";              -- should only return that club's members
--   SET LOCAL app.club_id = '';
--   SELECT count(*) FROM "Member";              -- should return 0
-- ----------------------------------------------------------------------------
