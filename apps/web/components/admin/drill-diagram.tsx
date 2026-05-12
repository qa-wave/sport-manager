'use client';

import { CATEGORY_ICONS, type DrillCategory } from '@/lib/training-library';

/**
 * SVG tactical diagram for each drill.
 * Renders a field/pitch with player positions, movement arrows, cones, and goals.
 *
 * Colors:
 * - Blue circles: offensive players
 * - Red circles: defensive players
 * - Orange triangles: cones
 * - Dashed arrows: player movement
 * - Solid arrows: ball path
 * - Green rectangle: goal
 */

type DiagramProps = {
  drillId: string;
  category: DrillCategory;
  className?: string;
  /** Compact mode for card thumbnails */
  compact?: boolean;
};

// Shared SVG elements
const FIELD_BG = (w: number, h: number) =>
  `<rect width="${w}" height="${h}" rx="8" fill="hsl(142 40% 25%)" opacity="0.15"/>
   <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="6" fill="none" stroke="hsl(142 40% 40%)" stroke-width="1" opacity="0.3"/>`;

const player = (x: number, y: number, color: 'blue' | 'red' | 'gray' = 'blue', label?: string) => {
  const c = color === 'blue' ? '#6366f1' : color === 'red' ? '#ef4444' : '#9ca3af';
  return `<circle cx="${x}" cy="${y}" r="8" fill="${c}" opacity="0.9"/>
    <circle cx="${x}" cy="${y}" r="8" fill="none" stroke="white" stroke-width="1.5" opacity="0.6"/>
    ${label ? `<text x="${x}" y="${y + 3}" text-anchor="middle" fill="white" font-size="7" font-weight="bold">${label}</text>` : ''}`;
};

const cone = (x: number, y: number) =>
  `<polygon points="${x},${y - 5} ${x - 4},${y + 3} ${x + 4},${y + 3}" fill="#f59e0b" opacity="0.8"/>`;

const arrow = (x1: number, y1: number, x2: number, y2: number, dashed = false) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len * 10, ny = dy / len * 10;
  return `<line x1="${x1}" y1="${y1}" x2="${x2 - nx}" y2="${y2 - ny}" stroke="white" stroke-width="1.5" opacity="0.5" ${dashed ? 'stroke-dasharray="4 3"' : ''} marker-end="url(#arrowhead)"/>`;
};

const ball = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="4" fill="white" opacity="0.9"/>
   <circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#333" stroke-width="0.5"/>`;

const goal = (x: number, y: number, w: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="6" rx="2" fill="#22c55e" opacity="0.6"/>
   <rect x="${x}" y="${y}" width="${w}" height="6" rx="2" fill="none" stroke="white" stroke-width="1" opacity="0.4"/>`;

const miniGoal = (x: number, y: number) =>
  `<rect x="${x - 8}" y="${y - 3}" width="16" height="6" rx="2" fill="#22c55e" opacity="0.5"/>`;

const DEFS = `<defs><marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="white" opacity="0.6"/></marker></defs>`;

// ─── Diagram generators per drill ID ───

const diagrams: Record<string, (w: number, h: number) => string> = {
  // Rondo 4v1
  w1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.2, h * 0.3, 'blue', 'A')}${player(w * 0.8, h * 0.3, 'blue', 'B')}
    ${player(w * 0.2, h * 0.7, 'blue', 'C')}${player(w * 0.8, h * 0.7, 'blue', 'D')}
    ${player(w * 0.5, h * 0.5, 'red', 'X')}
    ${arrow(w * 0.2, h * 0.3, w * 0.8, h * 0.3)}${arrow(w * 0.8, h * 0.3, w * 0.8, h * 0.7)}
    ${arrow(w * 0.8, h * 0.7, w * 0.2, h * 0.7)}${ball(w * 0.35, h * 0.3)}
    ${cone(w * 0.15, h * 0.2)}${cone(w * 0.85, h * 0.2)}${cone(w * 0.15, h * 0.8)}${cone(w * 0.85, h * 0.8)}`,

  // Dynamic stretching
  w2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(x => cone(w * x, h * 0.5)).join('')}
    ${player(w * 0.08, h * 0.5, 'blue')}
    ${arrow(w * 0.08, h * 0.5, w * 0.92, h * 0.5, true)}
    <text x="${w * 0.15}" y="${h * 0.3}" fill="white" font-size="6" opacity="0.5">výpady</text>
    <text x="${w * 0.35}" y="${h * 0.3}" fill="white" font-size="6" opacity="0.5">kolena</text>
    <text x="${w * 0.55}" y="${h * 0.3}" fill="white" font-size="6" opacity="0.5">paty</text>
    <text x="${w * 0.75}" y="${h * 0.3}" fill="white" font-size="6" opacity="0.5">sprint</text>`,

  // Tic-tac-toe
  w3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[0.33, 0.5, 0.67].map(x => [0.33, 0.5, 0.67].map(y => cone(w * x, h * y))).flat().join('')}
    ${player(w * 0.15, h * 0.8, 'blue', '1')}${player(w * 0.15, h * 0.9, 'blue', '2')}
    ${player(w * 0.85, h * 0.8, 'red', '1')}${player(w * 0.85, h * 0.9, 'red', '2')}
    ${arrow(w * 0.15, h * 0.8, w * 0.5, h * 0.5, true)}${arrow(w * 0.85, h * 0.8, w * 0.5, h * 0.5, true)}`,

  // Mirror 1v1
  w4: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.35, h * 0.5, 'blue', 'A')}${player(w * 0.65, h * 0.5, 'gray', 'B')}
    ${arrow(w * 0.35, h * 0.4, w * 0.35, h * 0.25, true)}${arrow(w * 0.65, h * 0.4, w * 0.65, h * 0.25, true)}
    ${arrow(w * 0.25, h * 0.5, w * 0.15, h * 0.5, true)}${arrow(w * 0.75, h * 0.5, w * 0.85, h * 0.5, true)}
    <text x="${w * 0.5}" y="${h * 0.15}" text-anchor="middle" fill="white" font-size="7" opacity="0.5">zrcadlo</text>`,

  // Four cone passing
  p1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${cone(w * 0.25, h * 0.25)}${cone(w * 0.75, h * 0.25)}${cone(w * 0.25, h * 0.75)}${cone(w * 0.75, h * 0.75)}
    ${player(w * 0.25, h * 0.25, 'blue', 'A')}${player(w * 0.75, h * 0.25, 'blue', 'B')}${player(w * 0.25, h * 0.75, 'blue', 'C')}
    ${arrow(w * 0.25, h * 0.25, w * 0.75, h * 0.25)}${arrow(w * 0.75, h * 0.25, w * 0.25, h * 0.75)}
    ${arrow(w * 0.28, h * 0.28, w * 0.72, h * 0.28, true)}${ball(w * 0.45, h * 0.25)}`,

  // Six cone passing
  p2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[30, 90, 150, 210, 270, 330].map((a, i) => {
      const x = w * 0.5 + Math.cos(a * Math.PI / 180) * w * 0.3;
      const y = h * 0.5 + Math.sin(a * Math.PI / 180) * h * 0.3;
      return cone(x, y) + player(x, y, 'blue', String.fromCharCode(65 + i));
    }).join('')}
    ${arrow(w * 0.5 + w * 0.25, h * 0.5, w * 0.5, h * 0.5 - h * 0.25)}${ball(w * 0.6, h * 0.35)}`,

  // Triangle passing
  p3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.5, h * 0.2, 'blue', 'A')}${player(w * 0.2, h * 0.75, 'blue', 'B')}${player(w * 0.8, h * 0.75, 'blue', 'C')}
    ${arrow(w * 0.5, h * 0.2, w * 0.8, h * 0.75)}${arrow(w * 0.8, h * 0.75, w * 0.2, h * 0.75)}
    ${arrow(w * 0.2, h * 0.75, w * 0.5, h * 0.2)}${ball(w * 0.6, h * 0.4)}
    ${cone(w * 0.5, h * 0.2)}${cone(w * 0.2, h * 0.75)}${cone(w * 0.8, h * 0.75)}`,

  // Long passes
  p4: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    <rect x="${w * 0.35}" y="${h * 0.1}" width="${w * 0.3}" height="${h * 0.8}" fill="hsl(0 80% 50%)" opacity="0.1" rx="4"/>
    <text x="${w * 0.5}" y="${h * 0.5}" text-anchor="middle" fill="white" font-size="6" opacity="0.3">zakázaná zóna</text>
    ${player(w * 0.15, h * 0.3, 'blue', 'A')}${player(w * 0.15, h * 0.6, 'blue', 'B')}
    ${player(w * 0.85, h * 0.3, 'blue', 'C')}${player(w * 0.85, h * 0.6, 'blue', 'D')}
    ${arrow(w * 0.15, h * 0.3, w * 0.85, h * 0.3)}${ball(w * 0.5, h * 0.25)}`,

  // Y-formation
  p5: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.5, h * 0.8, 'blue', 'A')}${player(w * 0.2, h * 0.4, 'blue', 'B')}${player(w * 0.5, h * 0.35, 'blue', 'C')}
    ${arrow(w * 0.5, h * 0.8, w * 0.2, h * 0.4)}${arrow(w * 0.2, h * 0.4, w * 0.5, h * 0.35)}
    ${arrow(w * 0.5, h * 0.35, w * 0.5, h * 0.1)}${ball(w * 0.5, h * 0.75)}`,

  // Shooting after control
  s1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.2, h * 0.4, 'gray', 'N')}${player(w * 0.5, h * 0.7, 'blue', 'S')}
    ${arrow(w * 0.2, h * 0.4, w * 0.45, h * 0.55)}${arrow(w * 0.5, h * 0.65, w * 0.5, h * 0.1)}
    ${ball(w * 0.3, h * 0.45)}`,

  // Diamond 1v1
  s2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${cone(w * 0.5, h * 0.25)}${cone(w * 0.3, h * 0.5)}${cone(w * 0.7, h * 0.5)}${cone(w * 0.5, h * 0.75)}
    ${player(w * 0.5, h * 0.75, 'blue', 'A')}${player(w * 0.5, h * 0.5, 'red', 'D')}
    ${arrow(w * 0.5, h * 0.75, w * 0.3, h * 0.5)}${arrow(w * 0.3, h * 0.5, w * 0.5, h * 0.25)}
    ${arrow(w * 0.5, h * 0.55, w * 0.5, h * 0.1)}`,

  // Volley from cross
  s3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.85, h * 0.35, 'blue', 'C')}${player(w * 0.5, h * 0.45, 'blue', 'S')}
    ${arrow(w * 0.85, h * 0.35, w * 0.5, h * 0.3)}${arrow(w * 0.5, h * 0.4, w * 0.5, h * 0.08)}
    ${ball(w * 0.7, h * 0.33)}`,

  // Quick shooting
  s4: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${[0.3, 0.4, 0.5, 0.6, 0.7].map((x, i) => player(w * x, h * 0.75, 'blue')).join('')}
    ${arrow(w * 0.5, h * 0.75, w * 0.5, h * 0.45)}${arrow(w * 0.5, h * 0.4, w * 0.5, h * 0.1)}
    ${ball(w * 0.5, h * 0.5)}
    <text x="${w * 0.5}" y="${h * 0.9}" text-anchor="middle" fill="white" font-size="7" opacity="0.4">3 sec!</text>`,

  // Slalom
  d1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[0.15, 0.27, 0.39, 0.51, 0.63, 0.75, 0.87].map((x, i) => cone(w * x, h * (i % 2 === 0 ? 0.4 : 0.6))).join('')}
    ${player(w * 0.06, h * 0.5, 'blue')}
    ${arrow(w * 0.06, h * 0.5, w * 0.15, h * 0.4, true)}${arrow(w * 0.15, h * 0.4, w * 0.27, h * 0.6, true)}
    ${arrow(w * 0.27, h * 0.6, w * 0.39, h * 0.4, true)}${ball(w * 0.1, h * 0.5)}`,

  // Pirates
  d2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.2, h * 0.3, 'blue')}${player(w * 0.4, h * 0.7, 'blue')}${player(w * 0.7, h * 0.4, 'blue')}${player(w * 0.6, h * 0.8, 'blue')}
    ${player(w * 0.45, h * 0.45, 'red', 'P')}${player(w * 0.55, h * 0.55, 'red', 'P')}
    ${ball(w * 0.2, h * 0.25)}${ball(w * 0.4, h * 0.65)}${ball(w * 0.7, h * 0.35)}${ball(w * 0.6, h * 0.75)}
    ${arrow(w * 0.45, h * 0.45, w * 0.3, h * 0.35, true)}`,

  // 1v1 skills
  d3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    <rect x="${w * 0.3}" y="${h * 0.15}" width="${w * 0.4}" height="${h * 0.7}" fill="white" opacity="0.05" rx="4"/>
    ${player(w * 0.5, h * 0.8, 'blue', 'A')}${player(w * 0.5, h * 0.45, 'red', 'D')}
    ${arrow(w * 0.5, h * 0.8, w * 0.5, h * 0.2, true)}${ball(w * 0.5, h * 0.75)}
    <text x="${w * 0.5}" y="${h * 0.1}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">koridor</text>`,

  // Ronaldo speed test
  d4: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x, i) => cone(w * x, h * (i % 2 === 0 ? 0.45 : 0.55))).join('')}
    ${player(w * 0.04, h * 0.5, 'blue')}
    ${arrow(w * 0.04, h * 0.5, w * 0.96, h * 0.5, true)}
    <text x="${w * 0.5}" y="${h * 0.2}" text-anchor="middle" fill="white" font-size="7" opacity="0.4">⏱️ na čas</text>`,

  // Shadowing 1v1
  def1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    <rect x="${w * 0.25}" y="${h * 0.1}" width="${w * 0.5}" height="${h * 0.8}" fill="white" opacity="0.05" rx="4"/>
    ${player(w * 0.5, h * 0.8, 'blue', 'U')}${player(w * 0.5, h * 0.5, 'red', 'O')}
    ${arrow(w * 0.5, h * 0.8, w * 0.5, h * 0.2, true)}${arrow(w * 0.5, h * 0.5, w * 0.5, h * 0.25, true)}
    ${ball(w * 0.5, h * 0.75)}`,

  // Pressing in 3
  def2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.3, h * 0.3, 'blue', '1')}${player(w * 0.7, h * 0.3, 'blue', '2')}${player(w * 0.5, h * 0.6, 'blue', '3')}
    ${player(w * 0.3, h * 0.7, 'red', 'A')}${player(w * 0.7, h * 0.7, 'red', 'B')}${player(w * 0.5, h * 0.85, 'red', 'C')}
    ${arrow(w * 0.5, h * 0.6, w * 0.5, h * 0.85)}${arrow(w * 0.3, h * 0.3, w * 0.3, h * 0.7, true)}
    ${ball(w * 0.5, h * 0.85)}${miniGoal(w * 0.5, h * 0.08)}`,

  // Defensive headers
  def3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.85, h * 0.35, 'gray', 'N')}${player(w * 0.5, h * 0.35, 'red', 'O')}${player(w * 0.4, h * 0.5, 'blue', 'U')}
    ${arrow(w * 0.85, h * 0.35, w * 0.5, h * 0.25)}${arrow(w * 0.4, h * 0.45, w * 0.2, h * 0.6)}
    ${ball(w * 0.65, h * 0.3)}`,

  // HIIT sprints
  f1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${cone(w * 0.1, h * 0.5)}${cone(w * 0.3, h * 0.5)}${cone(w * 0.5, h * 0.5)}${cone(w * 0.7, h * 0.5)}${cone(w * 0.9, h * 0.5)}
    ${player(w * 0.1, h * 0.65, 'blue')}
    ${arrow(w * 0.1, h * 0.5, w * 0.3, h * 0.5)}${arrow(w * 0.3, h * 0.5, w * 0.1, h * 0.5, true)}
    <text x="${w * 0.3}" y="${h * 0.35}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">10m</text>
    <text x="${w * 0.5}" y="${h * 0.35}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">20m</text>
    <text x="${w * 0.7}" y="${h * 0.35}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">30m</text>
    <text x="${w * 0.9}" y="${h * 0.35}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">40m</text>`,

  // Agility star
  f2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${cone(w * 0.5, h * 0.5)}
    ${[0, 72, 144, 216, 288].map(a => {
      const x = w * 0.5 + Math.cos((a - 90) * Math.PI / 180) * w * 0.35;
      const y = h * 0.5 + Math.sin((a - 90) * Math.PI / 180) * h * 0.35;
      return cone(x, y) + arrow(w * 0.5, h * 0.5, x, y, true);
    }).join('')}
    ${player(w * 0.5, h * 0.5, 'blue')}`,

  // Bodyweight circuit
  f3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${[
      { x: 0.2, y: 0.25, l: 'kliky' }, { x: 0.5, y: 0.25, l: 'dřepy' }, { x: 0.8, y: 0.25, l: 'plank' },
      { x: 0.2, y: 0.7, l: 'výpady' }, { x: 0.5, y: 0.7, l: 'burpee' }, { x: 0.8, y: 0.7, l: 'climber' },
    ].map(s => `${cone(w * s.x, h * s.y)}<text x="${w * s.x}" y="${h * s.y + 15}" text-anchor="middle" fill="white" font-size="6" opacity="0.5">${s.l}</text>`).join('')}
    ${arrow(w * 0.2, h * 0.25, w * 0.5, h * 0.25)}${arrow(w * 0.5, h * 0.25, w * 0.8, h * 0.25)}
    ${arrow(w * 0.8, h * 0.25, w * 0.8, h * 0.7)}${arrow(w * 0.8, h * 0.7, w * 0.5, h * 0.7)}
    ${arrow(w * 0.5, h * 0.7, w * 0.2, h * 0.7)}`,

  // 4v4 four goals
  t1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${miniGoal(w * 0.25, h * 0.03)}${miniGoal(w * 0.75, h * 0.03)}
    ${miniGoal(w * 0.25, h * 0.97)}${miniGoal(w * 0.75, h * 0.97)}
    ${player(w * 0.3, h * 0.35, 'blue')}${player(w * 0.6, h * 0.35, 'blue')}
    ${player(w * 0.25, h * 0.55, 'blue')}${player(w * 0.55, h * 0.65, 'blue')}
    ${player(w * 0.4, h * 0.4, 'red')}${player(w * 0.7, h * 0.55, 'red')}
    ${player(w * 0.45, h * 0.7, 'red')}${player(w * 0.75, h * 0.35, 'red')}
    ${ball(w * 0.35, h * 0.4)}`,

  // 4v2
  t2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.2, h * 0.5, 'blue', '1')}${player(w * 0.4, h * 0.35, 'blue', '2')}
    ${player(w * 0.6, h * 0.5, 'blue', '3')}${player(w * 0.8, h * 0.35, 'blue', '4')}
    ${player(w * 0.4, h * 0.55, 'red')}${player(w * 0.6, h * 0.55, 'red')}
    ${arrow(w * 0.2, h * 0.5, w * 0.4, h * 0.35)}${arrow(w * 0.4, h * 0.35, w * 0.5, h * 0.1)}
    ${ball(w * 0.25, h * 0.48)}`,

  // 3v3+1
  t3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.3, h * 0.3, 'blue')}${player(w * 0.5, h * 0.6, 'blue')}${player(w * 0.25, h * 0.7, 'blue')}
    ${player(w * 0.7, h * 0.35, 'red')}${player(w * 0.8, h * 0.6, 'red')}${player(w * 0.6, h * 0.75, 'red')}
    ${player(w * 0.5, h * 0.45, 'gray', 'N')}
    ${arrow(w * 0.3, h * 0.3, w * 0.5, h * 0.45)}${ball(w * 0.35, h * 0.35)}`,

  // Goalkeeper agility
  gk1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.2, h * 0.02, w * 0.6)}
    <rect x="${w * 0.35}" y="${h * 0.35}" width="${w * 0.3}" height="${h * 0.08}" fill="#f59e0b" opacity="0.3" rx="2"/>
    <text x="${w * 0.5}" y="${h * 0.41}" text-anchor="middle" fill="white" font-size="5" opacity="0.4">žebřík</text>
    ${player(w * 0.35, h * 0.5, 'blue', 'GK')}${player(w * 0.5, h * 0.75, 'gray', 'T')}
    ${arrow(w * 0.35, h * 0.5, w * 0.65, h * 0.4, true)}${arrow(w * 0.5, h * 0.75, w * 0.5, h * 0.15)}`,

  // Goalkeeper distribution
  gk2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.5, h * 0.15, 'blue', 'GK')}
    ${player(w * 0.2, h * 0.55, 'blue', 'L')}${player(w * 0.8, h * 0.55, 'blue', 'R')}
    ${arrow(w * 0.5, h * 0.15, w * 0.2, h * 0.55)}${arrow(w * 0.5, h * 0.15, w * 0.8, h * 0.55)}
    ${ball(w * 0.5, h * 0.18)}`,

  // 7v7 match
  g1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.35, h * 0.02, w * 0.3)}${goal(w * 0.35, h * 0.94, w * 0.3)}
    <line x1="${w * 0.05}" y1="${h * 0.5}" x2="${w * 0.95}" y2="${h * 0.5}" stroke="white" stroke-width="0.5" opacity="0.2"/>
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.1}" fill="none" stroke="white" stroke-width="0.5" opacity="0.2"/>
    ${player(w * 0.3, h * 0.2, 'blue')}${player(w * 0.5, h * 0.3, 'blue')}${player(w * 0.7, h * 0.2, 'blue')}
    ${player(w * 0.4, h * 0.4, 'blue')}${player(w * 0.6, h * 0.4, 'blue')}
    ${player(w * 0.3, h * 0.6, 'red')}${player(w * 0.5, h * 0.7, 'red')}${player(w * 0.7, h * 0.6, 'red')}
    ${player(w * 0.4, h * 0.8, 'red')}${player(w * 0.6, h * 0.8, 'red')}
    ${ball(w * 0.5, h * 0.5)}`,

  // 3v3 no goalkeeper
  g2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${miniGoal(w * 0.5, h * 0.05)}${miniGoal(w * 0.5, h * 0.95)}
    ${player(w * 0.3, h * 0.35, 'blue')}${player(w * 0.5, h * 0.45, 'blue')}${player(w * 0.65, h * 0.3, 'blue')}
    ${player(w * 0.35, h * 0.65, 'red')}${player(w * 0.5, h * 0.55, 'red')}${player(w * 0.7, h * 0.7, 'red')}
    ${ball(w * 0.4, h * 0.4)}`,

  // King of the field
  g3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.2, h * 0.3, 'blue')}${player(w * 0.5, h * 0.2, 'blue')}${player(w * 0.8, h * 0.4, 'blue')}
    ${player(w * 0.3, h * 0.7, 'blue')}${player(w * 0.6, h * 0.6, 'blue')}${player(w * 0.75, h * 0.75, 'blue')}
    ${ball(w * 0.2, h * 0.25)}${ball(w * 0.5, h * 0.15)}${ball(w * 0.8, h * 0.35)}
    ${ball(w * 0.3, h * 0.65)}${ball(w * 0.6, h * 0.55)}${ball(w * 0.75, h * 0.7)}
    ${arrow(w * 0.5, h * 0.2, w * 0.6, h * 0.55, true)}`,

  // Florbal passing
  fl1: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${player(w * 0.3, h * 0.5, 'blue', 'A')}${player(w * 0.7, h * 0.5, 'blue', 'B')}
    ${arrow(w * 0.3, h * 0.5, w * 0.7, h * 0.5)}${arrow(w * 0.3, h * 0.55, w * 0.3, h * 0.85, true)}
    ${arrow(w * 0.7, h * 0.55, w * 0.7, h * 0.85, true)}${ball(w * 0.45, h * 0.48)}`,

  // Florbal shooting
  fl2: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.5, h * 0.6, 'blue', 'S')}
    ${arrow(w * 0.5, h * 0.55, w * 0.5, h * 0.1)}${ball(w * 0.5, h * 0.58)}
    <text x="${w * 0.5}" y="${h * 0.8}" text-anchor="middle" fill="white" font-size="6" opacity="0.4">střela tahem</text>`,

  // Florbal 2v1
  fl3: (w, h) => `${FIELD_BG(w, h)}${DEFS}
    ${goal(w * 0.3, h * 0.02, w * 0.4)}
    ${player(w * 0.35, h * 0.7, 'blue', 'A')}${player(w * 0.65, h * 0.7, 'blue', 'B')}
    ${player(w * 0.5, h * 0.4, 'red', 'D')}
    ${arrow(w * 0.35, h * 0.7, w * 0.5, h * 0.4, true)}${arrow(w * 0.65, h * 0.7, w * 0.5, h * 0.1)}
    ${ball(w * 0.38, h * 0.65)}`,
};

const categoryDiagrams: Record<DrillCategory, (w: number, h: number) => string> = {
  warmup: diagrams.w2!,
  passing: diagrams.p3!,
  shooting: diagrams.s1!,
  dribbling: diagrams.d1!,
  defending: diagrams.def1!,
  fitness: diagrams.f2!,
  tactics: diagrams.t3!,
  goalkeeping: diagrams.gk1!,
  game: diagrams.g2!,
};

export function DrillDiagram({ drillId, category, className, compact }: DiagramProps) {
  const w = compact ? 160 : 320;
  const h = compact ? 100 : 200;
  const gen = diagrams[drillId] ?? categoryDiagrams[category];

  if (!gen) {
    // Fallback — category icon on field background
    return (
      <div className={`flex items-center justify-center rounded-xl bg-muted/50 ${className}`}
        style={{ width: compact ? 160 : '100%', height: compact ? 100 : 200 }}
      >
        <span className="text-4xl opacity-30">{CATEGORY_ICONS[category]}</span>
      </div>
    );
  }

  const svgContent = gen(w, h);

  return (
    <div className={`overflow-hidden rounded-xl ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={compact ? 100 : 200}
        className="w-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
