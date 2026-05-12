'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Clock, Users, Dumbbell, MapPin, Package, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { DrillDiagram } from '@/components/admin/drill-diagram';
import { DrillVideoPreview } from '@/components/admin/drill-video-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DRILLS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  AGE_GROUP_DESCRIPTIONS,
  AGE_GROUP_LABELS,
  formatAgeGroups,
  getPrimaryAgeGroup,
} from '@/lib/training-library';

export default function DrillDetailPage() {
  const { drillId } = useParams<{ drillId: string }>();
  const drill = DRILLS.find(d => d.id === drillId);

  if (!drill) {
    return (
      <>
        <PageHeader title="Cvičení nenalezeno" />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Toto cvičení neexistuje.</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/treninky"><ChevronLeft className="mr-1 h-3 w-3" />Zpět do knihovny</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Find related drills (same category, different drill)
  const related = DRILLS.filter(d => d.category === drill.category && d.id !== drill.id).slice(0, 3);
  const primaryAgeGroup = getPrimaryAgeGroup(drill);

  return (
    <>
      <PageHeader
        title={drill.name}
        subtitle={`${CATEGORY_LABELS[drill.category]} · ${formatAgeGroups(drill.ageGroups)} · ${drill.durationMin} min · ${DIFFICULTY_LABELS[drill.difficulty]}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/treninky"><ChevronLeft className="mr-1 h-4 w-4" />Knihovna</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero card with diagram */}
          <Card className="overflow-hidden">
            {/* Tactical diagram */}
            <DrillDiagram drillId={drill.id} category={drill.category} className="border-b border-border/30" />

            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`${CATEGORY_COLORS[drill.category]}`}>
                  {CATEGORY_LABELS[drill.category]}
                </Badge>
                <Badge className={`${DIFFICULTY_COLORS[drill.difficulty]}`}>
                  {DIFFICULTY_LABELS[drill.difficulty]}
                </Badge>
                {drill.sport !== 'universal' && (
                  <Badge variant="outline">{drill.sport === 'fotbal' ? '⚽ Fotbal' : '🏑 Florbal'}</Badge>
                )}
                <Badge variant="outline">Věk {formatAgeGroups(drill.ageGroups)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{drill.description}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
              <QuickStat icon={Clock} label="Délka" value={`${drill.durationMin} min`} />
              <QuickStat icon={Users} label="Hráči" value={`${drill.playersMin}–${drill.playersMax}`} />
              <QuickStat icon={Dumbbell} label="Věk" value={formatAgeGroups(drill.ageGroups)} />
              <QuickStat icon={MapPin} label="Prostor" value={drill.fieldSize ?? '—'} />
            </div>
          </Card>

          {/* Age-aware video preview */}
          <DrillVideoPreview drill={drill} />

          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                📋 Postup cvičení
              </h2>
              <ol className="space-y-3">
                {drill.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Coaching points */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                💡 Na co se zaměřit
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {drill.coachingPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span className="text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Equipment */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Pomůcky
              </h3>
              <ul className="space-y-2">
                {drill.equipment.map((eq, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {eq}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Age groups */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Vhodné pro</h3>
              <div className="flex flex-wrap gap-1.5">
                {drill.ageGroups.map(ag => (
                  <Badge
                    key={ag}
                    variant="outline"
                    className={`text-xs ${ag === primaryAgeGroup ? 'border-primary/40 bg-primary/10 text-primary' : ''}`}
                  >
                    {AGE_GROUP_LABELS[ag]}
                    {ag === primaryAgeGroup && <span className="ml-1 text-[10px]">dop.</span>}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {AGE_GROUP_DESCRIPTIONS[primaryAgeGroup]}
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">Klíčová slova</h3>
              <div className="flex flex-wrap gap-1.5">
                {drill.tags.map(tag => (
                  <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related drills */}
          {related.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Podobná cvičení</h3>
                <div className="space-y-2">
                  {related.map(r => (
                    <Link key={r.id} href={`/admin/treninky/${r.id}` as any}>
                      <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted">
                        <span className="text-lg">{CATEGORY_ICONS[r.category]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{r.name}</div>
                          <div className="text-[11px] text-muted-foreground">{r.durationMin} min · {DIFFICULTY_LABELS[r.difficulty]}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function QuickStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="min-w-0 p-4 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
      <div className="break-words text-xs font-semibold leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
