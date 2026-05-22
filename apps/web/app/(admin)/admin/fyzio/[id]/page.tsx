'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, Sparkles, Clock, Loader2 } from 'lucide-react';
import { apiFetch, ApiError, type ExerciseDto } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/admin/page-header';
import { useMemberContext } from '@/lib/member-context';
import { BODY_AREA_LABELS, PHYSIO_TYPE_LABELS, type BodyArea, type PhysioType } from '@/lib/physio-library';

export default function FyzioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => apiFetch<ExerciseDto>(`/exercises/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch<{ ok: true }>(`/exercises/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      toast.success('Cvik smazán');
      router.push('/admin/fyzio');
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Mazání selhalo';
      toast.error(msg);
    },
  });

  const canEdit =
    !!memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') ||
      memberCtx.clubRoles.includes('ADMIN') ||
      memberCtx.teamRoles.some((tr) => tr.role === 'HEAD_COACH'));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Cvik nenalezen.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={'/admin/fyzio' as never}>Zpět na fyzio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        subtitle={data.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={'/admin/fyzio' as never}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zpět
              </Link>
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/admin/exercises/${data.id}/edit` as never}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Upravit
                  </Link>
                </Button>
                {confirmDelete ? (
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Opravdu smazat
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Smazat
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-64 bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
                {data.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.imageUrls[0]}
                    alt={data.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-7xl opacity-60">{data.icon ?? '💪'}</span>
                )}
              </div>
              <div className="p-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-accent text-accent-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Klubový cvik
                  </Badge>
                  {data.categoryName && (
                    <Badge variant="outline">{data.categoryName}</Badge>
                  )}
                  {data.physioType && (
                    <Badge variant="outline">
                      {PHYSIO_TYPE_LABELS[data.physioType as PhysioType] ?? data.physioType}
                    </Badge>
                  )}
                </div>
                {data.description && (
                  <p className="text-sm leading-relaxed">{data.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {data.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {data.durationMinutes} min
                    </span>
                  )}
                  {data.bodyAreas.length > 0 && (
                    <span>
                      {data.bodyAreas
                        .map((b) => BODY_AREA_LABELS[b as BodyArea] ?? b)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {data.instructions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-sm mb-4">Postup</h2>
                <ol className="space-y-3">
                  {data.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Coaching points */}
          {data.coachingPoints.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-sm mb-4">Coaching points</h2>
                <ul className="space-y-2">
                  {data.coachingPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm">Detail</h2>
              {data.equipment.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pomůcky</p>
                  <div className="flex flex-wrap gap-1">
                    {data.equipment.map((e) => (
                      <Badge key={e} variant="default" className="text-[11px]">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {data.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tagy</p>
                  <div className="flex flex-wrap gap-1">
                    {data.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {data.createdByName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vytvořil/a</p>
                  <p className="text-sm">{data.createdByName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {data.youtubeId && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${data.youtubeId}`}
                    title={data.name}
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
