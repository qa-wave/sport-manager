'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';
import { formatDate } from '@/lib/date-utils';
import type { MemberDetail } from '@/lib/api';

type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';

const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Aktivní' },
  { value: 'INACTIVE', label: 'Neaktivní' },
  { value: 'SUSPENDED', label: 'Pozastavený' },
  { value: 'ARCHIVED', label: 'Archivovaný' },
];

function memberAge(dob: string | null): string | null {
  if (!dob) return null;
  return `${new Date().getFullYear() - new Date(dob).getFullYear()}`;
}

interface MemberHeaderProps {
  member: MemberDetail;
  canManage: boolean;
  statusIsPending: boolean;
  statusIsError: boolean;
  onStatusChange: (status: MemberStatus) => void;
}

export function MemberHeader({
  member: m,
  canManage,
  statusIsPending,
  statusIsError,
  onStatusChange,
}: MemberHeaderProps) {
  const ageStr = memberAge(m.dateOfBirth);

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
      <CardContent className="relative p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
              <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                {m.firstName[0]}
                {m.lastName[0]}
              </AvatarFallback>
            </Avatar>
            {m.jerseyNumber != null && (
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                {m.jerseyNumber}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight">
                {m.firstName} {m.lastName}
              </h2>
              {canManage ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Stav:</span>
                  <select
                    value={m.status}
                    disabled={statusIsPending}
                    onChange={(e) => onStatusChange(e.target.value as MemberStatus)}
                    className="h-7 rounded-md border border-input bg-transparent px-2 py-0 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {statusIsPending && (
                    <span className="text-[11px] text-muted-foreground">Ukládám...</span>
                  )}
                  {statusIsError && (
                    <span className="text-[11px] text-destructive">Chyba</span>
                  )}
                </div>
              ) : (
                <Badge variant={STATUS_VARIANT[m.status] ?? 'default'}>{m.status}</Badge>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{m.email}</span>
              {m.phone && <span>{m.phone}</span>}
              {ageStr && <span className="font-medium text-foreground/70">{ageStr} let</span>}
              {m.dateOfBirth && <span>Narozen {formatDate(m.dateOfBirth)}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.position && (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  {m.position}
                </Badge>
              )}
              {m.clubRoles.map((r) => (
                <Badge key={r} variant={ROLE_VARIANT[r] ?? 'default'}>
                  {r}
                </Badge>
              ))}
            </div>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <div className="rounded-md bg-secondary/50 px-2.5 py-1.5">
              <div className="font-medium text-foreground/80">
                Přidal se {formatDate(m.joinedAt)}
              </div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wide">{m.locale}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
