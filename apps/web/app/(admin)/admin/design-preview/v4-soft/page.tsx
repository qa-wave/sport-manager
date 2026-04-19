'use client';

/**
 * Varianta 4 — Soft Play
 * Notion / Clay / Figma Community vibe.
 * Pastel soft-blue background, rounded 24px cards, squircle avatary,
 * emoji v headlinech, asymetrická mozaika hero + quick actions.
 *
 * Scoped inline styles — žádný leak z globálního tématu.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Instrument_Sans, Instrument_Serif } from 'next/font/google';
import { apiFetch, ApiError, type DashboardFeed, type EventSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach } from '@/lib/member-context';

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--v4-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--v4-serif',
  weight: '400',
  display: 'swap',
});

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const T = {
  // Background
  pageBg: '#eef4fa',
  // Surfaces
  surface: '#ffffff',
  surfaceTinted: '#f5f9fd',
  // Brand
  primary: '#609bc6',
  primaryLight: '#b8d8ee',
  primaryDark: '#4a7ea8',
  // Pastels category accent
  orange: '#ffd9c2',
  orangeText: '#b85c1a',
  mint: '#c7ead8',
  mintText: '#1a7a4a',
  lavender: '#d9d7f0',
  lavenderText: '#4a3a8a',
  sky: '#c2e0ff',
  skyText: '#1a5a9a',
  // Text
  textPrimary: '#1a2332',
  textSecondary: '#5a7080',
  textTertiary: '#9aacba',
  // Misc
  border: 'rgba(96,155,198,0.12)',
  shadowSoft: '0 4px 20px rgba(96,155,198,0.08)',
  shadowLift: '0 8px 32px rgba(96,155,198,0.14)',
  // Radius
  r8: 8,
  r12: 12,
  r16: 16,
  r20: 20,
  r24: 24,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function dayNum(d: string) {
  return new Date(d).getDate().toString().padStart(2, '0');
}
function weekdayShort(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short' }).toUpperCase();
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}
function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hod`;
  return `${Math.floor(h / 24)} dní`;
}

/** Squircle avatar background — deterministický pastel z jmen */
function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const hue = ((h & 0xff) / 255) * 360;
  const hue2 = (hue + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue},65%,72%), hsl(${hue2},60%,80%))`;
}

/** Inicály z celého jména */
function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/* Event type → emoji + label + pastel */
const EVENT_META: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  PRACTICE: { emoji: '🏃', label: 'Trénink', bg: T.mint, text: T.mintText },
  MATCH: { emoji: '⚽', label: 'Zápas', bg: T.orange, text: T.orangeText },
  TOURNAMENT: { emoji: '🏆', label: 'Turnaj', bg: T.lavender, text: T.lavenderText },
  MEETING: { emoji: '💬', label: 'Schůzka', bg: T.sky, text: T.skyText },
  SOCIAL: { emoji: '🎉', label: 'Akce', bg: '#ffe4f0', text: '#8a1a4a' },
};
const DEFAULT_META = { emoji: '📅', label: 'Událost', bg: T.sky, text: T.skyText };

/* ------------------------------------------------------------------ */
/* Root page                                                           */
/* ------------------------------------------------------------------ */

export default function V4SoftPage() {
  const auth = useAuth();
  const router = useRouter();
  const { data: memberCtx } = useMemberContext();

  const { data: feed, isLoading } = useQuery<DashboardFeed, ApiError>({
    queryKey: ['dashboard-feed', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 30_000,
  });

  const admin = memberCtx ? isAdmin(memberCtx) : true;
  const coach = memberCtx ? isCoach(memberCtx) : false;

  const fontVars = `${instrumentSans.variable} ${instrumentSerif.variable}`;

  return (
    <div
      className={fontVars}
      style={{
        minHeight: '100vh',
        background: T.pageBg,
        fontFamily: 'var(--v4-sans), ui-sans-serif, system-ui',
        color: T.textPrimary,
        padding: '0 0 80px 0',
      }}
    >
      {/* ── Top bar ── */}
      <SoftTopBar />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0' }}>
        {/* ── Back link ── */}
        <Link
          href="/admin/design-preview"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: T.primary,
            marginBottom: 28,
            textDecoration: 'none',
            opacity: 0.85,
          }}
        >
          ← Zpět na Design Preview
        </Link>

        {/* ── Hero mosaic ── */}
        <HeroMosaic feed={feed} isLoading={isLoading} admin={admin} coach={coach} />

        {/* ── This Week ── */}
        <section style={{ marginTop: 40 }}>
          <SectionHeading emoji="📅" title="This Week" href="/admin/events" />
          {isLoading ? (
            <SkeletonCards />
          ) : !feed || feed.thisWeek.length === 0 ? (
            <EmptyWeek admin={admin || coach} />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {feed.thisWeek.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onClick={() => router.push(`/admin/events/${ev.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Needs Attention ── */}
        {(admin || coach) && feed && feed.needsAttention.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <SectionHeading emoji="⚠️" title="Vyžaduje pozornost" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feed.needsAttention.map((item, i) => (
                <AttentionBanner
                  key={i}
                  item={item}
                  onClick={() => router.push(item.link)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Recent Activity ── */}
        {feed && feed.recentActivity.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <SectionHeading emoji="💬" title="Nedávná aktivita" />
            <ActivityFeed items={feed.recentActivity} onNavigate={(l) => l && router.push(l)} />
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top Bar                                                             */
/* ------------------------------------------------------------------ */

function SoftTopBar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(238,244,250,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 4px 12px rgba(96,155,198,0.35)`,
            }}
          >
            B
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, lineHeight: 1 }}>
              ABC Braník
            </div>
            <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 1 }}>Soft Play</div>
          </div>
        </div>

        {/* Nav pills */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {(['Dashboard', 'Events', 'Members', 'Messages'] as const).map((label, i) => (
            <Link
              key={label}
              href={i === 0 ? '/admin/design-preview/v4-soft' : '#'}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? T.primary : T.textSecondary,
                background: i === 0 ? `rgba(96,155,198,0.1)` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: avatarGradient('Jan Novák'),
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          JN
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero Mosaic: big card left + 2×2 quick-action grid right           */
/* ------------------------------------------------------------------ */

function HeroMosaic({
  feed,
  isLoading,
  admin,
  coach,
}: {
  feed?: DashboardFeed;
  isLoading: boolean;
  admin: boolean;
  coach: boolean;
}) {
  const stats = feed?.stats;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {/* Hero card */}
      <div
        style={{
          borderRadius: T.r24,
          background: `linear-gradient(135deg, ${T.primary} 0%, #4a7ea8 60%, #2d5a78 100%)`,
          padding: '36px 32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: T.shadowLift,
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Decorative blobs */}
        <span
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: -20,
            left: '35%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />

        {/* Tag */}
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              marginBottom: 14,
            }}
          >
            ⚽ Sportovní klub
          </span>

          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              letterSpacing: -0.5,
              fontFamily: 'var(--v4-serif), Georgia, serif',
            }}
          >
            Vítej zpět!
          </div>
          <div style={{ marginTop: 6, fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
            ABC Braník — sezona 2025/26
          </div>
        </div>

        {/* Stats row */}
        {!isLoading && stats && (
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 28,
              padding: '16px 20px',
              borderRadius: T.r16,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <HeroStat value={stats.members} label="Členů" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <HeroStat value={stats.teams} label="Týmů" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <HeroStat value={stats.upcomingEvents} label="Akcí" />
          </div>
        )}
      </div>

      {/* Quick-action 2×2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <QuickCard
          emoji="📆"
          title="Naplánovat akci"
          desc="Trénink, zápas nebo schůzku"
          href={(admin || coach) ? '/admin/events/new' : '/admin/events'}
          accent={T.mint}
          accentText={T.mintText}
        />
        <QuickCard
          emoji="👥"
          title="Členové"
          desc="Přehled hráčů a rodičů"
          href="/admin/members"
          accent={T.sky}
          accentText={T.skyText}
        />
        <QuickCard
          emoji="💬"
          title="Zprávy"
          desc="Konverzace s klubem"
          href="/admin/messages"
          accent={T.lavender}
          accentText={T.lavenderText}
        />
        <QuickCard
          emoji="💳"
          title="Platby"
          desc="Přehled a statistiky"
          href="/admin/payments"
          accent={T.orange}
          accentText={T.orangeText}
        />
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function QuickCard({
  emoji,
  title,
  desc,
  href,
  accent,
  accentText,
}: {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  accent: string;
  accentText: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '20px 18px',
        borderRadius: T.r20,
        background: T.surface,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSoft,
        textDecoration: 'none',
        color: T.textPrimary,
        transition: 'transform 0.15s, box-shadow 0.15s',
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = T.shadowLift;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = T.shadowSoft;
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accent,
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
        }}
      >
        {emoji}
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{title}</div>
        <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Section Heading                                                     */
/* ------------------------------------------------------------------ */

function SectionHeading({
  emoji,
  title,
  href,
}: {
  emoji: string;
  title: string;
  href?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 700,
          color: T.textPrimary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          letterSpacing: -0.3,
        }}
      >
        {emoji} {title}
      </h2>
      {href && (
        <Link
          href={href}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.primary,
            textDecoration: 'none',
            padding: '4px 12px',
            borderRadius: 999,
            background: `rgba(96,155,198,0.08)`,
          }}
        >
          Zobrazit vše →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Event Card                                                          */
/* ------------------------------------------------------------------ */

function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
  const meta = EVENT_META[event.type] ?? DEFAULT_META;
  const rsvp = event.rsvpSummary;
  const going = rsvp.yes;
  const total = rsvp.yes + rsvp.maybe + rsvp.no + rsvp.pending;
  const title = event.type === 'MATCH' || event.type === 'TOURNAMENT' ? event.title : meta.label;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = T.shadowLift;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = T.shadowSoft;
      }}
      style={{
        background: T.surface,
        borderRadius: T.r20,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSoft,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      } as React.CSSProperties}
    >
      {/* Coloured top strip */}
      <div style={{ height: 6, background: meta.bg }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Type pill */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 999,
            background: meta.bg,
            color: meta.text,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {meta.emoji} {meta.label}
        </span>

        {/* Title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: T.textPrimary,
            marginBottom: 4,
            letterSpacing: -0.2,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {/* Team */}
        {event.teamName && (
          <div style={{ fontSize: 12, color: T.primary, fontWeight: 500, marginBottom: 8 }}>
            {event.teamName}
          </div>
        )}

        {/* Date + time row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 10,
            padding: '10px 0 0',
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 40,
              padding: '6px 8px',
              borderRadius: 10,
              background: T.pageBg,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, lineHeight: 1 }}>
              {dayNum(event.startsAt)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: T.textTertiary, marginTop: 2, letterSpacing: 0.5 }}>
              {weekdayShort(event.startsAt)}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary }}>
              {formatTime(event.startsAt)}
            </div>
            {event.location && (
              <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>
                📍 {event.location}
              </div>
            )}
          </div>

          {/* RSVP badge */}
          {total > 0 && (
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: rsvp.pending > 0 && rsvp.pending >= rsvp.yes
                  ? T.orange
                  : T.mint,
                color: rsvp.pending > 0 && rsvp.pending >= rsvp.yes
                  ? T.orangeText
                  : T.mintText,
              }}
            >
              {rsvp.pending > 0 && rsvp.pending >= rsvp.yes ? 'Čeká na RSVP' : `✓ ${going}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attention Banner                                                    */
/* ------------------------------------------------------------------ */

function AttentionBanner({
  item,
  onClick,
}: {
  item: { title: string; description: string; severity: 'warning' | 'critical' };
  onClick: () => void;
}) {
  const isCritical = item.severity === 'critical';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderRadius: T.r16,
        background: isCritical ? '#fff2f2' : '#fffbf0',
        border: `1px solid ${isCritical ? 'rgba(200,60,60,0.15)' : 'rgba(200,150,0,0.15)'}`,
        boxShadow: T.shadowSoft,
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = '')}
    >
      <span
        style={{
          fontSize: 20,
          width: 36,
          height: 36,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 10,
          background: isCritical ? 'rgba(200,60,60,0.1)' : 'rgba(200,150,0,0.1)',
          flexShrink: 0,
        }}
      >
        {isCritical ? '🚨' : '⚠️'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isCritical ? '#8a1a1a' : '#7a5a00' }}>
          {item.title}
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{item.description}</div>
      </div>
      <span style={{ fontSize: 16, color: T.textTertiary }}>→</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity Feed — chat-like with squircle avatars                    */
/* ------------------------------------------------------------------ */

function ActivityFeed({
  items,
  onNavigate,
}: {
  items: Array<{ type: string; message: string; timestamp: string; link?: string }>;
  onNavigate: (link?: string) => void;
}) {
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: T.r20,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSoft,
        overflow: 'hidden',
      }}
    >
      {items.map((item, i) => {
        const seed = item.message.slice(0, 8);
        const init = initials(item.message.split(' ').slice(0, 2).join(' '));
        return (
          <div
            key={i}
            role={item.link ? 'button' : undefined}
            tabIndex={item.link ? 0 : undefined}
            onClick={() => item.link && onNavigate(item.link)}
            onKeyDown={(e) => e.key === 'Enter' && item.link && onNavigate(item.link)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
              cursor: item.link ? 'pointer' : 'default',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (item.link)
                (e.currentTarget as HTMLElement).style.background = T.surfaceTinted;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '';
            }}
          >
            {/* Squircle avatar */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: avatarGradient(seed),
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {init || '?'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: T.textPrimary,
                  lineHeight: 1.45,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.message}
              </p>
            </div>

            <span
              style={{
                fontSize: 11,
                color: T.textTertiary,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {relTime(item.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / Skeleton states                                            */
/* ------------------------------------------------------------------ */

function EmptyWeek({ admin }: { admin: boolean }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        background: T.surface,
        borderRadius: T.r20,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSoft,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏖️</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary }}>Tento týden nic</div>
      <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>
        Žádné naplánované události tento týden.
      </div>
      {admin && (
        <Link
          href="/admin/events/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 999,
            background: T.primary,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: `0 4px 12px rgba(96,155,198,0.35)`,
          }}
        >
          + Naplánovat akci
        </Link>
      )}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 160,
            borderRadius: T.r20,
            background: `linear-gradient(90deg, #e8f1f8 25%, #f0f7fc 50%, #e8f1f8 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
    </div>
  );
}

