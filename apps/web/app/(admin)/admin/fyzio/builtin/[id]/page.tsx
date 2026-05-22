'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/page-header';
import {
  getPhysioById,
  PHYSIO_CATEGORY_LABELS,
  PHYSIO_CATEGORY_COLORS,
  BODY_AREA_LABELS,
  PHYSIO_TYPE_LABELS,
  PHYSIO_EQUIPMENT_LABELS,
} from '@/lib/physio-library';

export default function BuiltinPhysioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ex = getPhysioById(id);

  if (!ex) {
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
        title={ex.name}
        subtitle={ex.description}
        actions={
          <Button variant="outline" asChild>
            <Link href={'/admin/fyzio' as never}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpět
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-56 bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
                <span className="text-7xl opacity-60">{ex.icon}</span>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={PHYSIO_CATEGORY_COLORS[ex.category]}>
                    {PHYSIO_CATEGORY_LABELS[ex.category]}
                  </Badge>
                  <Badge variant="outline">{PHYSIO_TYPE_LABELS[ex.type]}</Badge>
                </div>
                <p className="text-sm leading-relaxed">{ex.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {ex.durationMin} min
                  </span>
                  {ex.sets && <span>{ex.sets}× sady</span>}
                  {ex.reps && <span>{ex.reps} opak.</span>}
                  <span>
                    {ex.bodyAreas.map((b) => BODY_AREA_LABELS[b]).join(', ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-sm mb-4">Postup</h2>
              <ol className="space-y-3">
                {ex.instructions.map((step, i) => (
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

          {ex.coachingPoints.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-sm mb-4">Coaching points</h2>
                <ul className="space-y-2">
                  {ex.coachingPoints.map((p, i) => (
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

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm">Detail</h2>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pomůcky</p>
                <div className="flex flex-wrap gap-1">
                  {ex.equipment.map((e) => (
                    <Badge key={e} variant="default" className="text-[11px]">
                      {PHYSIO_EQUIPMENT_LABELS[e]}
                    </Badge>
                  ))}
                </div>
              </div>
              {ex.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tagy</p>
                  <div className="flex flex-wrap gap-1">
                    {ex.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Badge variant="outline" className="text-[11px]">
                Knihovna platformy
              </Badge>
            </CardContent>
          </Card>

          {ex.youtubeId && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${ex.youtubeId}`}
                    title={ex.name}
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
