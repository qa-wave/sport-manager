'use client';

/**
 * LineupBuilder — visual soccer pitch formation editor.
 *
 * Stores lineup in event description via a hidden HTML comment marker:
 *   <!-- lineup: {"formation":"4-3-3","positions":[{"slot":"GK","memberId":"..."}]} -->
 *
 * Read-only for non-coaches, editable for coach/admin.
 */

import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Formation definitions ──────────────────────────────────────────────────
// x/y are percentage positions on the pitch (0–100).
// Origin: top-left. y=0 is opponent goal, y=100 is own goal.

interface PositionDef {
  slot: string;
  x: number;
  y: number;
  label: string;
}

interface FormationDef {
  label: string;
  positions: PositionDef[];
}

const FORMATIONS: Record<string, FormationDef> = {
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { slot: 'GK',  x: 50, y: 88, label: 'GK' },
      { slot: 'LB',  x: 15, y: 72, label: 'LB' },
      { slot: 'CB1', x: 37, y: 74, label: 'CB' },
      { slot: 'CB2', x: 63, y: 74, label: 'CB' },
      { slot: 'RB',  x: 85, y: 72, label: 'RB' },
      { slot: 'LM',  x: 15, y: 52, label: 'LM' },
      { slot: 'CM1', x: 37, y: 50, label: 'CM' },
      { slot: 'CM2', x: 63, y: 50, label: 'CM' },
      { slot: 'RM',  x: 85, y: 52, label: 'RM' },
      { slot: 'ST1', x: 37, y: 22, label: 'UT' },
      { slot: 'ST2', x: 63, y: 22, label: 'UT' },
    ],
  },
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { slot: 'GK',  x: 50, y: 88, label: 'GK' },
      { slot: 'LB',  x: 15, y: 72, label: 'LB' },
      { slot: 'CB1', x: 37, y: 74, label: 'CB' },
      { slot: 'CB2', x: 63, y: 74, label: 'CB' },
      { slot: 'RB',  x: 85, y: 72, label: 'RB' },
      { slot: 'CM1', x: 28, y: 50, label: 'CM' },
      { slot: 'CM2', x: 50, y: 48, label: 'CM' },
      { slot: 'CM3', x: 72, y: 50, label: 'CM' },
      { slot: 'LW',  x: 18, y: 20, label: 'LK' },
      { slot: 'ST',  x: 50, y: 16, label: 'UT' },
      { slot: 'RW',  x: 82, y: 20, label: 'PK' },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { slot: 'GK',  x: 50, y: 88, label: 'GK' },
      { slot: 'CB1', x: 28, y: 74, label: 'CB' },
      { slot: 'CB2', x: 50, y: 76, label: 'CB' },
      { slot: 'CB3', x: 72, y: 74, label: 'CB' },
      { slot: 'LWB', x: 12, y: 55, label: 'LWB' },
      { slot: 'CM1', x: 30, y: 50, label: 'CM' },
      { slot: 'CM2', x: 50, y: 48, label: 'CM' },
      { slot: 'CM3', x: 70, y: 50, label: 'CM' },
      { slot: 'RWB', x: 88, y: 55, label: 'RWB' },
      { slot: 'ST1', x: 37, y: 20, label: 'UT' },
      { slot: 'ST2', x: 63, y: 20, label: 'UT' },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { slot: 'GK',  x: 50, y: 88, label: 'GK' },
      { slot: 'LB',  x: 15, y: 74, label: 'LB' },
      { slot: 'CB1', x: 37, y: 76, label: 'CB' },
      { slot: 'CB2', x: 63, y: 76, label: 'CB' },
      { slot: 'RB',  x: 85, y: 74, label: 'RB' },
      { slot: 'DM1', x: 37, y: 60, label: 'DM' },
      { slot: 'DM2', x: 63, y: 60, label: 'DM' },
      { slot: 'LM',  x: 18, y: 40, label: 'LM' },
      { slot: 'CAM', x: 50, y: 38, label: 'CAM' },
      { slot: 'RM',  x: 82, y: 40, label: 'RM' },
      { slot: 'ST',  x: 50, y: 18, label: 'UT' },
    ],
  },
  '3-4-3': {
    label: '3-4-3',
    positions: [
      { slot: 'GK',  x: 50, y: 88, label: 'GK' },
      { slot: 'CB1', x: 28, y: 74, label: 'CB' },
      { slot: 'CB2', x: 50, y: 76, label: 'CB' },
      { slot: 'CB3', x: 72, y: 74, label: 'CB' },
      { slot: 'LM',  x: 15, y: 54, label: 'LM' },
      { slot: 'CM1', x: 37, y: 52, label: 'CM' },
      { slot: 'CM2', x: 63, y: 52, label: 'CM' },
      { slot: 'RM',  x: 85, y: 54, label: 'RM' },
      { slot: 'LW',  x: 18, y: 20, label: 'LK' },
      { slot: 'ST',  x: 50, y: 16, label: 'UT' },
      { slot: 'RW',  x: 82, y: 20, label: 'PK' },
    ],
  },
};

// ── Marker helpers ─────────────────────────────────────────────────────────

const LINEUP_MARKER_RE = /<!--\s*lineup:\s*(\{.*?\})\s*-->/s;

export interface LineupData {
  formation: string;
  positions: Array<{ slot: string; memberId: string }>;
}

export function parseLineup(description: string): LineupData | null {
  const match = LINEUP_MARKER_RE.exec(description);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as LineupData;
  } catch {
    return null;
  }
}

export function updateLineupMarker(description: string, lineup: LineupData): string {
  const marker = `<!-- lineup: ${JSON.stringify(lineup)} -->`;
  if (LINEUP_MARKER_RE.test(description)) {
    return description.replace(LINEUP_MARKER_RE, marker);
  }
  return description ? `${description}\n\n${marker}` : marker;
}

// ── Player select dropdown ─────────────────────────────────────────────────

function PlayerSelect({
  value,
  players,
  usedMemberIds,
  onChange,
}: {
  value: string;
  players: Array<{ memberId: string; name: string }>;
  usedMemberIds: Set<string>;
  onChange: (memberId: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-7 w-full max-w-[140px] rounded border border-input bg-background px-2 py-0.5 text-[11px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={(e) => e.stopPropagation()}
    >
      <option value="">— Nikdo —</option>
      {players.map((p) => (
        <option
          key={p.memberId}
          value={p.memberId}
          disabled={usedMemberIds.has(p.memberId) && p.memberId !== value}
        >
          {p.name}
        </option>
      ))}
    </select>
  );
}

// ── Pitch SVG ──────────────────────────────────────────────────────────────

function PitchBackground() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      {/* Grass gradient */}
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        {/* Alternating grass stripes */}
        <pattern id="stripes" x="0" y="0" width="100" height="10" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="100" height="10" fill="#15803d" />
          <rect x="0" y="0" width="100" height="5" fill="#166534" fillOpacity="0.6" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#stripes)" />

      {/* Pitch outline */}
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />

      {/* Centre line */}
      <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />

      {/* Centre circle */}
      <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="0.7" fill="rgba(255,255,255,0.6)" />

      {/* Penalty areas */}
      {/* Top (opponent) */}
      <rect x="25" y="2" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <rect x="36" y="2" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* Top goal */}
      <rect x="42" y="1" width="16" height="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />

      {/* Bottom (own) */}
      <rect x="25" y="82" width="50" height="16" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      <rect x="36" y="91" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* Bottom goal */}
      <rect x="42" y="96" width="16" height="3" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />

      {/* Penalty spots */}
      <circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="90" r="0.5" fill="rgba(255,255,255,0.5)" />

      {/* Corner arcs */}
      <path d="M2,5 A3,3 0 0,0 5,2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
      <path d="M95,2 A3,3 0 0,0 98,5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
      <path d="M2,95 A3,3 0 0,1 5,98" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
      <path d="M95,98 A3,3 0 0,1 98,95" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
    </svg>
  );
}

// ── Position slot ──────────────────────────────────────────────────────────

function PositionSlot({
  pos,
  playerName,
  isEditing,
  players,
  usedMemberIds,
  currentMemberId,
  onAssign,
}: {
  pos: PositionDef;
  playerName: string | null;
  isEditing: boolean;
  players: Array<{ memberId: string; name: string }>;
  usedMemberIds: Set<string>;
  currentMemberId: string;
  onAssign: (memberId: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const assigned = !!playerName;

  function handleSlotClick() {
    if (!isEditing) return;
    setShowPicker((v) => !v);
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      {/* Slot circle */}
      <div
        onClick={handleSlotClick}
        className={cn(
          'flex flex-col items-center cursor-default',
          isEditing && 'cursor-pointer',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow-md transition-all select-none',
            assigned
              ? 'border-white bg-primary text-primary-foreground shadow-primary/40'
              : 'border-white/60 bg-white/20 text-white',
            isEditing && 'hover:scale-110',
          )}
        >
          {pos.label}
        </div>
        {/* Player name */}
        <div
          className={cn(
            'mt-0.5 max-w-[64px] truncate rounded px-1 text-center text-[9px] font-medium leading-tight shadow',
            assigned
              ? 'bg-black/50 text-white'
              : 'bg-black/20 text-white/70',
          )}
        >
          {playerName ?? pos.slot}
        </div>
      </div>

      {/* Picker popup */}
      {showPicker && isEditing && (
        <div
          className="absolute left-1/2 z-30 mt-1 -translate-x-1/2 rounded-lg border border-border bg-popover shadow-xl p-2 min-w-[160px]"
          style={{ top: '100%' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {pos.slot}
          </div>
          <PlayerSelect
            value={currentMemberId}
            players={players}
            usedMemberIds={usedMemberIds}
            onChange={(memberId) => {
              onAssign(memberId);
              setShowPicker(false);
            }}
          />
          <button
            className="mt-1.5 w-full text-center text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => setShowPicker(false)}
          >
            Zavřít
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export interface LineupBuilderProps {
  eventId: string;
  description: string;
  isCoachOrAdmin: boolean;
  players: Array<{ memberId: string; name: string }>;
  onDescriptionUpdate: (newDesc: string) => void;
  isSaving: boolean;
}

export function LineupBuilder({
  eventId,
  description,
  isCoachOrAdmin,
  players,
  onDescriptionUpdate,
  isSaving,
}: LineupBuilderProps) {
  const parsedLineup = useMemo(() => parseLineup(description), [description]);

  const [formation, setFormation] = useState<string>(parsedLineup?.formation ?? '4-3-3');
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    if (!parsedLineup) return {};
    return Object.fromEntries(parsedLineup.positions.map((p) => [p.slot, p.memberId]));
  });
  const [isEditing, setIsEditing] = useState(false);

  const currentFormation = FORMATIONS[formation];

  const usedMemberIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)),
    [assignments],
  );

  function handleAssign(slot: string, memberId: string) {
    setAssignments((prev) => ({ ...prev, [slot]: memberId }));
  }

  function handleFormationChange(newFormation: string) {
    setFormation(newFormation);
    setAssignments({});
  }

  function handleSave() {
    const lineup: LineupData = {
      formation,
      positions: Object.entries(assignments)
        .filter(([, memberId]) => memberId)
        .map(([slot, memberId]) => ({ slot, memberId })),
    };
    const newDesc = updateLineupMarker(description, lineup);
    onDescriptionUpdate(newDesc);
    setIsEditing(false);
  }

  function handleCancel() {
    // Reset to saved state
    if (parsedLineup) {
      setFormation(parsedLineup.formation);
      setAssignments(
        Object.fromEntries(parsedLineup.positions.map((p) => [p.slot, p.memberId])),
      );
    } else {
      setAssignments({});
    }
    setIsEditing(false);
  }

  function getPlayerName(memberId: string): string | null {
    if (!memberId) return null;
    return players.find((p) => p.memberId === memberId)?.name ?? null;
  }

  const assignedCount = Object.values(assignments).filter(Boolean).length;
  const totalSlots = currentFormation?.positions.length ?? 11;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Sestava</span>
          <span className="text-xs text-muted-foreground">
            {assignedCount}/{totalSlots} hráčů
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Formation selector */}
          {(isEditing || !parsedLineup) && isCoachOrAdmin && (
            <select
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value)}
              className="h-7 rounded border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {Object.keys(FORMATIONS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}

          {isCoachOrAdmin && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsEditing(true)}
            >
              Upravit sestavu
            </Button>
          )}

          {isEditing && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Ukládám...' : 'Uložit'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCancel}
              >
                Zrušit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Formation label when not editing */}
      {!isEditing && parsedLineup && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-0.5 font-mono font-semibold">
            {parsedLineup.formation}
          </span>
        </div>
      )}

      {/* Pitch */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: '2 / 3' }}
        onClick={() => {
          // Close any open pickers when clicking the pitch background
        }}
      >
        <PitchBackground />

        {/* Position slots */}
        {currentFormation?.positions.map((pos) => (
          <PositionSlot
            key={pos.slot}
            pos={pos}
            playerName={getPlayerName(assignments[pos.slot] ?? '')}
            isEditing={isEditing && isCoachOrAdmin}
            players={players}
            usedMemberIds={usedMemberIds}
            currentMemberId={assignments[pos.slot] ?? ''}
            onAssign={(memberId) => handleAssign(pos.slot, memberId)}
          />
        ))}

        {/* Editing hint overlay */}
        {isEditing && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] text-white/80">
            Klikni na pozici pro přiřazení hráče
          </div>
        )}
      </div>

      {/* Empty state when no lineup saved */}
      {!parsedLineup && !isEditing && isCoachOrAdmin && (
        <p className="text-xs text-muted-foreground">
          Klikněte na "Upravit sestavu" pro sestavení formace.
        </p>
      )}

      {!isCoachOrAdmin && !parsedLineup && (
        <p className="text-xs text-muted-foreground">Sestava zatím nebyla sestavena.</p>
      )}
    </div>
  );
}
