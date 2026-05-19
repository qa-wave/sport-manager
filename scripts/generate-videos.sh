#!/bin/bash
# Generate training drill videos via Higgsfield Seedance 2.0
# Runs in parallel batches, outputs JSON mapping {drillId: resultUrl}

set -euo pipefail
MODEL="seedance_2_0"
RESULTS_FILE="scripts/video-results.json"
TEMP_DIR="scripts/video-tmp"
mkdir -p "$TEMP_DIR"
echo "{}" > "$RESULTS_FILE"

declare -A PROMPTS

# Florbal
PROMPTS[fl1]="Indoor floorball training: two players passing a floorball while running across a sports hall, forehand passes, bright gym lighting, coaching footage"
PROMPTS[fl2]="Indoor floorball: player practicing drag shot with floorball stick, forehand side, shooting at goal, sports hall, coaching drill footage"
PROMPTS[fl3]="Indoor floorball 2v1 attack drill: two attackers against one defender, wall pass and finish, sports hall, dynamic camera"
PROMPTS[fl4]="Indoor floorball dribbling drill: players weaving through cone gates with floorball stick and ball, sports hall, training footage"
PROMPTS[fl5]="Indoor floorball: player passes behind the goal, teammate receives and shoots in front of goal, typical floorball combination play"
PROMPTS[fl6]="Indoor floorball 3v2 attack drill: three attackers vs two defenders, crossing runs and finish, sports hall, coaching footage"
PROMPTS[fl7]="Indoor floorball defensive box drill: four defenders holding compact shape blocking shots, sports hall, training footage"
PROMPTS[fl8]="Indoor floorball small-sided game: teams scoring by passing ball off end boards to teammate, fast-paced, sports hall"

# Warmup
PROMPTS[w5]="Youth soccer warmup: children dribbling through colorful cone gates on grass pitch, coach pointing directions, bright daylight, fun training atmosphere"
PROMPTS[w6]="Youth soccer warmup game: kids dribbling and trying to kick away each others balls, fun chase game on grass pitch, bright daylight"
PROMPTS[w7]="Soccer rondo 5v2 drill: five players keeping possession in circle against two defenders, two-touch limit, green grass pitch, training footage"
PROMPTS[w8]="Soccer reaction drill: players in line doing short sprints on coaches command, changing direction quickly, grass pitch, athletic training"
PROMPTS[w9]="Soccer warmup: small group passing and moving to new position after each pass, players rotating spots, green pitch, light activation drill"

# Passing
PROMPTS[p6]="Youth soccer passing drill: pairs scoring points by passing through small cone gates, children on grass pitch, fun competitive training"
PROMPTS[p7]="Soccer diamond passing drill: four players passing in diamond shape and following the ball to next position, smooth rhythm, grass pitch"
PROMPTS[p8]="Soccer third-man run drill: three players combining with through ball behind defender line, grass pitch, coaching footage"
PROMPTS[p9]="Soccer 4v2 rondo transitioning between two adjacent zones, players reacting to ball movement, tactical possession drill, grass pitch"
PROMPTS[p10]="Soccer switching play drill: defenders and midfielder passing to change side of attack through center back, patient build-up, grass pitch"
PROMPTS[p11]="Soccer wall pass drill: pair practicing give-and-go combination around a cone, one-two passing, grass pitch, training footage"
PROMPTS[p12]="Soccer passing under pressure in circle: players on outside passing to middle player who turns under pressure from defender, grass pitch"

# Shooting
PROMPTS[s5]="Soccer finishing drill: wide player cuts to byline and plays cutback pass for teammate to shoot at goal, grass pitch, dynamic camera"
PROMPTS[s6]="Soccer 2v1 finishing drill: two attackers against one defender shooting on goal, quick decision making, grass pitch, training footage"
PROMPTS[s7]="Soccer rebound drill: player shoots on goal then immediately follows up for second chance rebound, grass pitch, goalkeeper diving"
PROMPTS[s8]="Soccer turn and shoot drill: striker receives ball with back to goal, turns with first touch and shoots quickly, grass pitch"
PROMPTS[s9]="Youth soccer target shooting: young player aiming at colored corners of the goal, visual targets, grass pitch, coaching drill"
PROMPTS[s10]="Soccer pressing and shooting drill: team wins ball high up the pitch and immediately shoots on goal, counter-press finish, grass pitch"
PROMPTS[s11]="Soccer crossing drill: winger delivers cross, first attacker goes near post second covers far post, header and volley finishing"

# Dribbling
PROMPTS[d5]="Youth soccer dribbling through gates: players collecting points by dribbling through as many cone gates as possible, grass pitch, fun drill"
PROMPTS[d6]="Soccer 1v1 escape drill: attacker must dribble out of square through one of four gates, defender reads movement, grass pitch"
PROMPTS[d7]="Soccer weak foot dribbling: player navigating tight cone maze using only weaker foot, controlled touches, grass pitch, close-up"
PROMPTS[d8]="Soccer 1v1 to four goals: attacker choosing between four mini goals based on defender position, creative dribbling, grass pitch"
PROMPTS[d9]="Soccer ball mastery drill in small box: player doing sole rolls, inside-outside touches, turns, individual technique work, grass pitch close-up"
PROMPTS[d10]="Soccer dribble and pass drill: player beats mannequin defender with skill move then delivers accurate pass to running teammate, grass pitch"

# Defending
PROMPTS[def4]="Soccer 1v2 defensive delay drill: single defender facing two attackers, slowing down counter-attack waiting for help, grass pitch"
PROMPTS[def5]="Soccer 2v2 defensive corridor drill: two defenders working together, one pressing one covering, in narrow channel, grass pitch"
PROMPTS[def6]="Soccer counter-pressing drill: team immediately pressing to win ball back within three seconds after losing possession, intense, grass pitch"
PROMPTS[def7]="Soccer defensive line movement drill: back four shifting position following the ball, maintaining distances, organized defending, grass pitch"
PROMPTS[def8]="Soccer shot blocking drill: defender rushing out to block striker shot with proper technique, no sliding, grass pitch, training footage"

# Fitness
PROMPTS[f4]="Soccer agility ladder drill with ball: player does quick feet through ladder then immediately controls a passed ball, grass pitch, athletic"
PROMPTS[f5]="Soccer repeated sprint drill with ball: player doing series of short sprints alternating with and without ball, high intensity, grass pitch"
PROMPTS[f6]="Soccer fitness drill: player passes ball then immediately changes direction sprinting to cone, game-related conditioning, grass pitch"
PROMPTS[f7]="Intense 4v4 small-sided soccer game for fitness: high pressing, quick transitions, possession-based conditioning, grass pitch, sweating players"

# Tactics
PROMPTS[t4]="Soccer three-zone build-up drill: team progressing ball through three zones learning when to play short or switch, tactical, grass pitch"
PROMPTS[t5]="Soccer 3v2 fast counter-attack drill: three attackers sprinting against two defenders after winning ball, quick decisions, grass pitch"
PROMPTS[t6]="Soccer pressing triggers drill 6v4: defending team reacts to bad touch or sideline pass to start coordinated press, tactical training"
PROMPTS[t7]="Soccer wing overload drill: fullback, winger and midfielder creating numerical advantage on flank, overlapping runs, grass pitch"
PROMPTS[t8]="Soccer small-sided game with neutral wide players on sidelines, team using width to switch play, tactical possession, grass pitch"
PROMPTS[t9]="Soccer rest defense drill: team attacks but maintains defensive shape, reacting to counter-attack after losing ball, tactical, grass pitch"
PROMPTS[t10]="Soccer goalkeeper build-up drill: goalkeeper and defenders playing out from back against pressing forwards, patient possession, grass pitch"

# Goalkeeping
PROMPTS[gk3]="Soccer goalkeeper drill: keeper diving low to both sides saving ground shots, proper falling technique, grass pitch, close-up coaching footage"
PROMPTS[gk4]="Soccer goalkeeper 1v1 drill: keeper rushing out to narrow angle against oncoming striker, proper positioning and timing, grass pitch"
PROMPTS[gk5]="Soccer goalkeeper cross drill: keeper dealing with crossed balls, deciding to catch punch or command defenders, grass pitch, aerial training"
PROMPTS[gk6]="Soccer goalkeeper footwork drill: keeper receiving back-pass, controlling under pressure and distributing to correct side, grass pitch"

# Game
PROMPTS[g4]="Youth soccer 2v2 tournament: short intense matches on small pitches, lots of touches and shots, competitive fun atmosphere, grass pitch"
PROMPTS[g5]="Soccer end zone game: team scores by dribbling or passing into end zone, encouraging forward runs and movement off ball, grass pitch"
PROMPTS[g6]="Soccer 5v5 four-zone game: pitch divided into zones, players learning width and shifting play, tactical small-sided game, grass pitch"
PROMPTS[g7]="Soccer 4v4 plus two neutral players possession game: neutrals help team on ball create overloads, quick support play, grass pitch"
PROMPTS[g8]="Youth soccer numbers game: coach calls numbers, players sprint onto pitch for 1v1 2v2 or 3v3 to mini goals, exciting competitive drill"

# --- Generation ---
BATCH_SIZE=10
DRILL_IDS=(${!PROMPTS[@]})
TOTAL=${#DRILL_IDS[@]}
echo "Generating $TOTAL videos with $MODEL..."
echo "Estimated cost: $(echo "$TOTAL * 22.5" | bc) credits"

generate_one() {
  local drill_id="$1"
  local prompt="${PROMPTS[$drill_id]}"
  local outfile="$TEMP_DIR/${drill_id}.json"

  echo "  [$drill_id] Starting..."
  higgsfield generate create "$MODEL" \
    --prompt "$prompt" \
    --wait --wait-timeout 15m --wait-interval 10s \
    --json > "$outfile" 2>&1

  local url=$(python3 -c "import json; data=json.load(open('$outfile')); print(data[0].get('result_url','FAILED'))" 2>/dev/null || echo "FAILED")
  echo "  [$drill_id] Done: $url"
}

DONE=0
for ((i=0; i<TOTAL; i+=BATCH_SIZE)); do
  BATCH=("${DRILL_IDS[@]:i:BATCH_SIZE}")
  echo ""
  echo "=== Batch $((i/BATCH_SIZE + 1)) (${#BATCH[@]} videos) ==="

  for drill_id in "${BATCH[@]}"; do
    generate_one "$drill_id" &
  done
  wait

  DONE=$((DONE + ${#BATCH[@]}))
  echo "=== Batch done. Progress: $DONE / $TOTAL ==="
done

# Collect results
echo ""
echo "Collecting results..."
python3 -c "
import json, glob, os

results = {}
for f in glob.glob('$TEMP_DIR/*.json'):
    drill_id = os.path.basename(f).replace('.json', '')
    try:
        data = json.load(open(f))
        url = data[0].get('result_url', None)
        if url:
            results[drill_id] = url
    except:
        results[drill_id] = None

with open('$RESULTS_FILE', 'w') as out:
    json.dump(results, out, indent=2)

ok = sum(1 for v in results.values() if v)
fail = sum(1 for v in results.values() if not v)
print(f'Results: {ok} success, {fail} failed')
print(f'Saved to $RESULTS_FILE')
"

echo ""
echo "Done! Results in $RESULTS_FILE"
