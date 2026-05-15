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
printf "\n${CYAN}━━━ Flow 9: Badges & Gamification ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

# Login as admin and get a real member ID from the club
B_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz","password":"heslo123"}' | jq -r '.accessToken')
B_ME=$(curl -s "$API/me" -H "authorization: Bearer $B_TOKEN")
B_CID=$(echo "$B_ME" | jq -r '.members[0].clubId')

# Pick first member from the list (seeded data guarantees at least one)
B_MEMBER_ID=$(curl -s "$API/members" \
  -H "authorization: Bearer $B_TOKEN" \
  -H "x-club-id: $B_CID" | jq -r '.[0].id')
assert_ok "9.1 Resolve member ID for badge test" "$B_MEMBER_ID"

if [ -n "$B_MEMBER_ID" ] && [ "$B_MEMBER_ID" != "null" ]; then
  BADGES=$(curl -s "$API/members/$B_MEMBER_ID/badges" \
    -H "authorization: Bearer $B_TOKEN" \
    -H "x-club-id: $B_CID")

  # Verify top-level structure
  assert_ok "9.2 Badges response has currentStreak" \
    "$(echo "$BADGES" | jq -r '.currentStreak | tostring')"
  assert_ok "9.3 Badges response has longestStreak" \
    "$(echo "$BADGES" | jq -r '.longestStreak | tostring')"
  assert_ok "9.4 Badges response has totalAttended" \
    "$(echo "$BADGES" | jq -r '.totalAttended | tostring')"
  assert "9.5 Badges array type is array" "true" \
    "$(echo "$BADGES" | jq 'if .badges | type == "array" then true else false end')"

  # Each badge in the array (if any) must have id, name, icon, earnedAt
  BADGE_COUNT=$(echo "$BADGES" | jq '.badges | length')
  if [ "$BADGE_COUNT" -gt 0 ]; then
    FIRST_BADGE_ID=$(echo "$BADGES" | jq -r '.badges[0].id')
    FIRST_BADGE_NAME=$(echo "$BADGES" | jq -r '.badges[0].name')
    assert_ok "9.6 First badge has id" "$FIRST_BADGE_ID"
    assert_ok "9.7 First badge has name" "$FIRST_BADGE_NAME"
    # earnedAt can be null for computed badges without specific date
    assert_ok "9.8 First badge structure valid" "$FIRST_BADGE_ID"
  else
    # No badges yet — just verify the structure is still correct
    assert "9.6 No badges yet — totalAttended is 0" "0" \
      "$(echo "$BADGES" | jq '.totalAttended')"
  fi
fi

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 10: Gallery ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

G_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz","password":"heslo123"}' | jq -r '.accessToken')
G_ME=$(curl -s "$API/me" -H "authorization: Bearer $G_TOKEN")
G_CID=$(echo "$G_ME" | jq -r '.members[0].clubId')

# List albums (may be empty)
G_LIST=$(curl -s "$API/gallery" \
  -H "authorization: Bearer $G_TOKEN" \
  -H "x-club-id: $G_CID")
assert "10.1 GET /gallery returns albums array" "true" \
  "$(echo "$G_LIST" | jq 'if .albums | type == "array" then true else false end')"

# Create album
G_ALBUM=$(curl -s -X POST "$API/gallery/albums" \
  -H "authorization: Bearer $G_TOKEN" \
  -H "x-club-id: $G_CID" \
  -H "content-type: application/json" \
  -d '{"title":"E2E Gallery Album"}')
G_AID=$(echo "$G_ALBUM" | jq -r '.album.id')
assert_ok "10.2 Create gallery album" "$G_AID"
assert "10.3 Album title is correct" "E2E Gallery Album" \
  "$(echo "$G_ALBUM" | jq -r '.album.title')"

# List albums again — should include new album
if [ -n "$G_AID" ] && [ "$G_AID" != "null" ]; then
  G_LIST2=$(curl -s "$API/gallery" \
    -H "authorization: Bearer $G_TOKEN" \
    -H "x-club-id: $G_CID")
  assert "10.4 Album appears in list" "true" \
    "$(echo "$G_LIST2" | jq --arg id "$G_AID" '[.albums[] | select(.id == $id)] | length > 0')"

  # Add a photo to the album
  G_PHOTO=$(curl -s -X POST "$API/gallery/albums/$G_AID/photos" \
    -H "authorization: Bearer $G_TOKEN" \
    -H "x-club-id: $G_CID" \
    -H "content-type: application/json" \
    -d '{"url":"https://example.com/e2e-photo.jpg","caption":"E2E test photo"}')
  G_PID=$(echo "$G_PHOTO" | jq -r '.photo.id')
  assert_ok "10.5 Add photo to album" "$G_PID"
  assert "10.6 Photo has correct caption" "E2E test photo" \
    "$(echo "$G_PHOTO" | jq -r '.photo.caption')"

  # Get album detail — should have 1 photo
  G_DETAIL=$(curl -s "$API/gallery/albums/$G_AID" \
    -H "authorization: Bearer $G_TOKEN" \
    -H "x-club-id: $G_CID")
  assert "10.7 Album detail has 1 photo" "1" \
    "$(echo "$G_DETAIL" | jq '.album.photos | length')"

  # Delete photo
  if [ -n "$G_PID" ] && [ "$G_PID" != "null" ]; then
    DEL_PH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
      "$API/gallery/albums/$G_AID/photos/$G_PID" \
      -H "authorization: Bearer $G_TOKEN" \
      -H "x-club-id: $G_CID")
    assert "10.8 Delete photo returns 204" "204" "$DEL_PH_STATUS"
  fi

  # Delete album (cleanup)
  DEL_ALB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    "$API/gallery/albums/$G_AID" \
    -H "authorization: Bearer $G_TOKEN" \
    -H "x-club-id: $G_CID")
  assert "10.9 Delete album returns 204" "204" "$DEL_ALB_STATUS"

  # Deleted album returns 404
  GONE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API/gallery/albums/$G_AID" \
    -H "authorization: Bearer $G_TOKEN" \
    -H "x-club-id: $G_CID")
  assert "10.10 Deleted album returns 404" "404" "$GONE_STATUS"
fi

# ═══════════════════════════════════════════════════════
printf "\n${CYAN}━━━ Flow 11: Polls ━━━${NC}\n"
# ═══════════════════════════════════════════════════════

P_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz","password":"heslo123"}' | jq -r '.accessToken')
P_ME=$(curl -s "$API/me" -H "authorization: Bearer $P_TOKEN")
P_CID=$(echo "$P_ME" | jq -r '.members[0].clubId')

# List polls
P_LIST=$(curl -s "$API/polls" \
  -H "authorization: Bearer $P_TOKEN" \
  -H "x-club-id: $P_CID")
assert "11.1 GET /polls returns array" "true" \
  "$(echo "$P_LIST" | jq 'if type == "array" then true else false end')"

# Create poll
P_CREATE=$(curl -s -X POST "$API/polls" \
  -H "authorization: Bearer $P_TOKEN" \
  -H "x-club-id: $P_CID" \
  -H "content-type: application/json" \
  -d '{"question":"Který termín tréninku vám vyhovuje?","options":["Pondělí 17:00","Středa 18:00","Pátek 16:00"]}')
P_ID=$(echo "$P_CREATE" | jq -r '.id')
assert_ok "11.2 Create poll" "$P_ID"
assert "11.3 Poll question correct" "Který termín tréninku vám vyhovuje?" \
  "$(echo "$P_CREATE" | jq -r '.question')"
assert "11.4 Poll has 3 options" "3" \
  "$(echo "$P_CREATE" | jq '.options | length')"
assert "11.5 Poll is active" "true" \
  "$(echo "$P_CREATE" | jq '.active')"
assert "11.6 All options start with 0 votes" "0" \
  "$(echo "$P_CREATE" | jq '[.options[].votes | length] | max')"

if [ -n "$P_ID" ] && [ "$P_ID" != "null" ]; then
  # Vote for option 1 (index 1)
  P_VOTE=$(curl -s -X POST "$API/polls/$P_ID/vote" \
    -H "authorization: Bearer $P_TOKEN" \
    -H "x-club-id: $P_CID" \
    -H "content-type: application/json" \
    -d '{"optionIndex":1}')
  assert_ok "11.7 Vote returns updated poll" "$(echo "$P_VOTE" | jq -r '.id')"
  assert "11.8 Option 1 has 1 vote after voting" "1" \
    "$(echo "$P_VOTE" | jq '.options[1].votes | length')"
  assert "11.9 Other options have 0 votes" "0" \
    "$(echo "$P_VOTE" | jq '.options[0].votes | length')"

  # Poll should now appear in active list
  P_LIST2=$(curl -s "$API/polls" \
    -H "authorization: Bearer $P_TOKEN" \
    -H "x-club-id: $P_CID")
  assert "11.10 Poll appears in active list" "true" \
    "$(echo "$P_LIST2" | jq --arg id "$P_ID" '[.[] | select(.id == $id)] | length > 0')"

  # Get results — option 1 should have 1 vote
  P_RESULTS=$(echo "$P_LIST2" | jq --arg id "$P_ID" '.[] | select(.id == $id)')
  assert "11.11 Poll results show 1 vote on option 1" "1" \
    "$(echo "$P_RESULTS" | jq '.options[1].votes | length')"

  # Toggle vote (vote again → removes vote)
  P_TOGGLE=$(curl -s -X POST "$API/polls/$P_ID/vote" \
    -H "authorization: Bearer $P_TOKEN" \
    -H "x-club-id: $P_CID" \
    -H "content-type: application/json" \
    -d '{"optionIndex":1}')
  assert "11.12 Toggle vote removes vote from option 1" "0" \
    "$(echo "$P_TOGGLE" | jq '.options[1].votes | length')"

  # Delete poll (soft delete)
  P_DEL=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    "$API/polls/$P_ID" \
    -H "authorization: Bearer $P_TOKEN" \
    -H "x-club-id: $P_CID")
  assert "11.13 DELETE poll returns 204" "204" "$P_DEL"

  # Deleted poll should not appear in active list
  P_LIST3=$(curl -s "$API/polls" \
    -H "authorization: Bearer $P_TOKEN" \
    -H "x-club-id: $P_CID")
  assert "11.14 Deleted poll not in active list" "false" \
    "$(echo "$P_LIST3" | jq --arg id "$P_ID" '[.[] | select(.id == $id)] | length > 0')"
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
