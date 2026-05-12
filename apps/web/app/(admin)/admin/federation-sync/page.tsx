'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Globe,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types (mirrors server-side types)
// ---------------------------------------------------------------------------
type FederationListItem = {
  id: string;
  name: string;
  country: string;
  sport: string;
  flag: string;
  status: 'active' | 'coming_soon';
};

type FederationTeam = {
  externalId: string;
  name: string;
  competition?: string;
  ageGroup?: string;
  logo?: string;
};

type FederationFixture = {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  location?: string;
  competition?: string;
  round?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
};

type InternalTeam = {
  id: string;
  name: string;
};

type SyncResult = {
  created: number;
  skipped: number;
  errors: string[];
};

type WizardStep = 'federation' | 'team' | 'fixtures' | 'done';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Step 1: Vyberte svaz
// ---------------------------------------------------------------------------
function StepFederation({
  onSelect,
}: {
  onSelect: (fed: FederationListItem) => void;
}) {
  const { data: federations, isLoading, isError } = useQuery<FederationListItem[], ApiError>({
    queryKey: ['federation-adapters'],
    queryFn: () => apiFetch<FederationListItem[]>('/federation/adapters'),
    staleTime: 60 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Nacitam svazy...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Nepodařilo se načíst seznam svazů.
      </div>
    );
  }

  const active = federations?.filter((f) => f.status === 'active') ?? [];
  const stubs = federations?.filter((f) => f.status === 'coming_soon') ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Vyberte sportovní svaz, ze kterého chcete stáhnout rozpis zápasů.
      </p>

      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dostupné adaptéry
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((fed) => (
              <button
                key={fed.id}
                type="button"
                onClick={() => onSelect(fed)}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="text-2xl" aria-hidden="true">
                  {fed.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{fed.name}</p>
                  <p className="text-xs text-muted-foreground">{fed.sport}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-0">
                  Aktivní
                </Badge>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {stubs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Brzy dostupné
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stubs.map((fed) => (
              <div
                key={fed.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 px-4 py-3 opacity-60"
              >
                <span className="text-2xl" aria-hidden="true">
                  {fed.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{fed.name}</p>
                  <p className="text-xs text-muted-foreground">{fed.sport}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  Brzy
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Najděte svůj tým
// ---------------------------------------------------------------------------
function StepTeamSearch({
  adapterId,
  onSelect,
}: {
  adapterId: string;
  onSelect: (team: FederationTeam) => void;
}) {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data: results, isFetching, isError } = useQuery<FederationTeam[], ApiError>({
    queryKey: ['federation-search', adapterId, submitted],
    queryFn: () => apiFetch<FederationTeam[]>(`/federation/${adapterId}/search?q=${encodeURIComponent(submitted)}`),
    enabled: submitted.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

  const handleSearch = () => {
    if (q.trim().length >= 2) setSubmitted(q.trim());
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Zadejte název vašeho týmu a vyhledejte ho v databázi svazu.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Název týmu, např. FC Hvězda..."
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={q.trim().length < 2 || isFetching}
          onClick={handleSearch}
          className="shrink-0"
        >
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Hledat'}
        </Button>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Vyhledávání selhalo. Zkuste to znovu.
        </div>
      )}

      {results && results.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Žádný tým nenalezen. Zkuste jiný název.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Nalezeno {results.length} {results.length === 1 ? 'tým' : results.length < 5 ? 'týmy' : 'týmů'}
          </p>
          <div className="space-y-1.5">
            {results.map((team) => (
              <button
                key={team.externalId}
                type="button"
                onClick={() => onSelect(team)}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {team.logo ? (
                  <img src={team.logo} alt="" className="h-8 w-8 rounded object-contain" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{team.name}</p>
                  {(team.competition || team.ageGroup) && (
                    <p className="text-xs text-muted-foreground">
                      {[team.competition, team.ageGroup].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Importujte rozpis
// ---------------------------------------------------------------------------
function StepFixtures({
  adapterId,
  federationTeam,
  onDone,
}: {
  adapterId: string;
  federationTeam: FederationTeam;
  onDone: (result: SyncResult) => void;
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [internalTeamId, setInternalTeamId] = useState<string>('');

  const { data: fixtures, isLoading, isError, refetch } = useQuery<FederationFixture[], ApiError>({
    queryKey: ['federation-fixtures', adapterId, federationTeam.externalId],
    queryFn: () =>
      apiFetch<FederationFixture[]>(
        `/federation/${adapterId}/fixtures/${encodeURIComponent(federationTeam.externalId)}`,
      ),
    staleTime: 5 * 60_000,
  });

  const { data: teams } = useQuery<InternalTeam[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<InternalTeam[]>('/teams'),
    staleTime: 5 * 60_000,
  });

  const syncMutation = useMutation<SyncResult, ApiError, void>({
    mutationFn: () => {
      const chosen = (fixtures ?? []).filter((f) => selected.has(f.externalId));
      return apiFetch<SyncResult>('/federation/sync', {
        method: 'POST',
        body: JSON.stringify({
          adapterId,
          teamId: federationTeam.externalId,
          teamIdInternal: internalTeamId,
          fixtures: chosen,
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', auth.clubId] });
      onDone(data);
    },
  });

  // Auto-select all scheduled fixtures when they load
  const prevLoaded = fixtures?.length;
  if (fixtures && fixtures.length > 0 && selected.size === 0 && prevLoaded === fixtures.length) {
    const ids = new Set(
      fixtures.filter((f) => f.status !== 'completed').map((f) => f.externalId),
    );
    if (ids.size > 0) setSelected(ids);
  }

  const toggleFixture = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!fixtures) return;
    const scheduledIds = fixtures
      .filter((f) => f.status !== 'completed')
      .map((f) => f.externalId);
    if (selected.size === scheduledIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(scheduledIds));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Nacitam rozpis...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Nepodařilo se načíst rozpis zápasů.
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    );
  }

  const scheduledCount = fixtures?.filter((f) => f.status !== 'completed').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Vyberte zápasy, které chcete importovat jako události v kalendáři.
        </p>
        {scheduledCount > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-primary hover:underline shrink-0"
          >
            {selected.size === scheduledCount ? 'Odznačit vše' : 'Vybrat vše'}
          </button>
        )}
      </div>

      {fixtures && fixtures.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Nenalezeny žádné nadcházející zápasy pro tento tým.
        </div>
      )}

      {fixtures && fixtures.length > 0 && (
        <div className="space-y-1.5 max-h-80 overflow-y-auto rounded-lg border border-border/50 p-2">
          {fixtures.map((fixture) => {
            const isChecked = selected.has(fixture.externalId);
            const isCompleted = fixture.status === 'completed';
            return (
              <label
                key={fixture.externalId}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors',
                  isCompleted
                    ? 'opacity-50 cursor-default'
                    : isChecked
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-muted/60',
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isCompleted}
                  onChange={() => !isCompleted && toggleFixture(fixture.externalId)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {fixture.homeTeam} vs {fixture.awayTeam}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(fixture.date)}
                    {fixture.location ? ` · ${fixture.location}` : ''}
                  </p>
                  {(fixture.competition || fixture.round) && (
                    <p className="text-xs text-muted-foreground">
                      {[fixture.competition, fixture.round].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </div>
                {isCompleted && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Odehráno
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      )}

      {/* Team mapping */}
      <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
        <Label htmlFor="internal-team" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Přiřadit k týmu
        </Label>
        <select
          id="internal-team"
          value={internalTeamId}
          onChange={(e) => setInternalTeamId(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Vyberte tým ze Sport Manageru...</option>
          {(teams ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Importované zápasy budou přidány do kalendáře tohoto týmu.
        </p>
      </div>

      {syncMutation.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Import selhal: {syncMutation.error.message}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={selected.size === 0 || !internalTeamId || syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Importuji...
            </>
          ) : (
            `Importovat ${selected.size} ${selected.size === 1 ? 'zápas' : selected.size < 5 ? 'zápasy' : 'zápasů'}`
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Hotovo
// ---------------------------------------------------------------------------
function StepDone({
  result,
  onReset,
}: {
  result: SyncResult;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
        <div>
          <p className="font-semibold text-green-700 dark:text-green-400">
            Import dokoncen
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Vytvoreno {result.created}{' '}
            {result.created === 1 ? 'zápas' : result.created < 5 ? 'zápasy' : 'zápasů'}.
            {result.skipped > 0 && ` Preskoceno ${result.skipped} duplicit.`}
          </p>
          {result.errors.length > 0 && (
            <p className="text-xs text-destructive mt-1">
              {result.errors.length} zápasů se nepodařilo importovat.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
        <p className="text-sm font-medium">Nastavit automatický sync</p>
        <p className="text-xs text-muted-foreground">
          Automatická synchronizace rozpisů z ligy bude dostupná v příští verzi.
          Prozatím spuste sync rucně kdykoli potřebujete aktualizovat rozpis.
        </p>
        <Badge variant="outline" className="text-[10px]">Brzy dostupné</Badge>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href="/admin/events">Zobrazit kalendář</a>
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset}>
          Nový sync
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb / progress bar
// ---------------------------------------------------------------------------
const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'federation', label: 'Svaz' },
  { key: 'team', label: 'Tým' },
  { key: 'fixtures', label: 'Zápasy' },
  { key: 'done', label: 'Hotovo' },
];

function WizardProgress({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const past = i < idx;
        const active = i === idx;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : past
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {past ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs hidden sm:inline',
                active ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function FederationSyncPage() {
  const [step, setStep] = useState<WizardStep>('federation');
  const [selectedFederation, setSelectedFederation] = useState<FederationListItem | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<FederationTeam | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSelectFederation = (fed: FederationListItem) => {
    setSelectedFederation(fed);
    setSelectedTeam(null);
    setSyncResult(null);
    setStep('team');
  };

  const handleSelectTeam = (team: FederationTeam) => {
    setSelectedTeam(team);
    setSyncResult(null);
    setStep('fixtures');
  };

  const handleDone = (result: SyncResult) => {
    setSyncResult(result);
    setStep('done');
  };

  const handleReset = () => {
    setStep('federation');
    setSelectedFederation(null);
    setSelectedTeam(null);
    setSyncResult(null);
  };

  const goBack = () => {
    if (step === 'team') setStep('federation');
    else if (step === 'fixtures') setStep('team');
  };

  return (
    <>
      <PageHeader
        title="Liga sync"
        subtitle="Stáhněte rozpis zápasů přímo ze sportovního svazu"
        actions={
          step !== 'federation' && step !== 'done' ? (
            <Button variant="ghost" size="sm" onClick={goBack}>
              Zpět
            </Button>
          ) : undefined
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Progress */}
        <WizardProgress current={step} />

        {/* Context breadcrumb */}
        {(selectedFederation || selectedTeam) && step !== 'done' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {selectedFederation && (
              <>
                <span>{selectedFederation.flag}</span>
                <span className="font-medium text-foreground">{selectedFederation.name}</span>
              </>
            )}
            {selectedTeam && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{selectedTeam.name}</span>
                {selectedTeam.ageGroup && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {selectedTeam.ageGroup}
                  </Badge>
                )}
              </>
            )}
          </div>
        )}

        {/* Step content */}
        <Card>
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {step === 'federation' && 'Krok 1: Vyberte svaz'}
                  {step === 'team' && 'Krok 2: Najděte váš tým'}
                  {step === 'fixtures' && 'Krok 3: Vyberte zápasy'}
                  {step === 'done' && 'Import dokoncen'}
                </p>
              </div>
            </div>

            {step === 'federation' && (
              <StepFederation onSelect={handleSelectFederation} />
            )}

            {step === 'team' && selectedFederation && (
              <StepTeamSearch
                adapterId={selectedFederation.id}
                onSelect={handleSelectTeam}
              />
            )}

            {step === 'fixtures' && selectedFederation && selectedTeam && (
              <StepFixtures
                adapterId={selectedFederation.id}
                federationTeam={selectedTeam}
                onDone={handleDone}
              />
            )}

            {step === 'done' && syncResult && (
              <StepDone result={syncResult} onReset={handleReset} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
