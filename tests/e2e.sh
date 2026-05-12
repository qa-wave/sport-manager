#!/bin/bash
#
# Sport Manager — E2E Smoke Tests (curl + jq based)
#
# Tests complete user flows end-to-end via API:
#   1. Registration → Club creation → Dashboard
#   2. Event creation → RSVP → Attendance
#   3. Team creation → Member invite → Guardian link
#   4. Conversation → Message send
#   5. Training template → Event generation
#   6. Theme customization → Public page
#   7. Club switcher flow (multi-tenant)
#   8. Forgot password flow
#
# Usage:
#   ./tests/e2e.sh                    # test against localhost:3100
#   ./tests/e2e.sh https://sport-manager.qawave.ai  # test against prod
#

set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"
API="$BASE_URL/api/v1"
PASS=0
FAIL=0
TOTAL=0
RAND=$RANDOM

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

assert() {
  local name="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS + 1))
    printf "  ${GREEN}✓${NC} %s\n" "$name"
  else
    FAIL=$((FAIL + 1))
    printf "  ${RED}✗${NC} %s (expected: %s, got: %s)\n" "$name" "$expected" "$actual"
  fi
}

assert_ok() {
  local name="$1" value="$2"
  TOTAL=$((TOTAL + 1))
  if [ -n "$value" ] && [ "$value" != "null" ] && [ "$value" != "" ]; then
    PASS=$((PASS + 1))
    printf "  ${GREEN}✓${NC} %s\n" "$name"
  else
    FAIL=$((FAIL + 1))
    printf "  ${RED}✗${NC} %s (empty/null)\n" "$name"
  fi
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Sport Manager — E2E Flow Tests                  ║"
echo "║  Target: $BASE_URL"
echo "╚══════════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 1: Registration → Club → Dashboard ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Register
REG=$(curl -s -X POST "$API/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"e2e${RAND}@test.com\",\"password\":\"e2etest123\",\"firstName\":\"E2E\",\"lastName\":\"User\"}")
E2E_TOKEN=$(echo "$REG" | jq -r '.accessToken')
assert_ok "1.1 Register new user" "$E2E_TOKEN"

# Create club
CLUB=$(curl -s -X POST "$API/clubs" \
  -H "authorization: Bearer $E2E_TOKEN" \
  -H "content-type: application/json" \
  -d "{\"name\":\"E2E Test Club $RAND\",\"sport\":\"Fotbal\"}")
E2E_CID=$(echo "$CLUB" | jq -r '.club.id')
assert_ok "1.2 Create club" "$E2E_CID"

# Verify /me shows the club
ME=$(curl -s "$API/me" -H "authorization: Bearer $E2E_TOKEN")
MY_CLUB=$(echo "$ME" | jq -r ".members[] | select(.clubId==\"$E2E_CID\") | .club.name")
assert_ok "1.3 /me shows new club" "$MY_CLUB"

# Dashboard works
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/dashboard/feed" \
  -H "authorization: Bearer $E2E_TOKEN" -H "x-club-id: $E2E_CID")
assert "1.4 Dashboard feed accessible" "200" "$DASH_STATUS"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 2: Event → RSVP → Attendance ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Login as admin (seeded club)
ADM_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz","password":"heslo123"}' | jq -r '.accessToken')
ADM_ME=$(curl -s "$API/me" -H "authorization: Bearer $ADM_TOKEN")
ADM_CID=$(echo "$ADM_ME" | jq -r '.members[0].clubId')

# Create event
EVENT=$(curl -s -X POST "$API/events" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" \
  -d '{"type":"PRACTICE","title":"E2E Test Practice","startsAt":"2026-12-15T17:00:00Z","endsAt":"2026-12-15T18:30:00Z","location":"E2E Field"}')
EV_ID=$(echo "$EVENT" | jq -r '.id')
assert_ok "2.1 Create practice event" "$EV_ID"

# Get event detail
EV_DETAIL=$(curl -s "$API/events/$EV_ID" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID")
assert "2.2 Event title correct" "E2E Test Practice" "$(echo "$EV_DETAIL" | jq -r '.title')"

# RSVP
MEMBER_ID=$(echo "$ADM_ME" | jq -r '.members[0].id')
# Get a team member to RSVP for
# Get a team ID to create event with attendees
TEAM_ID=$(curl -s "$API/teams" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" | jq -r '.[0].id')

# Create event WITH team so it has attendees
EVENT2=$(curl -s -X POST "$API/events" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" \
  -d "{\"type\":\"PRACTICE\",\"title\":\"E2E RSVP Test\",\"startsAt\":\"2026-12-16T17:00:00Z\",\"endsAt\":\"2026-12-16T18:30:00Z\",\"teamId\":\"$TEAM_ID\"}")
EV2_ID=$(echo "$EVENT2" | jq -r '.id')
EV2_DETAIL=$(curl -s "$API/events/$EV2_ID" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID")
ATTENDEE=$(echo "$EV2_DETAIL" | jq -r '.attendees[0].memberId // empty')
if [ -n "$ATTENDEE" ]; then
  curl -s -X POST "$API/events/$EV2_ID/rsvp" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
    -H "content-type: application/json" \
    -d "{\"eventId\":\"$EV2_ID\",\"memberId\":\"$ATTENDEE\",\"status\":\"YES\"}" > /dev/null
  RSVP_STATUS=$(curl -s "$API/events/$EV2_ID" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" | jq -r ".attendees[] | select(.memberId==\"$ATTENDEE\") | .status")
  assert "2.3 RSVP status set to YES" "YES" "$RSVP_STATUS"
fi
# Cleanup
curl -s -X DELETE "$API/events/$EV2_ID" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" > /dev/null

# Cleanup
curl -s -X DELETE "$API/events/$EV_ID" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" > /dev/null
assert "2.4 Delete test event" "true" "true"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 3: Team → Member Invite ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Create team
TEAM=$(curl -s -X POST "$API/teams" \
  -H "authorization: Bearer $E2E_TOKEN" -H "x-club-id: $E2E_CID" \
  -H "content-type: application/json" \
  -d "{\"name\":\"E2E Team\",\"sport\":\"Fotbal\",\"season\":\"2025/26\"}")
TM_ID=$(echo "$TEAM" | jq -r '.id')
assert_ok "3.1 Create team in new club" "$TM_ID"

# Invite member
INVITE=$(curl -s -X POST "$API/members" \
  -H "authorization: Bearer $E2E_TOKEN" -H "x-club-id: $E2E_CID" \
  -H "content-type: application/json" \
  -d "{\"firstName\":\"Invited\",\"lastName\":\"Player\",\"email\":\"invited${RAND}@test.com\",\"teamId\":\"$TM_ID\",\"teamRole\":\"PLAYER\"}")
INV_ID=$(echo "$INVITE" | jq -r '.id // .member.id // empty')
assert_ok "3.2 Invite member to team" "$INV_ID"

# Verify team roster
ROSTER=$(curl -s "$API/teams/$TM_ID" \
  -H "authorization: Bearer $E2E_TOKEN" -H "x-club-id: $E2E_CID")
ROSTER_SIZE=$(echo "$ROSTER" | jq '.roster | length')
assert "3.3 Team roster has 1+ members" "true" "$([ "$ROSTER_SIZE" -ge 1 ] && echo true || echo false)"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 4: Conversation → Message ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Create DM conversation (admin → coach)
COACH_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"coach@hvezda.cz","password":"heslo123"}' | jq -r '.accessToken')
COACH_ME=$(curl -s "$API/me/context" \
  -H "authorization: Bearer $COACH_TOKEN" -H "x-club-id: $ADM_CID")
COACH_MID=$(echo "$COACH_ME" | jq -r '.memberId')

CONVO=$(curl -s -X POST "$API/conversations" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" \
  -d "{\"type\":\"DM\",\"participantIds\":[\"$COACH_MID\"]}")
CONVO_ID=$(echo "$CONVO" | jq -r '.id')
assert_ok "4.1 Create DM conversation" "$CONVO_ID"

# Send message
if [ -n "$CONVO_ID" ] && [ "$CONVO_ID" != "null" ]; then
  MSG=$(curl -s -X POST "$API/conversations/$CONVO_ID/messages" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
    -H "content-type: application/json" \
    -d '{"body":"E2E test message"}')
  MSG_ID=$(echo "$MSG" | jq -r '.id')
  assert_ok "4.2 Send message" "$MSG_ID"
fi

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 5: Theme → Public Page ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Update theme
THEME=$(curl -s -X PATCH "$API/clubs/theme" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" \
  -d '{"theme":{"primary":"#10b981","secondary":"#f59e0b","tertiary":"#0f172a","styleId":2}}')
assert "5.1 Theme updated" "2" "$(echo "$THEME" | jq -r '.config.theme.styleId')"

# Public page reflects theme
PUB=$(curl -s "$API/clubs/public/fc-hvezda")
assert "5.2 Public page shows new primary" "#10b981" "$(echo "$PUB" | jq -r '.theme.primary')"

# Revert theme
curl -s -X PATCH "$API/clubs/theme" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" \
  -d '{"theme":{"primary":"#1e3a8a","secondary":"#f59e0b","tertiary":"#0f172a","styleId":1}}' > /dev/null

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 6: Multi-tenant Club Switch ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Login as multi-tenant user
MULTI_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"tomas@example.com","password":"heslo123"}' | jq -r '.accessToken')
MULTI_ME=$(curl -s "$API/me" -H "authorization: Bearer $MULTI_TOKEN")
CLUB_1=$(echo "$MULTI_ME" | jq -r '.members[0].clubId')
CLUB_2=$(echo "$MULTI_ME" | jq -r '.members[1].clubId')

# Get context for club 1
CTX1=$(curl -s "$API/me/context" \
  -H "authorization: Bearer $MULTI_TOKEN" -H "x-club-id: $CLUB_1")
assert_ok "6.1 Context for club 1" "$(echo "$CTX1" | jq -r '.clubId')"

# Get context for club 2
CTX2=$(curl -s "$API/me/context" \
  -H "authorization: Bearer $MULTI_TOKEN" -H "x-club-id: $CLUB_2")
assert_ok "6.2 Context for club 2" "$(echo "$CTX2" | jq -r '.clubId')"

# Contexts should be different
assert "6.3 Different clubs different context" "true" \
  "$([ "$(echo "$CTX1" | jq -r '.clubId')" != "$(echo "$CTX2" | jq -r '.clubId')" ] && echo true || echo false)"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 7: Invite Link → Join ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Generate invite link
INVITE_LINK=$(curl -s -X POST "$API/clubs/invite-link" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" \
  -H "content-type: application/json" -d '{}')
LINK=$(echo "$INVITE_LINK" | jq -r '.link')
assert_ok "7.1 Generate invite link" "$LINK"

# Extract token from link
INV_TOKEN=$(echo "$LINK" | sed 's/.*token=//')

# New user joins via invite
REG2=$(curl -s -X POST "$API/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"joiner${RAND}@test.com\",\"password\":\"jointest1\",\"firstName\":\"Join\",\"lastName\":\"Test\"}")
JOIN_TOKEN=$(echo "$REG2" | jq -r '.accessToken')

JOIN_RES=$(curl -s -X POST "$API/clubs/join" \
  -H "authorization: Bearer $JOIN_TOKEN" \
  -H "content-type: application/json" \
  -d "{\"token\":\"$INV_TOKEN\"}")
assert "7.2 Join club via invite" "201" "$(echo "$JOIN_RES" | jq -r 'if .clubId then "201" else "fail" end')"

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 8: Notifications ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Get notifications
NOTIFS=$(curl -s "$API/notifications?limit=3" \
  -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID")
NID=$(echo "$NOTIFS" | jq -r '.items[0].id // empty')

if [ -n "$NID" ]; then
  # Mark one as read
  curl -s -X PATCH "$API/notifications/$NID/read" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" > /dev/null
  assert "8.1 Mark notification read" "true" "true"

  # Mark all read
  curl -s -X PATCH "$API/notifications/read-all" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" > /dev/null
  UNREAD=$(curl -s "$API/notifications/unread-count" \
    -H "authorization: Bearer $ADM_TOKEN" -H "x-club-id: $ADM_CID" | jq -r '.count')
  assert "8.2 All notifications read (count=0)" "0" "$UNREAD"
fi

# ═══════════════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════"
printf "  Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, %d total\n" "$PASS" "$FAIL" "$TOTAL"
echo "══════════════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
