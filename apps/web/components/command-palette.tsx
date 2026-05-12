'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CalendarDays,
  Shield,
  MessageCircle,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

/* ── Types ──────────────────────────────────────────── */

type SearchMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
};

type SearchEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
};

type SearchTeam = {
  id: string;
  name: string;
  ageGroup: string | null;
  sport: string;
};

type SearchConversation = {
  id: string;
  title: string;
  type: string;
};

type SearchResults = {
  members: SearchMember[];
  events: SearchEvent[];
  teams: SearchTeam[];
  conversations: SearchConversation[];
};

/* ── Helpers ────────────────────────────────────────── */

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
  });
}

/* ── Command Palette ────────────────────────────────── */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const auth = useAuth();

  // Debounce query by 200ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  // Cmd+K / Ctrl+K trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  const { data, isFetching } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => apiFetch<SearchResults>(`/me/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: auth.isAuthenticated && debouncedQuery.length > 0,
    staleTime: 10_000,
  });

  // Build flat list of all results for keyboard nav
  type ResultItem =
    | { kind: 'member'; item: SearchMember }
    | { kind: 'event'; item: SearchEvent }
    | { kind: 'team'; item: SearchTeam }
    | { kind: 'conversation'; item: SearchConversation };

  const allItems: ResultItem[] = [
    ...(data?.members.map((item) => ({ kind: 'member' as const, item })) ?? []),
    ...(data?.events.map((item) => ({ kind: 'event' as const, item })) ?? []),
    ...(data?.teams.map((item) => ({ kind: 'team' as const, item })) ?? []),
    ...(data?.conversations.map((item) => ({ kind: 'conversation' as const, item })) ?? []),
  ];

  const navigate = useCallback(
    (result: ResultItem) => {
      setOpen(false);
      switch (result.kind) {
        case 'member':
          router.push(`/admin/members/${result.item.id}`);
          break;
        case 'event':
          router.push(`/admin/events/${result.item.id}`);
          break;
        case 'team':
          router.push(`/admin/teams/${result.item.id}`);
          break;
        case 'conversation':
          router.push(`/admin/messages/${result.item.id}`);
          break;
      }
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      navigate(allItems[selectedIndex]!);
    }
  };

  const hasResults = allItems.length > 0;
  const showEmpty = debouncedQuery.length > 0 && !isFetching && !hasResults;

  if (!open) return null;

  let globalIndex = -1;

  function ResultRow({
    result,
    icon,
    title,
    subtitle,
  }: {
    result: ResultItem;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
  }) {
    globalIndex++;
    const idx = globalIndex;
    const isSelected = idx === selectedIndex;

    return (
      <button
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
        }`}
        onMouseEnter={() => setSelectedIndex(idx)}
        onClick={() => navigate(result)}
      >
        <span className={`shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          )}
        </span>
      </button>
    );
  }

  function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        {children}
      </div>
    );
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            {isFetching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hledat členy, události, týmy, konverzace..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {query.length > 0 && (
              <button
                onClick={() => setQuery('')}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden shrink-0 select-none rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {!debouncedQuery && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground/70">
                Začněte psát pro vyhledávání...
              </p>
            )}

            {showEmpty && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground/70">
                Žádné výsledky pro „{debouncedQuery}"
              </p>
            )}

            {hasResults && (
              <div className="space-y-3">
                {data!.members.length > 0 && (
                  <Section label="Členové">
                    {data!.members.map((m) => (
                      <ResultRow
                        key={m.id}
                        result={{ kind: 'member', item: m }}
                        icon={<Users className="h-4 w-4" />}
                        title={`${m.firstName} ${m.lastName}`}
                        subtitle={m.email}
                      />
                    ))}
                  </Section>
                )}

                {data!.events.length > 0 && (
                  <Section label="Události">
                    {data!.events.map((e) => (
                      <ResultRow
                        key={e.id}
                        result={{ kind: 'event', item: e }}
                        icon={<CalendarDays className="h-4 w-4" />}
                        title={e.title}
                        subtitle={formatEventDate(e.startsAt)}
                      />
                    ))}
                  </Section>
                )}

                {data!.teams.length > 0 && (
                  <Section label="Týmy">
                    {data!.teams.map((t) => (
                      <ResultRow
                        key={t.id}
                        result={{ kind: 'team', item: t }}
                        icon={<Shield className="h-4 w-4" />}
                        title={t.name}
                        subtitle={t.ageGroup ?? t.sport}
                      />
                    ))}
                  </Section>
                )}

                {data!.conversations.length > 0 && (
                  <Section label="Konverzace">
                    {data!.conversations.map((conv) => (
                      <ResultRow
                        key={conv.id}
                        result={{ kind: 'conversation', item: conv }}
                        icon={<MessageCircle className="h-4 w-4" />}
                        title={conv.title}
                      />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-3 border-t border-border/50 px-4 py-2">
            <span className="text-[11px] text-muted-foreground/50">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px]">↑↓</kbd>{' '}
              navigace
            </span>
            <span className="text-[11px] text-muted-foreground/50">
              <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px]">↵</kbd>{' '}
              otevřít
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
