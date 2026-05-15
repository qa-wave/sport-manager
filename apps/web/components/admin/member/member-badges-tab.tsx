'use client';

import { Award, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberBadgesResponse } from '@/lib/api';

interface MemberBadgesTabProps {
  badges: MemberBadgesResponse;
}

export function MemberBadgesTab({ badges }: MemberBadgesTabProps) {
  const earnedCount = badges.badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                badges.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
              }`}
            >
              {badges.currentStreak}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Aktuální série</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1">
              <Flame className="h-5 w-5 text-primary/60" />
            </div>
            <div className="text-2xl font-bold tabular-nums">{badges.longestStreak}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Nejdelší série</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-1">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold tabular-nums">{badges.totalAttended}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Účastí celkem</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div
              className={`text-2xl font-bold tabular-nums mt-5 ${
                badges.attendanceRate >= 80
                  ? 'text-green-600 dark:text-green-400'
                  : badges.attendanceRate >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {badges.attendanceRate}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Míra účasti</div>
          </CardContent>
        </Card>
      </div>

      {/* Badge grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-primary" />
            Odznaky
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {earnedCount}/{badges.badges.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {badges.badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  badge.earned
                    ? 'border-primary/20 bg-primary/[0.03] shadow-sm'
                    : 'border-border/40 bg-muted/20 opacity-50 grayscale'
                }`}
              >
                <div className={`text-3xl ${badge.earned ? '' : 'opacity-40'}`}>{badge.icon}</div>
                <div>
                  <div
                    className={`text-xs font-semibold ${
                      badge.earned ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {badge.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {badge.description}
                  </div>
                  {badge.earned && badge.earnedAt && (
                    <div className="mt-1.5 text-[10px] font-medium text-primary">
                      {new Date(badge.earnedAt).toLocaleDateString('cs-CZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  {!badge.earned && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground/60">Nezískaný</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
