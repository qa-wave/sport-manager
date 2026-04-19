'use client';

/**
 * Varianta 5 — "Braník Heritage"
 * Vintage sports poster / club crest aesthetic, FIFA 1914 feel.
 * ABC Braník 1914–2026 · 110 let tradice.
 *
 * Data: /dashboard/feed (real API)
 * Fonty: next/font/google — Playfair Display + Libre Franklin + Oswald
 * Styly: 100 % inline, žádný leak globálního tématu
 */

import { useQuery } from '@tanstack/react-query';
import { Playfair_Display, Libre_Franklin, Oswald } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, type DashboardFeed } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const franklin = Libre_Franklin({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-franklin',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const C = {
  navy: '#0d1b3a',
  navyLight: '#162240',
  branik: '#609bc6',
  gold: '#d4a64a',
  goldLight: '#e8c070',
  goldDim: '#a07a2a',
  cream: '#f4eee1',
  creamDark: '#ede5d2',
  creamDeep: '#e0d6be',
  charcoal: '#2a2420',
  charcoalMid: '#4a3e36',
  charcoalLight: '#6b5d52',
  ink: '#1c1510',
  inkLight: '#3d3028',
  border: '#c8b898',
  borderLight: '#ddd0b8',
  rule: '#b8a888',
} as const;

const F = {
  serif: 'var(--font-playfair), Georgia, "Times New Roman", serif',
  sans: 'var(--font-franklin), "Helvetica Neue", Arial, sans-serif',
  condensed: 'var(--font-oswald), "Arial Narrow", Arial, sans-serif',
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short' }).toUpperCase();
}
function fmtDate(d: string) {
  return new Date(d).getDate().toString().padStart(2, '0');
}
function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('cs-CZ', { month: 'short' }).toUpperCase();
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}
function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hod`;
  return `${Math.floor(hours / 24)} dní`;
}

const EVENT_TYPE_CZ: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

const EVENT_ROMAN: Record<string, string> = {
  PRACTICE: 'TRG',
  MATCH: 'ZÁP',
  TOURNAMENT: 'TRN',
  MEETING: 'SCH',
  SOCIAL: 'AKC',
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HeritagePage() {
  const auth = useAuth();
  const router = useRouter();

  const { data: feed, isLoading } = useQuery<DashboardFeed>({
    queryKey: ['dashboard-feed', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 60_000,
  });

  const fontVars = [playfair.variable, franklin.variable, oswald.variable].join(' ');

  return (
    <div
      className={fontVars}
      style={{
        minHeight: '100vh',
        background: C.cream,
        color: C.charcoal,
        fontFamily: F.sans,
        // Subtle noise texture via repeating gradient
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")
        `,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── MASTHEAD ─────────────────────────────────────────────── */}
        <header style={{ paddingTop: 40, paddingBottom: 0 }}>
          {/* Back link */}
          <div style={{ marginBottom: 20 }}>
            <Link
              href="/admin/design-preview"
              style={{
                fontFamily: F.condensed,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: C.charcoalLight,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Design Preview
            </Link>
          </div>

          {/* Top rule */}
          <div style={{ borderTop: `3px solid ${C.navy}`, borderBottom: `1px solid ${C.navy}`, padding: '4px 0 3px', marginBottom: 0 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: F.condensed, fontSize: 10, letterSpacing: 3, color: C.navy, textTransform: 'uppercase', fontWeight: 500 }}>
                Est. 1914 · Praha — Braník
              </span>
              <span style={{ fontFamily: F.condensed, fontSize: 10, letterSpacing: 2, color: C.navy, textTransform: 'uppercase', fontWeight: 500 }}>
                110 let tradice · 2026
              </span>
            </div>
          </div>

          {/* Main masthead row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 100px',
            alignItems: 'center',
            gap: 16,
            padding: '20px 0 16px',
            borderBottom: `1px solid ${C.navy}`,
          }}>
            {/* Crest placeholder */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ShieldCrest />
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: F.serif,
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -1,
                color: C.navy,
                textTransform: 'uppercase',
              }}>
                The Braník
              </div>
              <div style={{
                fontFamily: F.serif,
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -1,
                color: C.navy,
                textTransform: 'uppercase',
              }}>
                Dispatch
              </div>
              <div style={{
                marginTop: 8,
                fontFamily: F.condensed,
                fontSize: 11,
                letterSpacing: 4,
                color: C.charcoalLight,
                textTransform: 'uppercase',
                fontWeight: 400,
              }}>
                Official Club Bulletin
              </div>
            </div>

            {/* Date block */}
            <div style={{ textAlign: 'center', fontFamily: F.sans }}>
              <div style={{
                fontSize: 9,
                letterSpacing: 2,
                color: C.charcoalLight,
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 4,
              }}>
                Dnešní vydání
              </div>
              <div style={{
                fontFamily: F.serif,
                fontSize: 22,
                fontWeight: 700,
                color: C.navy,
                lineHeight: 1,
              }}>
                {new Date().getDate()}
              </div>
              <div style={{
                fontFamily: F.condensed,
                fontSize: 12,
                letterSpacing: 2,
                color: C.charcoalLight,
                textTransform: 'uppercase',
              }}>
                {new Date().toLocaleDateString('cs-CZ', { month: 'long' })}
              </div>
              <div style={{
                fontFamily: F.sans,
                fontSize: 10,
                color: C.charcoalLight,
                marginTop: 2,
              }}>
                {new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Gold ribbon below masthead */}
          <div style={{
            background: C.navy,
            padding: '5px 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ color: C.gold, fontFamily: F.condensed, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>ABC Braník</span>
            <Ornament color={C.gold} />
            <span style={{ color: C.gold, fontFamily: F.condensed, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
              {isLoading ? '—' : `${feed?.stats.members ?? 0} členů · ${feed?.stats.teams ?? 0} týmů · ${feed?.stats.upcomingEvents ?? 0} akce`}
            </span>
            <Ornament color={C.gold} />
            <span style={{ color: C.gold, fontFamily: F.condensed, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Praha Braník</span>
          </div>
        </header>

        {/* ── BODY ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : feed ? (
          <main style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '0 40px', marginTop: 0 }}>

            {/* ── LEFT COLUMN ───────────────────────────────────── */}
            <div>
              {/* Section: This Week */}
              <SectionBanner title="This Week in Braník" ornament />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {feed.thisWeek.length === 0 ? (
                  <EmptyState message="Tento týden žádné akce." />
                ) : (
                  feed.thisWeek.map((event, idx) => (
                    <MatchCard
                      key={event.id}
                      index={idx + 1}
                      event={event}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    />
                  ))
                )}
              </div>

              {/* Recent Activity */}
              {feed.recentActivity.length > 0 && (
                <>
                  <SectionBanner title="The Wire" ornament />
                  <div style={{ borderLeft: `2px solid ${C.border}`, marginLeft: 0 }}>
                    {feed.recentActivity.slice(0, 6).map((item, i) => (
                      <div
                        key={i}
                        onClick={() => item.link && router.push(item.link)}
                        style={{
                          display: 'flex',
                          gap: 16,
                          padding: '10px 16px',
                          borderBottom: `1px solid ${C.borderLight}`,
                          cursor: item.link ? 'pointer' : 'default',
                        }}
                      >
                        <span style={{
                          fontFamily: F.serif,
                          fontSize: 20,
                          fontWeight: 900,
                          color: C.gold,
                          lineHeight: 1,
                          minWidth: 28,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0,
                            fontFamily: F.sans,
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: C.charcoal,
                          }}>
                            {item.message}
                          </p>
                          <span style={{
                            fontFamily: F.condensed,
                            fontSize: 10,
                            letterSpacing: 1.5,
                            color: C.charcoalLight,
                            textTransform: 'uppercase',
                            display: 'block',
                            marginTop: 3,
                          }}>
                            — {relativeTime(item.timestamp)} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── RIGHT COLUMN ──────────────────────────────────── */}
            <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 24 }}>

              {/* Needs Attention */}
              {feed.needsAttention.length > 0 && (
                <>
                  <SectionBanner title="Briefing Desk" compact />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {feed.needsAttention.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => router.push(item.link)}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '12px 0',
                          borderBottom: `1px solid ${C.borderLight}`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          fontFamily: F.serif,
                          fontSize: 22,
                          fontWeight: 900,
                          color: item.severity === 'critical' ? '#a83232' : C.gold,
                          lineHeight: 1,
                          minWidth: 28,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: F.sans,
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.navy,
                            lineHeight: 1.4,
                          }}>
                            {item.title}
                          </div>
                          <div style={{
                            fontFamily: F.sans,
                            fontSize: 11,
                            color: C.charcoalLight,
                            marginTop: 3,
                            lineHeight: 1.4,
                          }}>
                            {item.description}
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 5,
                            fontFamily: F.condensed,
                            fontSize: 10,
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                            color: C.branik,
                          }}>
                            Zobrazit →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* At Your Service — Quick actions */}
              <div style={{ marginTop: 24 }}>
                <SectionBanner title="At Your Service" compact />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Naplánovat akci', href: '/admin/events/new', roman: 'I' },
                    { label: 'Přehled členů', href: '/admin/members', roman: 'II' },
                    { label: 'Týmy a kádry', href: '/admin/teams', roman: 'III' },
                    { label: 'Zprávy', href: '/admin/messages', roman: 'IV' },
                    { label: 'Všechny akce', href: '/admin/events', roman: 'V' },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: `1px solid ${C.borderLight}`,
                      }}>
                        <span style={{
                          fontFamily: F.serif,
                          fontSize: 13,
                          fontStyle: 'italic',
                          color: C.gold,
                          minWidth: 22,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}>
                          {action.roman}
                        </span>
                        <span style={{
                          fontFamily: F.sans,
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.navy,
                          letterSpacing: 0.2,
                          flex: 1,
                        }}>
                          {action.label}
                        </span>
                        <span style={{ color: C.charcoalLight, fontSize: 12 }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Heritage badge */}
              <div style={{ marginTop: 32 }}>
                <HeritageBadge />
              </div>

              {/* Quote */}
              <div style={{
                marginTop: 28,
                padding: '16px 0',
                borderTop: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <p style={{
                  margin: 0,
                  fontFamily: F.serif,
                  fontSize: 14,
                  fontStyle: 'italic',
                  lineHeight: 1.65,
                  color: C.charcoalMid,
                }}>
                  "Fotbal není jen sport. Je to dědictví, které předáváme dalším generacím."
                </p>
                <p style={{
                  margin: '10px 0 0',
                  fontFamily: F.condensed,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: C.charcoalLight,
                }}>
                  — ABC Braník, Est. 1914
                </p>
              </div>
            </div>
          </main>
        ) : null}

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer style={{
          marginTop: 48,
          paddingTop: 12,
          borderTop: `3px double ${C.navy}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span style={{ fontFamily: F.condensed, fontSize: 10, letterSpacing: 2, color: C.charcoalLight, textTransform: 'uppercase' }}>
            ABC Braník · Praha · Est. 1914
          </span>
          <Ornament color={C.rule} />
          <span style={{ fontFamily: F.condensed, fontSize: 10, letterSpacing: 2, color: C.charcoalLight, textTransform: 'uppercase' }}>
            Varianta 5 — Heritage · club-app
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Match card — numbered, vintage fixture style                        */
/* ------------------------------------------------------------------ */

function MatchCard({
  index,
  event,
  onClick,
}: {
  index: number;
  event: DashboardFeed['thisWeek'][number];
  onClick: () => void;
}) {
  const isMatch = event.type === 'MATCH' || event.type === 'TOURNAMENT';
  const rsvp = event.rsvpSummary;
  const going = rsvp.yes;
  const total = rsvp.yes + rsvp.maybe + rsvp.no + rsvp.pending;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1px 1fr auto',
        gap: '0 16px',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: `1px solid ${C.borderLight}`,
        cursor: 'pointer',
      }}
    >
      {/* Big serif number */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: F.serif,
          fontSize: 36,
          fontWeight: 900,
          lineHeight: 1,
          color: isMatch ? C.navy : C.gold,
          letterSpacing: -1,
        }}>
          {String(index).padStart(2, '0')}
        </div>
        <div style={{
          fontFamily: F.condensed,
          fontSize: 9,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: C.charcoalLight,
          marginTop: 2,
        }}>
          {EVENT_ROMAN[event.type] ?? event.type}
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, background: C.border, alignSelf: 'stretch' }} />

      {/* Content */}
      <div>
        {/* Date row */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: F.condensed,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.charcoalLight,
            fontWeight: 500,
          }}>
            {fmtDay(event.startsAt)} {fmtDate(event.startsAt)} {fmtMonth(event.startsAt)} · {fmtTime(event.startsAt)}
          </span>
          {isMatch && event.homeAway && (
            <span style={{
              fontFamily: F.condensed,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: event.homeAway === 'HOME' ? C.branik : C.charcoalLight,
              fontWeight: 600,
              border: `1px solid ${event.homeAway === 'HOME' ? C.branik : C.border}`,
              padding: '1px 6px',
            }}>
              {event.homeAway === 'HOME' ? 'Doma' : event.homeAway === 'AWAY' ? 'Venku' : 'Neutral'}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: F.serif,
          fontSize: isMatch ? 18 : 16,
          fontWeight: isMatch ? 700 : 400,
          color: C.navy,
          lineHeight: 1.2,
        }}>
          {isMatch ? (
            <>
              <span style={{ fontWeight: 900 }}>ABC Braník</span>
              {event.opponent ? (
                <>
                  {' '}
                  <span style={{ fontStyle: 'italic', color: C.charcoalMid, fontWeight: 400 }}>vs</span>
                  {' '}
                  <span style={{ fontWeight: 700 }}>{event.opponent}</span>
                </>
              ) : null}
            </>
          ) : (
            <>{EVENT_TYPE_CZ[event.type] ?? event.type}{event.teamName ? ` — ${event.teamName}` : ''}</>
          )}
        </div>

        {/* Location + rsvp */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 5,
        }}>
          {event.location && (
            <span style={{
              fontFamily: F.sans,
              fontSize: 11,
              color: C.charcoalLight,
            }}>
              ◆ {event.location}
            </span>
          )}
          {event.teamName && !isMatch && (
            <span style={{
              fontFamily: F.condensed,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: C.branik,
            }}>
              {event.teamName}
            </span>
          )}
        </div>
      </div>

      {/* RSVP badge */}
      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
        {total === 0 ? null : rsvp.pending > 0 && rsvp.pending >= rsvp.yes ? (
          <VintageBadge label="RSVP?" color="#a83232" />
        ) : (
          <VintageBadge label={`${going}`} sublabel="jde" color={C.navy} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section banner                                                      */
/* ------------------------------------------------------------------ */

function SectionBanner({ title, ornament, compact }: { title: string; ornament?: boolean; compact?: boolean }) {
  return (
    <div style={{
      margin: compact ? '24px 0 12px' : '32px 0 0',
      paddingBottom: compact ? 0 : 4,
    }}>
      <div style={{
        borderTop: `1px solid ${C.rule}`,
        borderBottom: `1px solid ${C.rule}`,
        padding: compact ? '4px 0' : '6px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: C.navy,
      }}>
        {ornament && <Ornament color={C.gold} />}
        <span style={{
          fontFamily: F.condensed,
          fontSize: compact ? 11 : 13,
          letterSpacing: compact ? 3 : 4,
          textTransform: 'uppercase',
          color: C.cream,
          fontWeight: 500,
        }}>
          {title}
        </span>
        {ornament && <Ornament color={C.gold} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shield crest                                                        */
/* ------------------------------------------------------------------ */

function ShieldCrest() {
  return (
    <svg
      width="72"
      height="84"
      viewBox="0 0 72 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ABC Braník club crest"
    >
      {/* Shield outline */}
      <path
        d="M36 2L2 16V44C2 62 18 76 36 82C54 76 70 62 70 44V16L36 2Z"
        fill={C.navy}
        stroke={C.gold}
        strokeWidth="2"
      />
      {/* Inner border */}
      <path
        d="M36 8L8 20V44C8 59 21 71 36 76C51 71 64 59 64 44V20L36 8Z"
        fill="none"
        stroke={C.gold}
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Horizontal rule */}
      <line x1="12" y1="38" x2="60" y2="38" stroke={C.gold} strokeWidth="0.75" opacity="0.6" />
      {/* ABC text */}
      <text
        x="36"
        y="30"
        textAnchor="middle"
        fill={C.gold}
        fontSize="9"
        fontFamily="Georgia, serif"
        fontWeight="700"
        letterSpacing="2"
      >
        ABC
      </text>
      {/* Year */}
      <text
        x="36"
        y="52"
        textAnchor="middle"
        fill={C.cream}
        fontSize="11"
        fontFamily="Georgia, serif"
        fontWeight="700"
        letterSpacing="1"
      >
        1914
      </text>
      {/* Bottom label */}
      <text
        x="36"
        y="64"
        textAnchor="middle"
        fill={C.gold}
        fontSize="6.5"
        fontFamily="Arial Narrow, Arial, sans-serif"
        fontWeight="400"
        letterSpacing="2"
      >
        BRANÍK
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Ornament divider                                                    */
/* ------------------------------------------------------------------ */

function Ornament({ color }: { color: string }) {
  return (
    <span style={{ fontFamily: 'Georgia, serif', fontSize: 10, color, letterSpacing: 2, userSelect: 'none' }}>
      •───•───•
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Vintage circular badge                                              */
/* ------------------------------------------------------------------ */

function VintageBadge({ label, sublabel, color }: { label: string; sublabel?: string; color: string }) {
  return (
    <div style={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: F.serif,
        fontSize: label.length > 3 ? 11 : 16,
        fontWeight: 700,
        color,
        lineHeight: 1,
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          fontFamily: F.condensed,
          fontSize: 8,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color,
          opacity: 0.8,
          marginTop: 1,
        }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heritage commemorative badge (sidebar)                             */
/* ------------------------------------------------------------------ */

function HeritageBadge() {
  return (
    <div style={{
      border: `1px solid ${C.gold}`,
      padding: '16px 12px',
      textAlign: 'center',
      background: C.navy,
    }}>
      <div style={{
        fontFamily: F.condensed,
        fontSize: 9,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: C.gold,
        opacity: 0.8,
      }}>
        Commemorating
      </div>
      <div style={{
        fontFamily: F.serif,
        fontSize: 28,
        fontWeight: 900,
        color: C.gold,
        lineHeight: 1,
        marginTop: 4,
        letterSpacing: -0.5,
      }}>
        110
      </div>
      <div style={{
        fontFamily: F.serif,
        fontSize: 11,
        fontStyle: 'italic',
        color: C.cream,
        marginTop: 2,
      }}>
        let tradice
      </div>
      <div style={{
        margin: '10px auto 0',
        width: '80%',
        height: 1,
        background: `linear-gradient(to right, transparent, ${C.gold}, transparent)`,
      }} />
      <div style={{
        fontFamily: F.condensed,
        fontSize: 10,
        letterSpacing: 2,
        color: C.goldLight,
        marginTop: 8,
        textTransform: 'uppercase',
      }}>
        1914 — 2026
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                    */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div style={{ marginTop: 32 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 16,
          padding: '20px 0',
          borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{ width: 56, height: 40, background: C.creamDeep, borderRadius: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '30%', height: 10, background: C.creamDeep, borderRadius: 2, marginBottom: 8 }} />
            <div style={{ width: '60%', height: 16, background: C.creamDark, borderRadius: 2, marginBottom: 6 }} />
            <div style={{ width: '40%', height: 10, background: C.creamDeep, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: '32px 0',
      textAlign: 'center',
      borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <Ornament color={C.rule} />
      <p style={{
        fontFamily: F.serif,
        fontSize: 15,
        fontStyle: 'italic',
        color: C.charcoalLight,
        margin: '12px 0 0',
      }}>
        {message}
      </p>
    </div>
  );
}
