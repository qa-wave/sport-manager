-- ============================================================================
-- Row-Level Security (RLS) policies for tenant isolation
-- ============================================================================
--
-- Run AFTER the initial Prisma migration has created the tables, and re-run
-- after any `prisma db push` (db push can reset rowsecurity flags):
--
--   psql "$DATABASE_URL" -f packages/db/scripts/enable-rls.sql
--   # or:  pnpm db:rls
--
-- The pattern:
--   - Every clubbed table is filtered by `app_in_club(clubId)`.
--   - At request time the API sets `app.club_id` for the current transaction
--     via prisma.withClub(clubId) -> set_config(..., is_local=true).
--   - If `app.club_id` is NOT set, current_setting(..., true) returns the empty
--     string, which matches NO rows -> fail safe.
--   - Platform admins use prisma.withPlatformAdmin(), which sets the sentinel
--     `app.club_id = '__platform__'`; app_in_club() returns true for any row.
--     A real clubId is a cuid and can never collide with the sentinel.
--
-- Tables that are NOT clubbed (User, Session, PushToken, PushSubscription) are
-- intentionally NOT subject to RLS: they're user-scoped, gated by JWT auth.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: true when the row's club matches the request scope OR the caller is
-- a platform admin. STABLE + SQL so the planner can inline it.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_in_club(row_club_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT row_club_id = current_setting('app.club_id', true)
      OR current_setting('app.club_id', true) = '__platform__';
$$;

-- ----------------------------------------------------------------------------
-- Tables that carry clubId directly.
-- ----------------------------------------------------------------------------
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
    'TrainingTemplate',
    'Exercise',
    'ExerciseCategory',
    'Strategy',
    'Newsletter',
    'PlayerFeedback',
    'Notification',
    'NotificationPreference',
    'ClubFeatureAudit'
  ];
BEGIN
  FOREACH clubbed_table IN ARRAY clubbed_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', clubbed_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', clubbed_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', clubbed_table);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (app_in_club("clubId"))
         WITH CHECK (app_in_club("clubId"))',
      clubbed_table
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Join tables: no clubId of their own; policy goes via parent.
-- ----------------------------------------------------------------------------

-- TeamMembership -> Team.clubId
ALTER TABLE "TeamMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMembership" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "TeamMembership";
CREATE POLICY tenant_isolation ON "TeamMembership"
  USING (
    EXISTS (SELECT 1 FROM "Team" t WHERE t.id = "TeamMembership"."teamId" AND app_in_club(t."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Team" t WHERE t.id = "TeamMembership"."teamId" AND app_in_club(t."clubId"))
  );

-- ClubRole -> Member.clubId
ALTER TABLE "ClubRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClubRole" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ClubRole";
CREATE POLICY tenant_isolation ON "ClubRole"
  USING (
    EXISTS (SELECT 1 FROM "Member" m WHERE m.id = "ClubRole"."memberId" AND app_in_club(m."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Member" m WHERE m.id = "ClubRole"."memberId" AND app_in_club(m."clubId"))
  );

-- GuardianLink -> Member.clubId (guardian and child are always same club)
ALTER TABLE "GuardianLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuardianLink" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "GuardianLink";
CREATE POLICY tenant_isolation ON "GuardianLink"
  USING (
    EXISTS (SELECT 1 FROM "Member" m WHERE m.id = "GuardianLink"."guardianId" AND app_in_club(m."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Member" m WHERE m.id = "GuardianLink"."guardianId" AND app_in_club(m."clubId"))
  );

-- EventAttendance -> Event.clubId
ALTER TABLE "EventAttendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventAttendance" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "EventAttendance";
CREATE POLICY tenant_isolation ON "EventAttendance"
  USING (
    EXISTS (SELECT 1 FROM "Event" e WHERE e.id = "EventAttendance"."eventId" AND app_in_club(e."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Event" e WHERE e.id = "EventAttendance"."eventId" AND app_in_club(e."clubId"))
  );

-- ConversationParticipant -> Conversation.clubId
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ConversationParticipant";
CREATE POLICY tenant_isolation ON "ConversationParticipant"
  USING (
    EXISTS (SELECT 1 FROM "Conversation" c WHERE c.id = "ConversationParticipant"."conversationId" AND app_in_club(c."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Conversation" c WHERE c.id = "ConversationParticipant"."conversationId" AND app_in_club(c."clubId"))
  );

-- Message -> Conversation.clubId
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "Message";
CREATE POLICY tenant_isolation ON "Message"
  USING (
    EXISTS (SELECT 1 FROM "Conversation" c WHERE c.id = "Message"."conversationId" AND app_in_club(c."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Conversation" c WHERE c.id = "Message"."conversationId" AND app_in_club(c."clubId"))
  );

-- WaiverSignature -> Waiver.clubId
ALTER TABLE "WaiverSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaiverSignature" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "WaiverSignature";
CREATE POLICY tenant_isolation ON "WaiverSignature"
  USING (
    EXISTS (SELECT 1 FROM "Waiver" w WHERE w.id = "WaiverSignature"."waiverId" AND app_in_club(w."clubId"))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM "Waiver" w WHERE w.id = "WaiverSignature"."waiverId" AND app_in_club(w."clubId"))
  );

-- ----------------------------------------------------------------------------
-- Smoke test (manual):
--   SET app.club_id = '<club id>';   SELECT count(*) FROM "Member";   -- that club only
--   SET app.club_id = '';            SELECT count(*) FROM "Member";   -- 0
--   SET app.club_id = '__platform__';SELECT count(*) FROM "Member";   -- all clubs
-- ----------------------------------------------------------------------------
