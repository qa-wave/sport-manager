'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_VARIANT } from '@/lib/role-colors';
import type { MemberDetail } from '@/lib/api';

function PermBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={on ? 'text-accent-foreground' : 'text-muted-foreground line-through opacity-50'}>
      {label}
    </span>
  );
}

interface MemberTeamsTabProps {
  member: MemberDetail;
}

export function MemberTeamsTab({ member: m }: MemberTeamsTabProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Teams */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Týmy a role</CardTitle>
        </CardHeader>
        <CardContent>
          {m.teamRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Žádná přiřazení k týmu</p>
          ) : (
            <div className="space-y-2">
              {m.teamRoles.map((tr) => (
                <div
                  key={`${tr.teamId}-${tr.role}`}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">{tr.teamName}</div>
                    <div className="text-xs text-muted-foreground">
                      {(tr as any).sport} · {(tr as any).season}
                      {tr.ageGroup ? ` · ${tr.ageGroup}` : ''}
                    </div>
                  </div>
                  <Badge variant={ROLE_VARIANT[tr.role] ?? 'default'}>
                    {tr.role.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guardians */}
      {m.guardians.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Zákonní zástupci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(m.guardians as any[]).map((g: any) => (
              <div key={g.memberId}>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/members/${g.memberId}` as any}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {g.name}
                  </Link>
                  <div className="flex gap-1">
                    {g.isPrimary && <Badge variant="success">PRIMÁRNÍ</Badge>}
                    <Badge variant="outline">{g.relationship}</Badge>
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {g.email}
                  {g.phone ? ` · ${g.phone}` : ''}
                </div>
                <div className="mt-1 flex gap-2 text-xs">
                  <PermBadge label="Platby (zobrazit)" on={g.canViewPayments} />
                  <PermBadge label="Platby (provést)" on={g.canMakePayments} />
                  <PermBadge label="Zdravotní" on={g.canViewMedical} />
                  <PermBadge label="Souhlasy" on={g.canSignWaivers} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Guardian of */}
      {m.guardianOf.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Zákonný zástupce ({m.guardianOf.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(m.guardianOf as any[]).map((c: any) => (
              <div key={c.memberId}>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/members/${c.memberId}` as any}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {c.name}
                  </Link>
                  {c.jerseyNumber != null && (
                    <Badge variant="outline" className="font-mono">
                      #{c.jerseyNumber}
                    </Badge>
                  )}
                </div>
                {c.teams?.length > 0 && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {c.teams.join(' · ')}
                  </div>
                )}
                <div className="mt-1 flex gap-2 text-xs">
                  <PermBadge label="Platby" on={c.canViewPayments} />
                  <PermBadge label="Zdravotní" on={c.canViewMedical} />
                  <PermBadge label="Souhlasy" on={c.canSignWaivers} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Medical notes */}
      {m.medicalNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Zdravotní poznámky</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{m.medicalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
