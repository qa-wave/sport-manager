'use client';

/**
 * Varianta 3 — Swiss Minimal
 * Linear / Vercel / Stripe Dashboard styl.
 *
 * Klíčové principy:
 *  - Inter, váhy 400/500/600/700, tabular-nums pro čísla
 *  - #ffffff pozadí, #0a0a0a text, #609bc6 jediný accent
 *  - Hairline 1px borders, zero shadows, zero gradients, max border-radius 4px
 *  - 13px body, density first, -0.01em letter-spacing na headings
 *  - Keyboard shortcut hints vedle akcí
 *  - Data živě z /dashboard/feed přes existing auth
 */

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { apiFetch, ApiError, type DashboardFeed } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('cs-CZ', opts);
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
}
function fmtWeekday(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'short' }).replace('.', '');
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_ABBR: Record<string, string> = {
  PRACTICE: 'TR',
  MATCH: 'ZÁP',
  TOURNAMENT: 'TRN',
  MEETING: 'MTG',
  SOCIAL: 'SOC',
};

const TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Porada',
  SOCIAL: 'Akce',
};

/* ------------------------------------------------------------------ */
/* Tokens (inline, scoped)                                              */
/* ------------------------------------------------------------------ */

const T = {
  bg: '#ffffff',
  surface: '#fafafa',
  border: '#e4e4e7',
  borderHover: '#a1a1aa',
  text: '#0a0a0a',
  textSub: '#52525b',
  textMuted: '#a1a1aa',
  accent: '#609bc6',
  accentBg: 'rgba(96,155,198,0.08)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.07)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.08)',
  mono: '"JetBrains Mono", "Menlo", "Consolas", monospace',
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
} as const;

/* ------------------------------------------------------------------ */
/* Tiny kbd hint                                                         */
/* ------------------------------------------------------------------ */

function Kbd({ children }: { children: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 5px',
        fontSize: 10,
        fontFamily: T.mono,
        color: T.textMuted,
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 3,
        lineHeight: '16px',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tab bar                                                              */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: 'Dashboard', href: '/admin', key: '1' },
  { label: 'Members', href: '/admin/members', key: '2' },
  { label: 'Events', href: '/admin/events', key: '3' },
  { label: 'Messages', href: '/admin/messages', key: '4' },
];

function TopBar() {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'stretch',
        height: 40,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 0,
      }}
    >
      {/* Club slug */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingRight: 24,
          borderRight: `1px solid ${T.border}`,
          marginRight: 16,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            background: T.accent,
            borderRadius: 2,
            display: 'inline-grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: T.sans,
            flexShrink: 0,
          }}
        >
          B
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.sans, letterSpacing: '-0.01em' }}>
          ABC Braník
        </span>
      </div>

      {/* Nav tabs */}
      {TABS.map((tab) => {
        const active = tab.label === 'Dashboard';
        return (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              fontSize: 13,
              fontFamily: T.sans,
              fontWeight: active ? 600 : 400,
              color: active ? T.text : T.textSub,
              borderBottom: active ? `1.5px solid ${T.text}` : '1.5px solid transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'color 0.1s',
            }}
          >
            {tab.label}
            <Kbd>{tab.key}</Kbd>
          </Link>
        );
      })}

      {/* Spacer + search hint */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 24,
          borderLeft: `1px solid ${T.border}`,
        }}
      >
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.sans }}>Search</span>
        <Kbd>⌘K</Kbd>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                       */
/* ------------------------------------------------------------------ */

function SectionHead({ label, action }: { label: string; action?: { text: string; href: string; kbd?: string } }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
        marginBottom: 0,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: T.textMuted,
          fontFamily: T.sans,
        }}
      >
        {label}
      </span>
      {action && (
        <Link
          href={action.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: T.textSub,
            textDecoration: 'none',
            fontFamily: T.sans,
          }}
        >
          {action.text}
          {action.kbd && <Kbd>{action.kbd}</Kbd>}
          <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton row                                                          */
/* ------------------------------------------------------------------ */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 16,
        padding: '10px 0',
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            background: T.border,
            borderRadius: 2,
            animation: 'pulse 1.4s ease-in-out infinite',
            opacity: 1 - i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* This Week — table layout                                             */
/* ------------------------------------------------------------------ */

function ThisWeekTable({ events }: { events: DashboardFeed['thisWeek'] }) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <div
        style={{
          padding: '20px 0',
          fontSize: 13,
          color: T.textMuted,
          fontFamily: T.sans,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Žádné události tento týden.
        <Link href="/admin/events/new" style={{ color: T.accent, textDecoration: 'none', fontWeight: 500 }}>
          Naplánovat
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 36px 1fr 120px 72px 60px 20px',
          gap: 12,
          padding: '6px 8px',
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {['Datum', 'Typ', 'Tým / Název', 'Čas', 'RSVP', 'Místo', ''].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: T.textMuted,
              fontFamily: T.sans,
              letterSpacing: '0.03em',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {events.map((ev) => {
        const rsvp = ev.rsvpSummary;
        const hasAttention = rsvp.pending > rsvp.yes;
        return (
          <div
            key={ev.id}
            onClick={() => router.push(`/admin/events/${ev.id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 36px 1fr 120px 72px 60px 20px',
              gap: 12,
              padding: '9px 8px',
              borderBottom: `1px solid ${T.border}`,
              cursor: 'pointer',
              alignItems: 'center',
              transition: 'background 0.08s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f4f4f5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            {/* Datum */}
            <span
              style={{
                fontSize: 13,
                fontFamily: T.mono,
                color: T.textSub,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtDate(ev.startsAt)}&nbsp;{fmtWeekday(ev.startsAt).toUpperCase()}
            </span>

            {/* Typ badge */}
            <span
              style={{
                fontSize: 10,
                fontFamily: T.mono,
                fontWeight: 600,
                color: ev.type === 'MATCH' || ev.type === 'TOURNAMENT' ? T.amber : T.accent,
                letterSpacing: '0.03em',
              }}
            >
              {TYPE_ABBR[ev.type] ?? ev.type}
            </span>

            {/* Tým / Název */}
            <span style={{ fontSize: 13, fontFamily: T.sans, color: T.text, fontWeight: 500 }}>
              {ev.teamName ? (
                <>
                  <span style={{ color: T.textSub, fontWeight: 400 }}>{ev.teamName}</span>
                  {ev.title && ev.type !== 'PRACTICE' && (
                    <span style={{ color: T.textMuted }}> · {ev.title}</span>
                  )}
                </>
              ) : (
                ev.title
              )}
            </span>

            {/* Čas */}
            <span
              style={{
                fontSize: 13,
                fontFamily: T.mono,
                color: T.textSub,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtTime(ev.startsAt)}
            </span>

            {/* RSVP */}
            <span
              style={{
                fontSize: 12,
                fontFamily: T.mono,
                fontVariantNumeric: 'tabular-nums',
                color: hasAttention ? T.red : T.textSub,
                fontWeight: hasAttention ? 600 : 400,
              }}
            >
              {rsvp.yes}/{rsvp.yes + rsvp.maybe + rsvp.no + rsvp.pending}
            </span>

            {/* Místo */}
            <span
              style={{
                fontSize: 12,
                fontFamily: T.sans,
                color: T.textMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={ev.location ?? undefined}
            >
              {ev.location ?? '—'}
            </span>

            {/* Arrow */}
            <ChevronRight size={12} color={T.textMuted} />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Needs Attention                                                       */
/* ------------------------------------------------------------------ */

function NeedsAttentionList({
  items,
}: {
  items: DashboardFeed['needsAttention'];
}) {
  const router = useRouter();
  if (items.length === 0) return null;

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => router.push(item.link)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '9px 8px',
            borderBottom: `1px solid ${T.border}`,
            cursor: 'pointer',
            transition: 'background 0.08s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f4f4f5'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          {/* Red dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: item.severity === 'critical' ? T.red : T.amber,
              flexShrink: 0,
              marginTop: 5,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.text, fontFamily: T.sans }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.sans, marginTop: 1 }}>
              {item.description}
            </div>
          </div>
          <ChevronRight size={12} color={T.textMuted} style={{ flexShrink: 0, marginTop: 3 }} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent Activity — compact timeline                                   */
/* ------------------------------------------------------------------ */

function ActivityTimeline({
  items,
}: {
  items: DashboardFeed['recentActivity'];
}) {
  const router = useRouter();
  if (items.length === 0) return null;

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => item.link && router.push(item.link)}
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 32px',
            gap: 8,
            padding: '8px 8px 8px 0',
            borderBottom: `1px solid ${T.border}`,
            cursor: item.link ? 'pointer' : 'default',
            alignItems: 'start',
            transition: 'background 0.08s',
          }}
          onMouseEnter={(e) => {
            if (item.link) (e.currentTarget as HTMLDivElement).style.background = '#f4f4f5';
          }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        >
          {/* Timestamp */}
          <span
            style={{
              fontSize: 11,
              fontFamily: T.mono,
              color: T.textMuted,
              fontVariantNumeric: 'tabular-nums',
              paddingTop: 1,
            }}
          >
            {relTime(item.timestamp)}
          </span>

          {/* Message */}
          <span style={{ fontSize: 13, color: T.textSub, fontFamily: T.sans, lineHeight: '18px' }}>
            {item.message}
          </span>

          {/* Arrow */}
          {item.link && <ChevronRight size={12} color={T.textMuted} style={{ marginTop: 3 }} />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats strip                                                           */
/* ------------------------------------------------------------------ */

function StatsStrip({ stats }: { stats: DashboardFeed['stats'] }) {
  const items = [
    { label: 'Members', value: stats.members },
    { label: 'Teams', value: stats.teams },
    { label: 'Upcoming', value: stats.upcomingEvents },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        borderBottom: `1px solid ${T.border}`,
        marginBottom: 32,
      }}
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          style={{
            padding: '16px 24px 16px 0',
            marginRight: 24,
            borderRight: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: T.mono,
              color: T.text,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.sans, marginTop: 2 }}>
            {s.label}
          </div>
        </div>
      ))}

      {/* Spacer + CTA */}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          href="/admin/events/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: T.sans,
            color: T.text,
            textDecoration: 'none',
            background: T.bg,
            transition: 'border-color 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; }}
        >
          <Plus size={13} />
          New event
        </Link>
        <Kbd>N</Kbd>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function V3SwissPage() {
  const auth = useAuth();

  const { data: feed, isLoading } = useQuery<DashboardFeed, ApiError>({
    queryKey: ['dashboard-feed', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 30_000,
  });

  return (
    <>
      {/* Global pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: T.bg,
          color: T.text,
          fontFamily: T.sans,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <TopBar />

        {/* Back link */}
        <div
          style={{
            borderBottom: `1px solid ${T.border}`,
            padding: '6px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Link
            href="/admin/design-preview"
            style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none', fontFamily: T.sans }}
          >
            Design Preview
          </Link>
          <ChevronRight size={10} color={T.textMuted} />
          <span style={{ fontSize: 12, color: T.textSub, fontFamily: T.sans }}>
            Varianta 3 — Swiss Minimal
          </span>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 64px' }}>
          {/* Page title */}
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: 0,
                color: T.text,
                letterSpacing: '-0.01em',
                fontFamily: T.sans,
                lineHeight: 1.1,
              }}
            >
              Dashboard
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMuted, fontFamily: T.sans }}>
              ABC Braník · {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Stats strip */}
          {isLoading ? (
            <div style={{ display: 'flex', gap: 32, marginBottom: 32, borderBottom: `1px solid ${T.border}`, paddingBottom: 24 }}>
              {[80, 60, 72].map((w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: w, height: 24, background: T.border, borderRadius: 2 }} />
                  <div style={{ width: 48, height: 12, background: T.border, borderRadius: 2 }} />
                </div>
              ))}
            </div>
          ) : feed ? (
            <StatsStrip stats={feed.stats} />
          ) : null}

          {/* Body: two columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 280px',
              gap: 48,
              alignItems: 'start',
            }}
          >
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* This Week */}
              <section>
                <SectionHead
                  label="This Week"
                  action={{ text: 'All events', href: '/admin/events', kbd: 'E' }}
                />
                {isLoading ? (
                  <div style={{ paddingTop: 4 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonRow key={i} cols={5} />
                    ))}
                  </div>
                ) : feed ? (
                  <ThisWeekTable events={feed.thisWeek} />
                ) : null}
              </section>

              {/* Needs Attention */}
              {(feed?.needsAttention.length ?? 0) > 0 && (
                <section>
                  <SectionHead label="Needs Attention" />
                  <NeedsAttentionList items={feed!.needsAttention} />
                </section>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {/* Recent Activity */}
              <section>
                <SectionHead label="Recent Activity" />
                {isLoading ? (
                  <div style={{ paddingTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} cols={2} />
                    ))}
                  </div>
                ) : feed ? (
                  <ActivityTimeline items={feed.recentActivity} />
                ) : null}
              </section>

              {/* Quick actions */}
              <section>
                <SectionHead label="Quick Actions" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { label: 'Schedule Event', href: '/admin/events/new', kbd: 'N' },
                    { label: 'Members', href: '/admin/members', kbd: 'M' },
                    { label: 'Teams', href: '/admin/teams', kbd: 'T' },
                    { label: 'Messages', href: '/admin/messages', kbd: 'G' },
                  ].map((qa) => (
                    <Link
                      key={qa.label}
                      href={qa.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 8px',
                        borderBottom: `1px solid ${T.border}`,
                        textDecoration: 'none',
                        transition: 'background 0.08s',
                        borderRadius: 0,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#f4f4f5'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 13, color: T.text, fontFamily: T.sans, fontWeight: 400 }}>
                        {qa.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Kbd>{qa.kbd}</Kbd>
                        <ChevronRight size={12} color={T.textMuted} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Legend */}
              <section>
                <SectionHead label="Event types" />
                <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: T.mono,
                          fontWeight: 600,
                          color: key === 'MATCH' || key === 'TOURNAMENT' ? T.amber : T.accent,
                          width: 28,
                        }}
                      >
                        {TYPE_ABBR[key]}
                      </span>
                      <span style={{ fontSize: 12, color: T.textSub, fontFamily: T.sans }}>{label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
