'use client';

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSignature,
  Plus,
  ChevronLeft,
  Users,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type WaiverSummary = {
  id: string;
  title: string;
  body: string;
  version: number;
  type: 'GDPR' | 'HEALTH' | 'LIABILITY' | 'MEDIA_CONSENT';
  requiredForMinors: boolean;
  createdAt: string;
  signedCount: number;
  memberCount: number;
};

type PendingData = {
  waiver: { id: string; title: string };
  pending: Array<{ memberId: string; name: string; email: string; isMinor: boolean }>;
};

const WAIVER_TYPE_LABELS: Record<string, string> = {
  GDPR: 'GDPR',
  HEALTH: 'Zdravotní',
  LIABILITY: 'Odpovědnost',
  MEDIA_CONSENT: 'Souhlas s médii',
};

const WAIVER_TYPE_COLORS: Record<string, string> = {
  GDPR: 'bg-blue-500/10 text-blue-600 border-blue-200',
  HEALTH: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  LIABILITY: 'bg-amber-500/10 text-amber-600 border-amber-200',
  MEDIA_CONSENT: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
};

export default function WaiversClient() {
  const auth = useAuth();
  const { data: memberCtx } = useMemberContext();
  const queryClient = useQueryClient();

  const isAdmin =
    memberCtx?.clubRoles.includes('OWNER') || memberCtx?.clubRoles.includes('ADMIN');

  const [selected, setSelected] = useState<WaiverSummary | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: waivers, isLoading } = useQuery<WaiverSummary[], ApiError>({
    queryKey: ['waivers', auth.clubId],
    queryFn: () => apiFetch<WaiverSummary[]>('/waivers'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery<PendingData, ApiError>({
    queryKey: ['waivers-pending', selected?.id],
    queryFn: () => apiFetch<PendingData>(`/waivers/${selected!.id}/pending`),
    enabled: !!selected,
  });

  const signMutation = useMutation({
    mutationFn: ({ waiverId, memberId }: { waiverId: string; memberId: string }) =>
      apiFetch(`/waivers/${waiverId}/sign`, {
        method: 'POST',
        body: JSON.stringify({ memberId, signature: 'digital-consent' }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waivers', auth.clubId] });
      void queryClient.invalidateQueries({ queryKey: ['waivers-pending', selected?.id] });
    },
  });

  if (selected) {
    return (
      <>
        <PageHeader
          title={selected.title}
          subtitle={`${WAIVER_TYPE_LABELS[selected.type]} · verze ${selected.version}`}
          actions={
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpět na souhlasy
            </Button>
          }
        />

        {/* Waiver body */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Text souhlasu</h3>
            <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {selected.body}
            </div>
          </CardContent>
        </Card>

        {/* Pending members */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Čeká na podpis {pendingData ? `(${pendingData.pending.length})` : ''}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {selected.signedCount} / {selected.memberCount} podepsáno
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingData?.pending.length === 0 ? (
              <div className="py-10 text-center">
                <Check className="mx-auto mb-2 h-8 w-8 text-emerald-500/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Wszystkci členové podepsali
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {pendingData?.pending.map((m) => (
                  <div key={m.memberId} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </div>
                    {m.isMinor && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        nezletilý
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() =>
                        signMutation.mutate({ waiverId: selected.id, memberId: m.memberId })
                      }
                      disabled={signMutation.isPending}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Podepsat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  if (showCreate && isAdmin) {
    return (
      <>
        <PageHeader
          title="Nový souhlas"
          actions={
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpět
            </Button>
          }
        />
        <CreateWaiverForm
          onCreated={() => {
            setShowCreate(false);
            void queryClient.invalidateQueries({ queryKey: ['waivers', auth.clubId] });
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Souhlasy"
        subtitle="GDPR, zdravotní a mediální souhlasy"
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nový souhlas
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !waivers?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSignature className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">Žádné souhlasy</p>
            {isAdmin && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Vytvořte první souhlas kliknutím na tlačítko výše.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {waivers.map((w) => (
            <button
              key={w.id}
              className="w-full text-left"
              onClick={() => setSelected(w)}
            >
              <Card className="overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileSignature className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{w.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${WAIVER_TYPE_COLORS[w.type] ?? ''}`}
                        >
                          {WAIVER_TYPE_LABELS[w.type] ?? w.type}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {w.signedCount} / {w.memberCount} podepsáno
                        </span>
                        <span>verze {w.version}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {w.signedCount === w.memberCount && w.memberCount > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                          <Check className="h-3 w-3" />
                          Hotovo
                        </span>
                      ) : w.memberCount - w.signedCount > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          {w.memberCount - w.signedCount} zbývá
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Create waiver form
// ---------------------------------------------------------------------------

const WAIVER_TYPES = ['GDPR', 'HEALTH', 'LIABILITY', 'MEDIA_CONSENT'] as const;

function CreateWaiverForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<(typeof WAIVER_TYPES)[number]>('GDPR');
  const [requiredForMinors, setRequiredForMinors] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/waivers', {
        method: 'POST',
        body: JSON.stringify({ title, body, type, requiredForMinors }),
      }),
    onSuccess: onCreated,
    onError: (err: ApiError) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError('Název a text souhlasu jsou povinné.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Název <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="GDPR — zpracování osobních údajů"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Typ</label>
            <div className="flex flex-wrap gap-2">
              {WAIVER_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    type === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {WAIVER_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Text souhlasu <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Souhlas se zpracováním osobních údajů..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={requiredForMinors}
              onClick={() => setRequiredForMinors((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                requiredForMinors ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                  requiredForMinors ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">Povinný pro nezletilé</span>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Ukládám...' : 'Vytvořit souhlas'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
