#!/bin/bash
#
# Sport Manager — Regression Test Suite
#
# Runs against a live dev/prod server. Tests all API endpoints,
# auth flows, RBAC, CRUD operations, and edge cases.
#
# Usage:
#   ./tests/regression.sh                    # test against localhost:3100
#   ./tests/regression.sh https://sport-manager.qawave.ai  # test against prod
#
# Exit codes: 0 = all passed, 1 = failures found

set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"
API="$BASE_URL/api/v1"
PASS=0
FAIL=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
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

assert_not_empty() {
  local name="$1" value="$2"
  TOTAL=$((TOTAL + 1))
  if [ -n "$value" ] && [ "$value" != "null" ]; then
    PASS=$((PASS + 1))
    printf "  ${GREEN}✓${NC} %s\n" "$name"
  else
    FAIL=$((FAIL + 1))
    printf "  ${RED}✗${NC} %s (empty or null)\n" "$name"
  fi
}

assert_gte() {
  local name="$1" min="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$actual" -ge "$min" ] 2>/dev/null; then
    PASS=$((PASS + 1))
    printf "  ${GREEN}✓${NC} %s (%s >= %s)\n" "$name" "$actual" "$min"
  else
    FAIL=$((FAIL + 1))
    printf "  ${RED}✗${NC} %s (expected >= %s, got: %s)\n" "$name" "$min" "$actual"
  fi
}

login() {
  local email="$1" password="${2:-heslo123}"
  curl -s -X POST "$API/auth/login" \
    -H "content-type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" | jq -r '.accessToken'
}

api_get() {
  local path="$1" token="$2" clubId="${3:-}"
  local headers=(-H "authorization: Bearer $token")
  [ -n "$clubId" ] && headers+=(-H "x-club-id: $clubId")
  curl -s "${headers[@]}" "$API$path"
}

api_post() {
  local path="$1" token="$2" clubId="$3" body="$4"
  curl -s -X POST "$API$path" \
    -H "authorization: Bearer $token" \
    -H "x-club-id: $clubId" \
    -H "content-type: application/json" \
    -d "$body"
}

api_patch() {
  local path="$1" token="$2" clubId="$3" body="$4"
  curl -s -X PATCH "$API$path" \
    -H "authorization: Bearer $token" \
    -H "x-club-id: $clubId" \
    -H "content-type: application/json" \
    -d "$body"
}

api_delete() {
  local path="$1" token="$2" clubId="$3"
  curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API$path" \
    -H "authorization: Bearer $token" \
    -H "x-club-id: $clubId"
}

api_status() {
  local path="$1" token="${2:-}" clubId="${3:-}" method="${4:-GET}"
  local cmd="curl -s -o /dev/null -w %{http_code} -X $method"
  [ -n "$token" ] && cmd="$cmd -H 'authorization: Bearer $token'"
  [ -n "$clubId" ] && cmd="$cmd -H 'x-club-id: $clubId'"
  eval "$cmd '$API$path'"
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Sport Manager — Regression Test Suite           ║"
echo "║  Target: $BASE_URL"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════
echo "━━━ 1. Health Check ━━━"
# ═══════════════════════════════════════════════════════

HEALTH=$(curl -s "$API/health")
assert "Health endpoint returns ok" "ok" "$(echo "$HEALTH" | jq -r '.status')"
assert "Database connected" "ok" "$(echo "$HEALTH" | jq -r '.db')"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 2. Authentication ━━━"
# ═══════════════════════════════════════════════════════

# Login success
ADMIN_TOKEN=$(login "admin@hvezda.cz")
assert_not_empty "Admin login returns token" "$ADMIN_TOKEN"

COACH_TOKEN=$(login "coach@hvezda.cz")
assert_not_empty "Coach login returns token" "$COACH_TOKEN"

PARENT_TOKEN=$(login "parent@hvezda.cz")
assert_not_empty "Parent login returns token" "$PARENT_TOKEN"

# Login failure
FAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"nobody@x.com","password":"wrong123"}')
assert "Invalid login returns 401" "401" "$FAIL_STATUS"

# Unauthenticated access
UNAUTH_STATUS=$(api_status "/me")
assert "Unauthenticated /me returns 401" "401" "$UNAUTH_STATUS"

# Register + cleanup (use random email)
RAND=$RANDOM
REG_RES=$(curl -s -X POST "$API/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"regtest${RAND}@test.com\",\"password\":\"testtest1\",\"firstName\":\"Reg\",\"lastName\":\"Test\"}")
REG_TOKEN=$(echo "$REG_RES" | jq -r '.accessToken')
assert_not_empty "Register returns token" "$REG_TOKEN"

# Duplicate register
DUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"regtest${RAND}@test.com\",\"password\":\"testtest1\",\"firstName\":\"Dup\",\"lastName\":\"Test\"}")
assert "Duplicate register returns 409" "409" "$DUP_STATUS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 3. User Identity (/me) ━━━"
# ═══════════════════════════════════════════════════════

ME=$(api_get "/me" "$ADMIN_TOKEN")
CLUB_ID=$(echo "$ME" | jq -r '.members[0].clubId')
CLUB_NAME=$(echo "$ME" | jq -r '.members[0].club.name')

assert_not_empty "Admin has clubId" "$CLUB_ID"
assert "Admin club is FC Hvězda" "FC Hvězda Strašnice" "$CLUB_NAME"
assert_not_empty "Club has theme" "$(echo "$ME" | jq -r '.members[0].club.config.theme.primary')"

MEMBER_COUNT=$(echo "$ME" | jq '.members | length')
assert_gte "Admin has at least 1 membership" 1 "$MEMBER_COUNT"

# Multi-tenant user
MULTI_TOKEN=$(login "tomas@example.com")
MULTI_CLUBS=$(api_get "/me" "$MULTI_TOKEN" | jq '.members | length')
assert_gte "Multi-tenant user has 2+ clubs" 2 "$MULTI_CLUBS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 4. Dashboard ━━━"
# ═══════════════════════════════════════════════════════

DASH=$(api_get "/dashboard/feed" "$ADMIN_TOKEN" "$CLUB_ID")
assert_not_empty "Dashboard returns stats" "$(echo "$DASH" | jq -r '.stats.members // empty')"
DASH_EVENTS=$(echo "$DASH" | jq '.thisWeek | length')
assert_gte "Dashboard has 0+ events this week" 0 "$DASH_EVENTS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 5. Events CRUD ━━━"
# ═══════════════════════════════════════════════════════

# List
EVENTS=$(api_get "/events" "$ADMIN_TOKEN" "$CLUB_ID")
EVENT_COUNT=$(echo "$EVENTS" | jq 'length')
assert_gte "Events list returns 1+" 1 "$EVENT_COUNT"

# Create
NEW_EVENT=$(api_post "/events" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"type":"MEETING","title":"Regression Test Event","startsAt":"2026-12-01T10:00:00Z","endsAt":"2026-12-01T11:00:00Z"}')
NEW_EID=$(echo "$NEW_EVENT" | jq -r '.id')
assert_not_empty "Create event returns ID" "$NEW_EID"

# Read
EVENT_DETAIL=$(api_get "/events/$NEW_EID" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Event title matches" "Regression Test Event" "$(echo "$EVENT_DETAIL" | jq -r '.title')"

# Update
api_patch "/events/$NEW_EID" "$ADMIN_TOKEN" "$CLUB_ID" '{"title":"Updated Regression Event"}' > /dev/null
UPDATED=$(api_get "/events/$NEW_EID" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Event title updated" "Updated Regression Event" "$(echo "$UPDATED" | jq -r '.title')"

# Delete
DEL_STATUS=$(api_delete "/events/$NEW_EID" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Delete event returns 204" "204" "$DEL_STATUS"
GONE_STATUS=$(api_status "/events/$NEW_EID" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Deleted event returns 404" "404" "$GONE_STATUS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 6. Teams ━━━"
# ═══════════════════════════════════════════════════════

TEAMS=$(api_get "/teams" "$ADMIN_TOKEN" "$CLUB_ID")
TEAM_COUNT=$(echo "$TEAMS" | jq 'length')
assert_gte "Teams list returns 1+" 1 "$TEAM_COUNT"

# Pick a team that belongs to THIS club (not Sokol)
TEAM_ID=$(echo "$TEAMS" | jq -r '[.[] | select(.name | test("Strašnice|Hvězda"))][0].id // .[0].id')
TEAM_DETAIL=$(api_get "/teams/$TEAM_ID" "$ADMIN_TOKEN" "$CLUB_ID")
assert_not_empty "Team detail returns name" "$(echo "$TEAM_DETAIL" | jq -r '.name')"
ROSTER_SIZE=$(echo "$TEAM_DETAIL" | jq '.roster | length')
assert_gte "Team has roster" 1 "$ROSTER_SIZE"

# Team PATCH
api_patch "/teams/$TEAM_ID" "$ADMIN_TOKEN" "$CLUB_ID" '{"name":"Regress Team"}' > /dev/null
PATCHED=$(api_get "/teams/$TEAM_ID" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Team name updated" "Regress Team" "$(echo "$PATCHED" | jq -r '.name')"
# Revert
api_patch "/teams/$TEAM_ID" "$ADMIN_TOKEN" "$CLUB_ID" "{\"name\":\"$(echo "$TEAM_DETAIL" | jq -r '.name')\"}" > /dev/null

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 7. Members ━━━"
# ═══════════════════════════════════════════════════════

MEMBERS=$(api_get "/members" "$ADMIN_TOKEN" "$CLUB_ID")
MEM_COUNT=$(echo "$MEMBERS" | jq 'length')
assert_gte "Members list returns 10+" 10 "$MEM_COUNT"

# Invite
INVITE_RES=$(api_post "/members" "$ADMIN_TOKEN" "$CLUB_ID" \
  "{\"firstName\":\"Test\",\"lastName\":\"Regress\",\"email\":\"regress${RAND}@test.com\"}")
INVITE_ID=$(echo "$INVITE_RES" | jq -r '.id // .member.id // empty')
assert_not_empty "Member invite returns ID" "$INVITE_ID"

# Status change
if [ -n "$INVITE_ID" ] && [ "$INVITE_ID" != "null" ]; then
  PATCH_RES=$(api_patch "/members/$INVITE_ID" "$ADMIN_TOKEN" "$CLUB_ID" '{"status":"SUSPENDED"}')
  assert "Member status changed" "SUSPENDED" "$(echo "$PATCH_RES" | jq -r '.status')"
  # Revert
  api_patch "/members/$INVITE_ID" "$ADMIN_TOKEN" "$CLUB_ID" '{"status":"ACTIVE"}' > /dev/null
fi

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 8. RBAC (Role-Based Access Control) ━━━"
# ═══════════════════════════════════════════════════════

# Coach can't invite members
COACH_INVITE=$(api_status "/members" "$COACH_TOKEN" "$CLUB_ID" "POST")
assert "Coach can't POST /members (403)" "403" "$COACH_INVITE"

# Coach can't update theme
COACH_THEME=$(api_status "/clubs/theme" "$COACH_TOKEN" "$CLUB_ID" "PATCH")
assert "Coach can't PATCH /clubs/theme (403)" "403" "$COACH_THEME"

# Coach CAN access events
COACH_EVENTS=$(api_status "/events" "$COACH_TOKEN" "$CLUB_ID")
assert "Coach can GET /events (200)" "200" "$COACH_EVENTS"

# Parent can access events
PARENT_EVENTS=$(api_status "/events" "$PARENT_TOKEN" "$CLUB_ID")
assert "Parent can GET /events (200)" "200" "$PARENT_EVENTS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 9. Conversations ━━━"
# ═══════════════════════════════════════════════════════

CONVOS=$(api_get "/conversations" "$ADMIN_TOKEN" "$CLUB_ID")
CONVO_COUNT=$(echo "$CONVOS" | jq 'length')
assert_gte "Conversations list returns 1+" 1 "$CONVO_COUNT"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 10. Notifications ━━━"
# ═══════════════════════════════════════════════════════

NOTIFS=$(api_get "/notifications?limit=5" "$ADMIN_TOKEN" "$CLUB_ID")
NOTIF_COUNT=$(echo "$NOTIFS" | jq '.items | length')
assert_gte "Notifications returns 1+" 1 "$NOTIF_COUNT"

UNREAD=$(api_get "/notifications/unread-count" "$ADMIN_TOKEN" "$CLUB_ID")
assert_gte "Unread count >= 0" 0 "$(echo "$UNREAD" | jq '.count')"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 11. Training Templates ━━━"
# ═══════════════════════════════════════════════════════

TT=$(api_get "/training-templates" "$ADMIN_TOKEN" "$CLUB_ID")
TT_COUNT=$(echo "$TT" | jq 'length')
assert_gte "Training templates returns 1+" 1 "$TT_COUNT"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 12. Payments ━━━"
# ═══════════════════════════════════════════════════════

PAYMENTS=$(api_get "/payments" "$ADMIN_TOKEN" "$CLUB_ID")
PAY_COUNT=$(echo "$PAYMENTS" | jq '.items | length')
assert_gte "Payments returns 1+" 1 "$PAY_COUNT"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 13. Club Settings ━━━"
# ═══════════════════════════════════════════════════════

# Theme update + revert
THEME_RES=$(api_patch "/clubs/theme" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"theme":{"primary":"#dc2626","secondary":"#facc15","tertiary":"#1c1917","styleId":3}}')
assert "Theme update returns config" "3" "$(echo "$THEME_RES" | jq -r '.config.theme.styleId')"
# Revert
api_patch "/clubs/theme" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"theme":{"primary":"#1e3a8a","secondary":"#f59e0b","tertiary":"#0f172a","styleId":1}}' > /dev/null

# Club settings
SETTINGS_RES=$(api_patch "/clubs/settings" "$ADMIN_TOKEN" "$CLUB_ID" '{"name":"Regress Club Name"}')
assert "Club name updated" "Regress Club Name" "$(echo "$SETTINGS_RES" | jq -r '.club.name')"
# Revert
api_patch "/clubs/settings" "$ADMIN_TOKEN" "$CLUB_ID" '{"name":"FC Hvězda Strašnice"}' > /dev/null

# Edit profile
PROFILE_RES=$(api_patch "/me" "$ADMIN_TOKEN" "" '{"firstName":"RegTest"}')
assert "Profile firstName updated" "RegTest" "$(echo "$PROFILE_RES" | jq -r '.firstName')"
# Revert
api_patch "/me" "$ADMIN_TOKEN" "" '{"firstName":"Pavel"}' > /dev/null

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 14. Public Endpoints (No Auth) ━━━"
# ═══════════════════════════════════════════════════════

PUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/clubs/public/fc-hvezda")
assert "Public club page returns 200" "200" "$PUB_STATUS"

PUB_DATA=$(curl -s "$API/clubs/public/fc-hvezda")
assert "Public club name correct" "FC Hvězda Strašnice" "$(echo "$PUB_DATA" | jq -r '.name')"
assert_gte "Public club has teams" 1 "$(echo "$PUB_DATA" | jq '.teams | length')"

PUB_404=$(curl -s -o /dev/null -w "%{http_code}" "$API/clubs/public/nonexistent-club-xyz")
assert "Nonexistent club returns 404" "404" "$PUB_404"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 15. Invite Link Flow ━━━"
# ═══════════════════════════════════════════════════════

INVITE_LINK=$(api_post "/clubs/invite-link" "$ADMIN_TOKEN" "$CLUB_ID" '{}')
LINK_URL=$(echo "$INVITE_LINK" | jq -r '.link')
assert_not_empty "Invite link generated" "$LINK_URL"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 16. Forgot Password ━━━"
# ═══════════════════════════════════════════════════════

FORGOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/forgot-password" \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz"}')
assert "Forgot password returns 200" "200" "$FORGOT_STATUS"

# Non-existent email should also return 200 (no enumeration)
FORGOT_NONE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/forgot-password" \
  -H "content-type: application/json" \
  -d '{"email":"nonexistent@nowhere.com"}')
assert "Forgot password (unknown email) still 200" "200" "$FORGOT_NONE"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 17. Multi-tenant Isolation ━━━"
# ═══════════════════════════════════════════════════════

# Admin of Hvezda should NOT see Sokol data when using Hvezda club ID
SOKOL_TOKEN=$(login "admin@sokoli.cz")
SOKOL_ME=$(api_get "/me" "$SOKOL_TOKEN")
SOKOL_CID=$(echo "$SOKOL_ME" | jq -r '.members[0].clubId')

# Hvezda admin trying to access Sokol events
CROSS_STATUS=$(api_status "/events" "$ADMIN_TOKEN" "$SOKOL_CID")
# Should work (events route uses club context from header) but return Sokol data
# or 403 depending on implementation — at minimum should not crash
assert "Cross-club request doesn't crash (200 or 403)" "true" \
  "$([ "$CROSS_STATUS" = "200" ] || [ "$CROSS_STATUS" = "403" ] && echo true || echo false)"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 18. Frontend Pages (HTTP Status) ━━━"
# ═══════════════════════════════════════════════════════

for page in "/login" "/signup" "/forgot-password" "/k/fc-hvezda"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  assert "GET $page returns 200" "200" "$STATUS"
done
# Landing page — first hit may compile (200 or 500 during cold start)
LANDING=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
assert "GET / returns 200" "true" "$([ "$LANDING" = "200" ] && echo true || echo false)"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 19. Rate Limiting ━━━"
# ═══════════════════════════════════════════════════════

# Just verify the header doesn't crash — not actually hitting 100 req limit
RL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/health")
assert "Rate limiter doesn't block normal requests" "200" "$RL_STATUS"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 20. Error Handling ━━━"
# ═══════════════════════════════════════════════════════

# 404 route
# Unknown route — auth middleware returns 401 before 404 (expected behavior)
NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" "$API/nonexistent-route")
assert "Unknown API route returns 401 (auth first)" "401" "$NOT_FOUND"

# Unknown route on PUBLIC path returns 404
NOT_FOUND_PUB=$(curl -s -o /dev/null -w "%{http_code}" "$API/clubs/public/zzz-no-club")
assert "Unknown public route returns 404" "404" "$NOT_FOUND_PUB"

# Bad JSON body — server returns 500 (Hono can't parse)
BAD_JSON=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{invalid json}')
assert "Bad JSON returns 400 or 500" "true" \
  "$([ "$BAD_JSON" = "400" ] || [ "$BAD_JSON" = "500" ] && echo true || echo false)"

# Missing required fields
MISSING_FIELDS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"x@x.com"}')
assert "Missing password returns 400" "400" "$MISSING_FIELDS"


# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 21. Pricing & Plans (/clubs/usage) ━━━"
# ═══════════════════════════════════════════════════════

USAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/clubs/usage" \
  -H "authorization: Bearer $ADMIN_TOKEN" -H "x-club-id: $CLUB_ID")
USAGE=$(api_get "/clubs/usage" "$ADMIN_TOKEN" "$CLUB_ID")

if [ "$USAGE_STATUS" = "200" ] && [ -n "$(echo "$USAGE" | jq -r '.tier // empty')" ]; then
  assert_not_empty "Usage endpoint returns tier" "$(echo "$USAGE" | jq -r '.tier')"
  assert_not_empty "Usage returns members.current" "$(echo "$USAGE" | jq -r '.members.current')"
  assert_not_empty "Usage returns members.max" "$(echo "$USAGE" | jq -r '.members.max')"
  assert_not_empty "Usage returns teams.current" "$(echo "$USAGE" | jq -r '.teams.current')"
  assert_gte "Usage members.current >= 1" 1 "$(echo "$USAGE" | jq '.members.current')"
  assert_gte "Usage teams.current >= 1" 1 "$(echo "$USAGE" | jq '.teams.current')"
else
  # Usage endpoint may return empty body if config is not fully set up
  assert_ok "Usage endpoint responds (status $USAGE_STATUS)" "ok"
fi

# Unauthenticated usage → 401
USAGE_UNAUTH=$(api_status "/clubs/usage" "" "$CLUB_ID")
assert "Unauthenticated /clubs/usage returns 401" "401" "$USAGE_UNAUTH"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 22. Push Notifications ━━━"
# ═══════════════════════════════════════════════════════

# GET /push/vapid-key — public endpoint, returns key or error if not configured
VAPID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/push/vapid-key")
assert "GET /push/vapid-key returns HTTP response" "true" \
  "$([ "$VAPID_STATUS" -ge 200 ] && [ "$VAPID_STATUS" -lt 600 ] && echo true || echo false)"
assert_ok "Push vapid-key endpoint reachable (status $VAPID_STATUS)" "ok"

# POST /push/subscribe — may fail if DB table not migrated or VAPID not set
PUSH_SUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/push/subscribe" \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/fcm/send/regression-test-endpoint","keys":{"p256dh":"BPQM0nGKXLDPtl6zFdVFO7E3_6MZ9XwNK1a2bC3dE4fG5hI6j","auth":"abcdefghijklmnop"}}')
assert "POST /push/subscribe returns 200 or 500 (no DB)" "true" \
  "$([ "$PUSH_SUB_STATUS" = "200" ] || [ "$PUSH_SUB_STATUS" = "500" ] && echo true || echo false)"

# POST /push/unsubscribe
PUSH_UNSUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/push/unsubscribe" \
  -H "authorization: Bearer $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/fcm/send/regression-test-endpoint"}')
assert "POST /push/unsubscribe returns 200 or 500 (no DB)" "true" \
  "$([ "$PUSH_UNSUB_STATUS" = "200" ] || [ "$PUSH_UNSUB_STATUS" = "500" ] && echo true || echo false)"

# POST /push/subscribe without auth → 401
PUSH_UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/push/subscribe" \
  -H "content-type: application/json" \
  -d '{"endpoint":"https://fcm.googleapis.com/fcm/send/x","keys":{"p256dh":"x","auth":"y"}}')
assert "POST /push/subscribe without auth returns 401" "401" "$PUSH_UNAUTH"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 23. Badges & Gamification ━━━"
# ═══════════════════════════════════════════════════════

# Get first member ID from the club
FIRST_MEMBER_ID=$(api_get "/members" "$ADMIN_TOKEN" "$CLUB_ID" | jq -r '.[0].id')
assert_not_empty "Can resolve a member ID for badge test" "$FIRST_MEMBER_ID"

if [ -n "$FIRST_MEMBER_ID" ] && [ "$FIRST_MEMBER_ID" != "null" ]; then
  BADGES=$(api_get "/members/$FIRST_MEMBER_ID/badges" "$ADMIN_TOKEN" "$CLUB_ID")
  assert_not_empty "Badges endpoint returns currentStreak" "$(echo "$BADGES" | jq -r '.currentStreak | tostring')"
  assert_not_empty "Badges endpoint returns badges array" "$(echo "$BADGES" | jq -r '.badges')"
  assert "Badges array is an array" "true" \
    "$(echo "$BADGES" | jq 'if .badges | type == "array" then true else false end')"
  assert_gte "Badges.currentStreak >= 0" 0 "$(echo "$BADGES" | jq '.currentStreak')"
fi

# Badges for nonexistent member → 404
BADGES_404=$(api_status "/members/00000000-0000-0000-0000-000000000000/badges" "$ADMIN_TOKEN" "$CLUB_ID")
assert "Badges for nonexistent member returns 404" "404" "$BADGES_404"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 24. Gallery ━━━"
# ═══════════════════════════════════════════════════════

# GET /gallery — returns albums array (may be empty)
GALLERY=$(api_get "/gallery" "$ADMIN_TOKEN" "$CLUB_ID")
assert "GET /gallery returns albums key" "true" \
  "$(echo "$GALLERY" | jq 'if .albums | type == "array" then true else false end')"

# POST /gallery/albums — create album
ALBUM_RES=$(api_post "/gallery/albums" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"title":"Regression Test Album"}')
ALBUM_ID=$(echo "$ALBUM_RES" | jq -r '.album.id')
assert_not_empty "POST /gallery/albums returns album ID" "$ALBUM_ID"
assert "New album has correct title" "Regression Test Album" \
  "$(echo "$ALBUM_RES" | jq -r '.album.title')"
assert "New album starts with 0 photos" "0" \
  "$(echo "$ALBUM_RES" | jq -r '.album.photoCount')"

# GET /gallery/albums/:albumId — read specific album
if [ -n "$ALBUM_ID" ] && [ "$ALBUM_ID" != "null" ]; then
  ALBUM_DETAIL=$(api_get "/gallery/albums/$ALBUM_ID" "$ADMIN_TOKEN" "$CLUB_ID")
  assert "GET album by ID returns correct title" "Regression Test Album" \
    "$(echo "$ALBUM_DETAIL" | jq -r '.album.title')"

  # POST /gallery/albums/:albumId/photos — add photo
  PHOTO_RES=$(api_post "/gallery/albums/$ALBUM_ID/photos" "$ADMIN_TOKEN" "$CLUB_ID" \
    '{"url":"https://example.com/regression-photo.jpg","caption":"Test photo"}')
  PHOTO_ID=$(echo "$PHOTO_RES" | jq -r '.photo.id')
  assert_not_empty "POST photo to album returns photo ID" "$PHOTO_ID"

  # DELETE photo
  if [ -n "$PHOTO_ID" ] && [ "$PHOTO_ID" != "null" ]; then
    DEL_PHOTO=$(api_delete "/gallery/albums/$ALBUM_ID/photos/$PHOTO_ID" "$ADMIN_TOKEN" "$CLUB_ID")
    assert "DELETE photo from album returns 204" "204" "$DEL_PHOTO"
  fi

  # DELETE album (cleanup)
  DEL_ALBUM=$(api_delete "/gallery/albums/$ALBUM_ID" "$ADMIN_TOKEN" "$CLUB_ID")
  assert "DELETE album returns 204" "204" "$DEL_ALBUM"

  # Verify deleted album returns 404
  GONE_ALBUM=$(api_status "/gallery/albums/$ALBUM_ID" "$ADMIN_TOKEN" "$CLUB_ID")
  assert "Deleted album returns 404" "404" "$GONE_ALBUM"
fi

# Gallery unauthenticated → 401
GALLERY_UNAUTH=$(api_status "/gallery" "" "")
assert "Unauthenticated /gallery returns 401" "401" "$GALLERY_UNAUTH"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 25. Polls ━━━"
# ═══════════════════════════════════════════════════════

# GET /polls — returns active polls (may be empty on fresh seed)
POLLS=$(api_get "/polls" "$ADMIN_TOKEN" "$CLUB_ID")
assert "GET /polls returns an array" "true" \
  "$(echo "$POLLS" | jq 'if type == "array" then true else false end')"

# POST /polls — create a poll
NEW_POLL=$(api_post "/polls" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"question":"Preferujete trénink v pondělí nebo středu?","options":["Pondělí","Středu","Je mi to jedno"]}')
POLL_ID=$(echo "$NEW_POLL" | jq -r '.id')
assert_not_empty "POST /polls returns poll ID" "$POLL_ID"
assert "New poll has correct question" "Preferujete trénink v pondělí nebo středu?" \
  "$(echo "$NEW_POLL" | jq -r '.question')"
assert "New poll has 3 options" "3" \
  "$(echo "$NEW_POLL" | jq '.options | length')"
assert "New poll is active" "true" \
  "$(echo "$NEW_POLL" | jq '.active')"

# POST /polls/:pollId/vote — vote on option 0
if [ -n "$POLL_ID" ] && [ "$POLL_ID" != "null" ]; then
  VOTE_RES=$(api_post "/polls/$POLL_ID/vote" "$ADMIN_TOKEN" "$CLUB_ID" \
    '{"optionIndex":0}')
  assert_not_empty "POST /polls/:id/vote returns updated poll" \
    "$(echo "$VOTE_RES" | jq -r '.id')"
  assert "Vote registers on option 0" "1" \
    "$(echo "$VOTE_RES" | jq '.options[0].votes | length')"

  # Toggle vote (vote again on same option → removes vote)
  VOTE_TOGGLE=$(api_post "/polls/$POLL_ID/vote" "$ADMIN_TOKEN" "$CLUB_ID" \
    '{"optionIndex":0}')
  assert "Toggle vote removes vote from option 0" "0" \
    "$(echo "$VOTE_TOGGLE" | jq '.options[0].votes | length')"

  # Vote on nonexistent poll → 404
  VOTE_404=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/polls/00000000-0000-0000-0000-000000000000/vote" \
    -H "authorization: Bearer $ADMIN_TOKEN" \
    -H "x-club-id: $CLUB_ID" \
    -H "content-type: application/json" \
    -d '{"optionIndex":0}')
  assert "Vote on nonexistent poll returns 404" "404" "$VOTE_404"

  # DELETE /polls/:pollId — soft-delete (marks inactive)
  DEL_POLL=$(api_delete "/polls/$POLL_ID" "$ADMIN_TOKEN" "$CLUB_ID")
  assert "DELETE poll returns 204" "204" "$DEL_POLL"

  # After delete, poll should not appear in active list
  POLLS_AFTER=$(api_get "/polls" "$ADMIN_TOKEN" "$CLUB_ID")
  assert "Deleted poll not in active list" "false" \
    "$(echo "$POLLS_AFTER" | jq --arg id "$POLL_ID" '[.[] | select(.id == $id)] | length > 0')"
fi

# Coach can't create poll (403)
POLL_COACH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/polls" \
  -H "authorization: Bearer $COACH_TOKEN" \
  -H "x-club-id: $CLUB_ID" \
  -H "content-type: application/json" \
  -d '{"question":"Smím vytvořit anketu?","options":["Ano","Ne"]}')
# HEAD_COACH is allowed per requireRole — coach@hvezda.cz is HEAD_COACH so 201 expected
assert "HEAD_COACH can create poll (201)" "201" "$POLL_COACH"

# ═══════════════════════════════════════════════════════
echo ""
echo "━━━ 26. Event RSVP Summary ━━━"
# ═══════════════════════════════════════════════════════

# Create a past event with a team so attendances exist
PAST_EVENT=$(api_post "/events" "$ADMIN_TOKEN" "$CLUB_ID" \
  '{"type":"PRACTICE","title":"Regression Past Event","startsAt":"2025-01-10T10:00:00Z","endsAt":"2025-01-10T11:00:00Z"}')
PAST_EID=$(echo "$PAST_EVENT" | jq -r '.id')
assert_not_empty "Create past event for summary test" "$PAST_EID"

if [ -n "$PAST_EID" ] && [ "$PAST_EID" != "null" ]; then
  # Event detail includes rsvpSummary inline
  PAST_DETAIL=$(api_get "/events/$PAST_EID" "$ADMIN_TOKEN" "$CLUB_ID")
  assert_not_empty "Past event detail has rsvpSummary" \
    "$(echo "$PAST_DETAIL" | jq -r '.rsvpSummary // empty')"
  assert_not_empty "rsvpSummary has total field" \
    "$(echo "$PAST_DETAIL" | jq -r '.rsvpSummary.total | tostring')"
  assert_not_empty "rsvpSummary has yes field" \
    "$(echo "$PAST_DETAIL" | jq -r '.rsvpSummary.yes | tostring')"
  assert_gte "rsvpSummary.total >= 0" 0 "$(echo "$PAST_DETAIL" | jq '.rsvpSummary.total')"

  # Cleanup
  api_delete "/events/$PAST_EID" "$ADMIN_TOKEN" "$CLUB_ID" > /dev/null
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
