'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, Shield } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '@/components/query-provider';

type PublicClubData = {
  slug: string;
  name: string;
  theme: { primary: string; secondary: string; tertiary: string; styleId: number };
  memberCount: number;
  teams: Array<{
    id: string;
    name: string;
    sport: string;
    ageGroup: string | null;
    season: string;
  }>;
};

export default function PublicClubPage() {
  return (
    <QueryProvider>
      <PublicClubContent />
    </QueryProvider>
  );
}

function PublicClubContent() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<PublicClubData, ApiError>({
    queryKey: ['public-club', slug],
    queryFn: () => apiFetch<PublicClubData>(`/clubs/public/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h1 className="text-lg font-bold">Klub nenalezen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stránka klubu neexistuje nebo byla odstraněna.
        </p>
        <Button variant="outline" size="sm" className="mt-6" asChild>
          <Link href="/login">Přihlásit se</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="relative overflow-hidden px-6 py-16 text-center"
        style={{ backgroundColor: data.theme.primary + '15' }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: data.theme.primary }}
        >
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">{data.name}</h1>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {data.memberCount} členů
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            {data.teams.length} {data.teams.length === 1 ? 'tým' : data.teams.length < 5 ? 'týmy' : 'týmů'}
          </span>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/signup">Zaregistrovat se</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Přihlásit se</Link>
          </Button>
        </div>
      </div>

      {/* Teams */}
      <div className="mx-auto max-w-lg px-6 py-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Týmy
        </h2>
        <div className="space-y-3">
          {data.teams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: data.theme.primary }}
                >
                  {team.ageGroup ?? team.sport.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.sport}
                    {team.ageGroup && ` · ${team.ageGroup}`}
                    {` · ${team.season}`}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {team.sport}
                </Badge>
              </CardContent>
            </Card>
          ))}

          {data.teams.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Zatím žádné týmy.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/30 px-6 py-6 text-center text-xs text-muted-foreground">
        Powered by{' '}
        <Link href="/" className="text-primary hover:underline">
          Sport Manager
        </Link>
      </div>
    </div>
  );
}
