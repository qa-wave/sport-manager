'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Sparkles,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  PlayCircle,
  ScrollText,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, ApiError, type StrategyDto } from '@/lib/api';
import { useMemberContext } from '@/lib/member-context';
import {
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_CATEGORY_ICONS,
  STRATEGY_CATEGORY_COLORS,
  STRATEGY_DIFFICULTY,
  getYoutubeEmbed,
} from '@/lib/strategy-options';

export default function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: memberCtx } = useMemberContext();

  const query = useQuery({
    queryKey: ['strategy', id],
    queryFn: () => apiFetch<StrategyDto>(`/strategies/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/strategies/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      toast.success('Strategie smazána');
      router.push('/admin/library/strategies' as never);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Smazání selhalo');
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={'/admin/library/strategies' as never}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Strategie nenalezena.
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = query.data;
  const isCustom = s.source === 'CUSTOM';
  const canEdit =
    isCustom &&
    !!memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') ||
      memberCtx.clubRoles.includes('ADMIN') ||
      memberCtx.teamRoles.some((tr) => tr.role === 'HEAD_COACH'));

  const youtubeEmbed = getYoutubeEmbed(s.videoUrl);
  const difficultyLabel =
    STRATEGY_DIFFICULTY.find((d) => d.value === s.difficulty)?.label ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        subtitle={s.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={'/admin/library/strategies' as never}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zpět
              </Link>
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/admin/library/strategies/${s.id}/edit` as never}>
                    <Edit className="h-4 w-4 mr-1" />
                    Upravit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Opravdu smazat strategii „${s.name}“?`)) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Smazat
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={`border-0 ${STRATEGY_CATEGORY_COLORS[s.category]}`}
        >
          {STRATEGY_CATEGORY_ICONS[s.category]}{' '}
          {STRATEGY_CATEGORY_LABELS[s.category]}
        </Badge>
        {s.formation && <Badge variant="outline">{s.formation}</Badge>}
        {s.sports.map((sp) => (
          <Badge key={sp} variant="outline" className="capitalize">
            {sp}
          </Badge>
        ))}
        {difficultyLabel && (
          <Badge variant="outline">Náročnost: {difficultyLabel}</Badge>
        )}
        {s.ageGroups.length > 0 && (
          <Badge variant="outline">{s.ageGroups.join(', ')}</Badge>
        )}
        {isCustom ? (
          <Badge className="bg-accent text-accent-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            Klubová strategie
          </Badge>
        ) : (
          <Badge variant="outline">Knihovna platformy</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: video + content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video */}
          <Card className="overflow-hidden">
            <div className="bg-black">
              {youtubeEmbed ? (
                <div className="aspect-video">
                  <iframe
                    src={youtubeEmbed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : s.videoUrl ? (
                <video
                  src={s.videoUrl}
                  controls
                  poster={s.posterUrl ?? undefined}
                  className="w-full aspect-video"
                />
              ) : s.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.posterUrl} alt={s.name} className="w-full aspect-video object-cover" />
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-2 text-white/60 bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-slate-900/80">
                  <PlayCircle className="h-12 w-12" strokeWidth={1.5} />
                  <span className="text-xs">Animované video zatím nebylo přidáno</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reasoning sections */}
          {(s.whenToUse || s.counterTo || s.reasoning) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {s.whenToUse && (
                <Card>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-4 w-4 text-primary" />
                      Kdy ji nasadit
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {s.whenToUse}
                    </p>
                  </CardContent>
                </Card>
              )}
              {s.counterTo && (
                <Card>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Funguje proti
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {s.counterTo}
                    </p>
                  </CardContent>
                </Card>
              )}
              {s.reasoning && (
                <Card className="sm:col-span-2">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Proč to funguje
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {s.reasoning}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Key points */}
          {s.keyPoints.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold">Klíčové teze</h2>
                <ol className="space-y-2 text-sm">
                  {s.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-semibold text-primary shrink-0 w-5">
                        {i + 1}.
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: roles */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                Role a úkoly
              </div>
              {s.roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Pro tuto strategii nebyly definovány role.
                </p>
              ) : (
                <ul className="space-y-3">
                  {s.roles.map((role, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5"
                    >
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/15 text-primary text-[11px]">
                          {i + 1}
                        </span>
                        {role.name || 'Role'}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                        {role.description}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {s.tags.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="text-sm font-semibold">Tagy</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      #{t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/30">
            <CardContent className="p-5 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <ScrollText className="h-3.5 w-3.5" />
                Meta
              </div>
              {s.createdByName && <div>Vytvořil: {s.createdByName}</div>}
              <div>Aktualizováno: {new Date(s.updatedAt).toLocaleDateString('cs-CZ')}</div>
              <div>Použito: {s.usageCount}×</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
