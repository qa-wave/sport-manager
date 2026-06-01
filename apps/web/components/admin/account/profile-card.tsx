'use client';

import { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ROLE_VARIANT } from '@/lib/role-colors';
import { apiFetch, type MeResponse } from '@/lib/api';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';

interface ProfileCardProps {
  me: MeResponse;
  clubName: string | undefined;
}

export function ProfileCard({ me, clubName }: ProfileCardProps) {
  const { data: memberCtx } = useMemberContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(me.firstName);
  const [lastName, setLastName] = useState(me.lastName);
  const [nickname, setNickname] = useState(me.nickname ?? '');

  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : null;
  const initials = (me.firstName[0] ?? '') + (me.lastName[0] ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, nickname }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  return (
    <>
      {/* Avatar hero */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
        <CardContent className="relative flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {roleLabel && (
              <Badge
                variant={ROLE_VARIANT[memberCtx?.clubRoles[0] ?? ''] ?? 'default'}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px]"
              >
                {roleLabel}
              </Badge>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold">
              {me.nickname?.trim() || `${me.firstName} ${me.lastName}`}
            </h2>
            {me.nickname?.trim() && (
              <p className="text-xs text-muted-foreground">{me.firstName} {me.lastName}</p>
            )}
            <p className="text-sm text-muted-foreground">{me.email}</p>
            {clubName && <p className="mt-1 text-xs text-primary/70">{clubName}</p>}
          </div>

          {/* Stats row */}
          {memberCtx && (
            <div className="mt-2 flex divide-x divide-border rounded-lg border border-border/50 bg-secondary/30">
              <div className="px-5 py-2 text-center">
                <div className="text-lg font-bold text-primary">{memberCtx.teamRoles.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Týmy
                </div>
              </div>
              <div className="px-5 py-2 text-center">
                <div className="text-lg font-bold">{memberCtx.clubRoles.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Role
                </div>
              </div>
              {memberCtx.guardianOf.length > 0 && (
                <div className="px-5 py-2 text-center">
                  <div className="text-lg font-bold text-emerald-500">
                    {memberCtx.guardianOf.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Děti
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit profile card */}
      {!editing ? (
        <Card className="overflow-hidden">
          <CardContent className="divide-y divide-border/30 p-0">
            <button
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
              onClick={() => setEditing(true)}
            >
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Upravit profil</div>
                <div className="text-xs text-muted-foreground">
                  {me.firstName} {me.lastName} · {me.email}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 pb-1">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Upravit profil</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Jméno</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Příjmení</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Přezdívka (nickname)</label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Jak ti máme říkat"
                maxLength={40}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={me.email} disabled className="h-8 text-sm opacity-50" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditing(false)}
              >
                Zrušit
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Ukládám...' : 'Uložit'}
              </Button>
            </div>
            {mutation.isError && (
              <div className="text-xs text-destructive">Nepodařilo se uložit.</div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
