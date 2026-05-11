'use client';

import { Gauge, PlayCircle, Timer, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AGE_GROUP_DESCRIPTIONS,
  AGE_GROUP_LABELS,
  CATEGORY_LABELS,
  getPrimaryAgeGroup,
  type AgeGroup,
  type Drill,
  type DrillCategory,
} from '@/lib/training-library';

type MovingPlayer = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: 'blue' | 'red' | 'neutral';
  label?: string;
  delay?: number;
};

type Cone = { x: number; y: number };
type Goal = { x: number; y: number; width: number; height: number };

type VideoScene = {
  title: string;
  cue: string;
  players: MovingPlayer[];
  cones: Cone[];
  goals: Goal[];
  ballPath: { x: number[]; y: number[] };
};

const AGE_VIDEO_PROFILES: Record<AgeGroup, {
  tempo: string;
  duration: number;
  playerRadius: number;
  ballRadius: number;
}> = {
  U7: { tempo: 'pomalejší', duration: 5.6, playerRadius: 3.2, ballRadius: 1.35 },
  U9: { tempo: 'hravé', duration: 5.0, playerRadius: 3.1, ballRadius: 1.3 },
  U11: { tempo: 'plynulé', duration: 4.5, playerRadius: 3.0, ballRadius: 1.25 },
  U13: { tempo: 'rychlejší', duration: 4.0, playerRadius: 2.8, ballRadius: 1.15 },
  U15: { tempo: 'zápasové', duration: 3.5, playerRadius: 2.7, ballRadius: 1.1 },
  U17: { tempo: 'intenzivní', duration: 3.15, playerRadius: 2.65, ballRadius: 1.05 },
  senior: { tempo: 'maximální', duration: 2.9, playerRadius: 2.6, ballRadius: 1.0 },
};

const colorFor = (color: MovingPlayer['color']) => {
  if (color === 'red') return '#ef4444';
  if (color === 'neutral') return '#94a3b8';
  return '#2563eb';
};

function sceneForCategory(category: DrillCategory): VideoScene {
  switch (category) {
    case 'warmup':
      return {
        title: 'Aktivace v pohybu',
        cue: 'volný pohyb, reakce na pokyn, první dotek',
        players: [
          { x1: 16, y1: 48, x2: 82, y2: 20, color: 'blue', label: '1' },
          { x1: 24, y1: 22, x2: 76, y2: 48, color: 'blue', label: '2', delay: 0.4 },
          { x1: 48, y1: 50, x2: 52, y2: 18, color: 'blue', label: '3', delay: 0.8 },
        ],
        cones: [{ x: 18, y: 18 }, { x: 35, y: 44 }, { x: 50, y: 20 }, { x: 68, y: 44 }, { x: 84, y: 18 }],
        goals: [],
        ballPath: { x: [18, 38, 55, 77, 18], y: [48, 30, 47, 24, 48] },
      };
    case 'passing':
      return {
        title: 'Přihrávkový rytmus',
        cue: 'přihraj, nabídni se, otevři tělo',
        players: [
          { x1: 20, y1: 45, x2: 22, y2: 22, color: 'blue', label: 'A' },
          { x1: 50, y1: 18, x2: 78, y2: 42, color: 'blue', label: 'B', delay: 0.3 },
          { x1: 80, y1: 45, x2: 50, y2: 48, color: 'blue', label: 'C', delay: 0.6 },
          { x1: 50, y1: 50, x2: 50, y2: 24, color: 'neutral', label: 'N', delay: 0.9 },
        ],
        cones: [{ x: 20, y: 45 }, { x: 50, y: 18 }, { x: 80, y: 45 }],
        goals: [],
        ballPath: { x: [20, 50, 80, 50, 20], y: [45, 18, 45, 50, 45] },
      };
    case 'shooting':
      return {
        title: 'Zakončení do brány',
        cue: 'příprava dotekem, střela, doběh',
        players: [
          { x1: 22, y1: 46, x2: 43, y2: 34, color: 'neutral', label: 'N' },
          { x1: 52, y1: 52, x2: 52, y2: 28, color: 'blue', label: 'S', delay: 0.25 },
          { x1: 50, y1: 12, x2: 56, y2: 12, color: 'red', label: 'GK', delay: 0.5 },
        ],
        cones: [{ x: 42, y: 38 }, { x: 62, y: 38 }],
        goals: [{ x: 36, y: 5, width: 28, height: 5 }],
        ballPath: { x: [22, 46, 52, 50, 22], y: [46, 36, 27, 8, 46] },
      };
    case 'dribbling':
      return {
        title: 'Vedení míče a změna směru',
        cue: 'krátké doteky, hlava nahoře, zrychlení',
        players: [
          { x1: 12, y1: 45, x2: 82, y2: 20, color: 'blue', label: '1' },
          { x1: 48, y1: 18, x2: 52, y2: 48, color: 'red', label: 'O', delay: 0.5 },
        ],
        cones: [{ x: 22, y: 44 }, { x: 34, y: 24 }, { x: 46, y: 44 }, { x: 58, y: 24 }, { x: 70, y: 44 }],
        goals: [],
        ballPath: { x: [12, 24, 36, 48, 60, 82, 12], y: [45, 26, 44, 25, 43, 20, 45] },
      };
    case 'defending':
      return {
        title: 'Obranný souboj',
        cue: 'nízký postoj, úhel, zajištění',
        players: [
          { x1: 48, y1: 50, x2: 50, y2: 18, color: 'blue', label: 'U' },
          { x1: 52, y1: 34, x2: 48, y2: 24, color: 'red', label: 'O', delay: 0.35 },
          { x1: 32, y1: 42, x2: 38, y2: 32, color: 'red', label: 'Z', delay: 0.75 },
        ],
        cones: [{ x: 30, y: 14 }, { x: 70, y: 14 }, { x: 30, y: 52 }, { x: 70, y: 52 }],
        goals: [{ x: 42, y: 5, width: 16, height: 4 }],
        ballPath: { x: [48, 51, 46, 54, 48], y: [50, 36, 26, 18, 50] },
      };
    case 'fitness':
      return {
        title: 'Agility a výbušnost',
        cue: 'rychlé nohy, brzdění, změna směru',
        players: [
          { x1: 18, y1: 48, x2: 82, y2: 48, color: 'blue', label: '1' },
          { x1: 50, y1: 48, x2: 50, y2: 18, color: 'blue', label: '2', delay: 0.45 },
        ],
        cones: [{ x: 18, y: 48 }, { x: 34, y: 48 }, { x: 50, y: 48 }, { x: 66, y: 48 }, { x: 82, y: 48 }, { x: 50, y: 18 }],
        goals: [],
        ballPath: { x: [18, 34, 50, 66, 82, 18], y: [48, 48, 18, 48, 48, 48] },
      };
    case 'tactics':
      return {
        title: 'Herní princip',
        cue: 'šířka, podpora, přenesení hry',
        players: [
          { x1: 18, y1: 42, x2: 30, y2: 24, color: 'blue', label: '1' },
          { x1: 42, y1: 48, x2: 50, y2: 30, color: 'blue', label: '2', delay: 0.2 },
          { x1: 72, y1: 42, x2: 82, y2: 24, color: 'blue', label: '3', delay: 0.45 },
          { x1: 36, y1: 24, x2: 46, y2: 42, color: 'red', label: 'A', delay: 0.35 },
          { x1: 64, y1: 24, x2: 58, y2: 42, color: 'red', label: 'B', delay: 0.7 },
        ],
        cones: [{ x: 12, y: 12 }, { x: 88, y: 12 }, { x: 12, y: 52 }, { x: 88, y: 52 }],
        goals: [{ x: 42, y: 5, width: 16, height: 4 }, { x: 42, y: 54, width: 16, height: 4 }],
        ballPath: { x: [18, 42, 72, 50, 18], y: [42, 48, 42, 30, 42] },
      };
    case 'goalkeeping':
      return {
        title: 'Brankářská reakce',
        cue: 'postoj, přesun, zákrok, rozehrávka',
        players: [
          { x1: 50, y1: 14, x2: 38, y2: 18, color: 'blue', label: 'GK' },
          { x1: 50, y1: 52, x2: 52, y2: 42, color: 'neutral', label: 'T', delay: 0.25 },
        ],
        cones: [{ x: 40, y: 28 }, { x: 50, y: 28 }, { x: 60, y: 28 }],
        goals: [{ x: 34, y: 5, width: 32, height: 5 }],
        ballPath: { x: [50, 48, 38, 62, 50], y: [52, 36, 14, 16, 52] },
      };
    case 'game':
      return {
        title: 'Malá hra v tempu',
        cue: 'volba řešení, souboje, přepínání',
        players: [
          { x1: 22, y1: 26, x2: 42, y2: 20, color: 'blue' },
          { x1: 30, y1: 42, x2: 52, y2: 46, color: 'blue', delay: 0.25 },
          { x1: 68, y1: 28, x2: 54, y2: 20, color: 'red', delay: 0.45 },
          { x1: 74, y1: 44, x2: 58, y2: 44, color: 'red', delay: 0.65 },
        ],
        cones: [{ x: 12, y: 12 }, { x: 88, y: 12 }, { x: 12, y: 52 }, { x: 88, y: 52 }],
        goals: [{ x: 42, y: 5, width: 16, height: 4 }, { x: 42, y: 54, width: 16, height: 4 }],
        ballPath: { x: [22, 44, 60, 48, 22], y: [26, 20, 44, 55, 26] },
      };
  }
}

function values(points: number[]) {
  return points.join(';');
}

export function DrillVideoPreview({ drill }: { drill: Drill }) {
  const primaryAge = getPrimaryAgeGroup(drill);
  const profile = AGE_VIDEO_PROFILES[primaryAge];
  const scene = sceneForCategory(drill.category);
  const ballDuration = Math.max(profile.duration * 0.9, 2.4);
  const ballColor = drill.sport === 'florbal' ? '#f97316' : '#f8fafc';
  const ballStartX = scene.ballPath.x[0] ?? 50;
  const ballStartY = scene.ballPath.y[0] ?? 31;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Video ukázka</h2>
              <Badge variant="outline" className="text-xs">{AGE_GROUP_LABELS[primaryAge]}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {scene.title} · {AGE_GROUP_DESCRIPTIONS[primaryAge]}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[drill.category]}
          </Badge>
        </div>

        <div className="relative bg-[radial-gradient(circle_at_25%_15%,hsl(var(--primary)/0.14),transparent_28%),linear-gradient(135deg,hsl(142_42%_18%),hsl(160_35%_13%))]">
          <svg
            viewBox="0 0 100 62"
            role="img"
            aria-label={`Video ukázka cvičení ${drill.name} pro kategorii ${AGE_GROUP_LABELS[primaryAge]}`}
            className="aspect-video w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect x="2" y="2" width="96" height="58" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
            <line x1="50" y1="2" x2="50" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
            <circle cx="50" cy="31" r="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />

            {scene.goals.map((goal, index) => (
              <rect
                key={`goal-${index}`}
                x={goal.x}
                y={goal.y}
                width={goal.width}
                height={goal.height}
                rx="1"
                fill="#22c55e"
                opacity="0.65"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.35"
              />
            ))}

            {scene.cones.map((cone, index) => (
              <path
                key={`cone-${index}`}
                d={`M ${cone.x} ${cone.y - 1.8} L ${cone.x - 1.5} ${cone.y + 1.4} L ${cone.x + 1.5} ${cone.y + 1.4} Z`}
                fill="#f59e0b"
                opacity="0.9"
              />
            ))}

            <polyline
              points={scene.ballPath.x.map((x, index) => `${x},${scene.ballPath.y[index] ?? ballStartY}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeDasharray="2 2"
              strokeWidth="0.6"
            />

            {scene.players.map((player, index) => (
              <g key={`player-${index}`}>
                <circle cx={player.x1} cy={player.y1} r={profile.playerRadius + 0.45} fill="rgba(255,255,255,0.22)">
                  <animate attributeName="cx" values={`${player.x1};${player.x2};${player.x1}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={`${player.y1};${player.y2};${player.y1}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={player.x1} cy={player.y1} r={profile.playerRadius} fill={colorFor(player.color)} opacity="0.95">
                  <animate attributeName="cx" values={`${player.x1};${player.x2};${player.x1}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={`${player.y1};${player.y2};${player.y1}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                </circle>
                {player.label && (
                  <text
                    x={player.x1}
                    y={player.y1 + 0.9}
                    textAnchor="middle"
                    fill="white"
                    fontSize="2.6"
                    fontWeight="700"
                  >
                    {player.label}
                    <animate attributeName="x" values={`${player.x1};${player.x2};${player.x1}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${player.y1 + 0.9};${player.y2 + 0.9};${player.y1 + 0.9}`} dur={`${profile.duration}s`} begin={`${player.delay ?? 0}s`} repeatCount="indefinite" />
                  </text>
                )}
              </g>
            ))}

            <circle cx={ballStartX} cy={ballStartY} r={profile.ballRadius} fill={ballColor} stroke="rgba(15,23,42,0.7)" strokeWidth="0.25">
              <animate attributeName="cx" values={values(scene.ballPath.x)} dur={`${ballDuration}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={values(scene.ballPath.y)} dur={`${ballDuration}s`} repeatCount="indefinite" />
            </circle>
          </svg>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/35 px-3 py-2 text-white backdrop-blur-sm">
            <div className="min-w-0 text-xs font-medium">{scene.cue}</div>
            <div className="text-[11px] text-white/75">{drill.playersMin}–{drill.playersMax} hráčů</div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
          <VideoStat icon={Timer} label="Délka" value={`${drill.durationMin} min`} />
          <VideoStat icon={Users} label="Věk" value={AGE_GROUP_LABELS[primaryAge]} />
          <VideoStat icon={Gauge} label="Tempo" value={profile.tempo} />
        </div>
      </CardContent>
    </Card>
  );
}

function VideoStat({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="min-w-0 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <div className="truncate text-xs font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
