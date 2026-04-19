'use client';

/**
 * Varianta 1 — "Editorial"
 * The Athletic / NYT Sports / Monocle styl.
 *
 * Izolovaná stránka — veškerý styling je inline nebo v <style> tagu.
 * Neovlivňuje globální theme.
 *
 * Data: real /dashboard/feed endpoint.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Fraunces } from 'next/font/google';
import { apiFetch, ApiError, type DashboardFeed, type EventSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach } from '@/lib/member-context';

/* ---------- Fonts ---------- */

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

/* ---------- Design tokens ---------- */

const T = {
  cream: '#faf7f2',
  creamDark: '#f0ece4',
  creamBorder: '#e2ddd5',
  navy: '#0d1b2a',
  navyMid: '#1e3048',
  navyLight: '#3a5068',
  steel: '#6b7c8f',
  steelLight: '#9aabb8',
  accent: '#609bc6',       // Braník modrá — jediný accent
  accentHover: '#4a87b5',
  white: '#ffffff',
  serif: '"fraunces", "Georgia", "Times New Roman", serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

/* ---------- Helpers ---------- */

function czDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function czShortDate(iso: string): { day: string; month: string; weekday: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleDateString('cs-CZ', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('cs-CZ', { weekday: 'long' }),
  };
}

function czTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  return `před ${Math.floor(hours / 24)} dny`;
}

const EVENT_TYPE_CS: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůze',
  SOCIAL: 'Akce',
};

const SEVERITY_STRIP: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#1a0a08', text: '#d6533a', label: 'KRITICKÉ' },
  warning:  { bg: '#0f1208', text: '#b5a023', label: 'UPOZORNĚNÍ' },
};

/* ---------- Main page ---------- */

export default function EditorialPage() {
  const auth = useAuth();
  const { data: memberCtx } = useMemberContext();

  const { data: feed, isLoading, isError } = useQuery<DashboardFeed, ApiError>({
    queryKey: ['dashboard-feed-editorial', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 60_000,
  });

  const showAttention = (memberCtx ? (isAdmin(memberCtx) || isCoach(memberCtx)) : true);

  const heroEvent = feed?.thisWeek?.[0] ?? null;
  const remainingEvents = feed?.thisWeek?.slice(1) ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .ed-root {
          min-height: 100vh;
          background: ${T.cream};
          color: ${T.navy};
          font-family: ${T.sans};
          font-size: 16px;
          line-height: 1.6;
        }

        /* Dark mode — fallback, nie je tragické */
        @media (prefers-color-scheme: dark) {
          .ed-root {
            background: #12100d;
            color: #e8e0d4;
          }
          .ed-masthead {
            border-color: #2a2520 !important;
          }
          .ed-section-rule {
            border-color: #2a2520 !important;
          }
          .ed-hero-card {
            background: #1a1610 !important;
            border-color: #2a2520 !important;
          }
          .ed-sidebar-box {
            background: #1a1610 !important;
            border-color: #2a2520 !important;
          }
          .ed-event-row {
            border-color: #2a2520 !important;
          }
          .ed-wire-item {
            border-color: #2a2520 !important;
          }
          .ed-briefing-strip {
            background: #1a1610 !important;
            border-color: #2a2520 !important;
          }
          .ed-back-link {
            color: ${T.accent} !important;
          }
        }

        .ed-root * {
          box-sizing: border-box;
        }

        /* Back link */
        .ed-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: ${T.sans};
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${T.accent};
          text-decoration: none;
          padding: 16px 0;
          transition: color 0.15s;
        }
        .ed-back-link:hover { color: ${T.accentHover}; }

        /* Masthead */
        .ed-masthead {
          border-top: 3px solid ${T.navy};
          border-bottom: 1px solid ${T.creamBorder};
          padding: 20px 0 18px;
          margin-bottom: 48px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 24px;
        }

        .ed-pub-name {
          font-family: ${T.serif};
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: ${T.navy};
          margin: 0;
        }

        .ed-pub-date {
          font-family: ${T.sans};
          font-size: 11px;
          font-weight: 500;
          color: ${T.steel};
          letter-spacing: 0.06em;
          text-align: right;
          flex-shrink: 0;
        }

        /* Section header — ALL CAPS small caps rule */
        .ed-section-header {
          font-family: ${T.sans};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${T.steel};
          margin: 0 0 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid ${T.creamBorder};
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ed-section-header::after {
          content: '';
          flex: 1;
          height: 1px;
          background: ${T.creamBorder};
        }

        /* Magazine grid */
        .ed-magazine-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          margin-bottom: 64px;
        }

        @media (min-width: 900px) {
          .ed-magazine-grid {
            grid-template-columns: 2fr 1fr;
            gap: 0 48px;
          }
        }

        /* Hero article */
        .ed-hero-card {
          background: ${T.white};
          border: 1px solid ${T.creamBorder};
          padding: 40px;
          position: relative;
        }

        .ed-hero-eyebrow {
          font-family: ${T.sans};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${T.accent};
          margin: 0 0 16px;
        }

        .ed-hero-title {
          font-family: ${T.serif};
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: ${T.navy};
          margin: 0 0 20px;
        }

        /* Drop cap */
        .ed-hero-body::first-letter {
          font-family: ${T.serif};
          font-size: 4.2em;
          font-weight: 700;
          line-height: 0.8;
          float: left;
          margin: 0.06em 10px 0 0;
          color: ${T.accent};
        }

        .ed-hero-body {
          font-family: ${T.sans};
          font-size: 15px;
          line-height: 1.75;
          color: ${T.navyLight};
          margin: 0 0 28px;
        }

        .ed-hero-meta {
          font-family: ${T.sans};
          font-size: 11px;
          color: ${T.steelLight};
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ed-hero-meta-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: ${T.steelLight};
          display: inline-block;
        }

        .ed-hero-rsvp {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid ${T.creamBorder};
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .ed-rsvp-stat {
          text-align: center;
        }

        .ed-rsvp-num {
          font-family: ${T.serif};
          font-size: 32px;
          font-weight: 700;
          color: ${T.navy};
          line-height: 1;
        }

        .ed-rsvp-label {
          font-family: ${T.sans};
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${T.steelLight};
          margin-top: 4px;
        }

        .ed-rsvp-divider {
          width: 1px;
          height: 40px;
          background: ${T.creamBorder};
        }

        .ed-hero-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: ${T.sans};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${T.accent};
          text-decoration: none;
          border-bottom: 1.5px solid ${T.accent};
          padding-bottom: 1px;
          transition: color 0.15s, border-color 0.15s;
          margin-top: auto;
          align-self: flex-start;
        }
        .ed-hero-link:hover {
          color: ${T.accentHover};
          border-color: ${T.accentHover};
        }

        /* Sidebar — INDEX column */
        .ed-sidebar {
          padding-top: 0;
          border-left: none;
        }

        @media (min-width: 900px) {
          .ed-sidebar {
            border-left: 1px solid ${T.creamBorder};
            padding-left: 36px;
          }
        }

        .ed-sidebar-box {
          background: ${T.creamDark};
          border: 1px solid ${T.creamBorder};
          padding: 24px;
          margin-bottom: 24px;
        }

        .ed-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 0;
          border-bottom: 1px solid ${T.creamBorder};
        }

        .ed-stat-row:last-child {
          border-bottom: none;
        }

        .ed-stat-label {
          font-family: ${T.sans};
          font-size: 11px;
          color: ${T.steel};
          font-style: italic;
        }

        .ed-stat-value {
          font-family: ${T.serif};
          font-size: 20px;
          font-weight: 700;
          color: ${T.navy};
        }

        .ed-sidebar-quote {
          border-left: 3px solid ${T.accent};
          padding-left: 16px;
          margin: 0;
          font-family: ${T.serif};
          font-size: 16px;
          font-style: italic;
          color: ${T.navyMid};
          line-height: 1.5;
        }

        .ed-sidebar-quote-attr {
          display: block;
          margin-top: 10px;
          font-family: ${T.sans};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${T.steelLight};
          font-style: normal;
        }

        /* "BIG QUOTE" decoration */
        .ed-open-quote {
          font-family: ${T.serif};
          font-size: 80px;
          line-height: 0.5;
          color: ${T.accent};
          margin-bottom: 8px;
          display: block;
          opacity: 0.4;
        }

        /* This Week — numbered list */
        .ed-week-section {
          margin-bottom: 64px;
        }

        .ed-event-row {
          display: grid;
          grid-template-columns: 56px 1fr auto;
          gap: 24px;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid ${T.creamBorder};
          text-decoration: none;
          color: inherit;
          transition: background 0.1s;
        }

        .ed-event-row:first-of-type {
          border-top: 1px solid ${T.creamBorder};
        }

        .ed-event-row:hover .ed-event-title {
          color: ${T.accent};
        }

        .ed-event-number {
          font-family: ${T.serif};
          font-size: 28px;
          font-weight: 700;
          color: ${T.creamBorder};
          text-align: right;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .ed-event-date-block {
          margin-bottom: 2px;
        }

        .ed-event-big-date {
          font-family: ${T.serif};
          font-size: 28px;
          font-weight: 700;
          color: ${T.navy};
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .ed-event-weekday {
          font-family: ${T.sans};
          font-size: 10px;
          color: ${T.steelLight};
          font-style: italic;
          margin-top: 2px;
        }

        .ed-event-title {
          font-family: ${T.serif};
          font-size: 18px;
          font-weight: 700;
          color: ${T.navy};
          letter-spacing: -0.02em;
          transition: color 0.15s;
          margin-bottom: 4px;
        }

        .ed-event-subtitle {
          font-family: ${T.sans};
          font-size: 11px;
          color: ${T.steelLight};
          font-style: italic;
        }

        .ed-event-type-pill {
          font-family: ${T.sans};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${T.accent};
          border: 1px solid ${T.accent};
          padding: 3px 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .ed-event-rsvp-small {
          font-family: ${T.sans};
          font-size: 11px;
          color: ${T.steelLight};
          white-space: nowrap;
          font-style: italic;
        }

        /* Briefing strip — Needs Attention */
        .ed-briefing-strip {
          background: ${T.creamDark};
          border: 1px solid ${T.creamBorder};
          border-left: 3px solid ${T.navy};
          padding: 20px 24px;
          margin-bottom: 12px;
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 20px;
          align-items: center;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          transition: border-left-color 0.15s;
        }

        .ed-briefing-strip:hover {
          border-left-color: ${T.accent};
        }

        .ed-briefing-tag {
          font-family: ${T.sans};
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
        }

        .ed-briefing-title {
          font-family: ${T.serif};
          font-size: 15px;
          font-weight: 700;
          color: ${T.navy};
          letter-spacing: -0.01em;
        }

        .ed-briefing-desc {
          font-family: ${T.sans};
          font-size: 12px;
          color: ${T.steel};
          margin-top: 3px;
          font-style: italic;
        }

        .ed-briefing-arrow {
          font-family: ${T.serif};
          font-size: 20px;
          color: ${T.steelLight};
          flex-shrink: 0;
        }

        /* Wire feed — Recent Activity */
        .ed-wire-section {
          margin-bottom: 64px;
        }

        .ed-wire-item {
          display: grid;
          grid-template-columns: 80px 1fr 80px;
          gap: 16px;
          align-items: baseline;
          padding: 12px 0;
          border-bottom: 1px solid ${T.creamBorder};
        }

        .ed-wire-time {
          font-family: ${T.sans};
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: ${T.steelLight};
          text-transform: uppercase;
        }

        .ed-wire-message {
          font-family: ${T.sans};
          font-size: 13px;
          color: ${T.navyLight};
          line-height: 1.5;
        }

        .ed-wire-tag {
          font-family: ${T.sans};
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: ${T.steelLight};
          text-align: right;
        }

        /* Footer rule */
        .ed-footer {
          border-top: 3px solid ${T.navy};
          padding-top: 20px;
          margin-top: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ed-footer-name {
          font-family: ${T.serif};
          font-size: 16px;
          font-weight: 700;
          color: ${T.navy};
        }

        .ed-footer-note {
          font-family: ${T.sans};
          font-size: 10px;
          color: ${T.steelLight};
          font-style: italic;
        }

        /* Skeleton shimmer */
        .ed-skeleton {
          background: linear-gradient(90deg, ${T.creamDark} 25%, ${T.creamBorder} 50%, ${T.creamDark} 75%);
          background-size: 200% 100%;
          animation: ed-shimmer 1.4s infinite;
          border-radius: 2px;
        }

        @keyframes ed-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Responsive fix for mobile */
        @media (max-width: 600px) {
          .ed-event-row {
            grid-template-columns: 44px 1fr;
          }
          .ed-event-type-pill {
            display: none;
          }
          .ed-hero-card {
            padding: 24px;
          }
          .ed-hero-title {
            font-size: 32px;
          }
          .ed-wire-item {
            grid-template-columns: 64px 1fr;
          }
          .ed-wire-tag {
            display: none;
          }
          .ed-briefing-strip {
            grid-template-columns: 60px 1fr;
          }
          .ed-briefing-arrow {
            display: none;
          }
        }
      `}</style>

      <div className={`ed-root ${fraunces.variable}`}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

          {/* Back link */}
          <Link href="/admin/design-preview" className="ed-back-link">
            ← Zpět k variantám
          </Link>

          {/* Masthead */}
          <header className="ed-masthead">
            <h1 className="ed-pub-name">ABC Braník</h1>
            <p className="ed-pub-date">
              {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
            </p>
          </header>

          {/* Loading state */}
          {isLoading && (
            <div style={{ paddingBottom: 80 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48, marginBottom: 64 }}>
                <div style={{ background: T.white, border: `1px solid ${T.creamBorder}`, padding: 40 }}>
                  <div className="ed-skeleton" style={{ height: 14, width: '30%', marginBottom: 16 }} />
                  <div className="ed-skeleton" style={{ height: 52, width: '90%', marginBottom: 12 }} />
                  <div className="ed-skeleton" style={{ height: 52, width: '70%', marginBottom: 24 }} />
                  <div className="ed-skeleton" style={{ height: 14, width: '100%', marginBottom: 8 }} />
                  <div className="ed-skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
                  <div className="ed-skeleton" style={{ height: 14, width: '60%' }} />
                </div>
                <div>
                  <div className="ed-skeleton" style={{ height: 14, width: '60%', marginBottom: 16 }} />
                  <div className="ed-skeleton" style={{ height: 100, marginBottom: 12 }} />
                  <div className="ed-skeleton" style={{ height: 100 }} />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div style={{
              padding: '40px',
              background: T.white,
              border: `1px solid ${T.creamBorder}`,
              textAlign: 'center',
              marginBottom: 64,
            }}>
              <p style={{ fontFamily: T.serif, fontSize: 20, color: T.steel, fontStyle: 'italic' }}>
                Nepodařilo se načíst data. Zkontrolujte spojení s API.
              </p>
            </div>
          )}

          {/* Content */}
          {feed && (
            <>
              {/* ===== MAGAZINE GRID — HERO + SIDEBAR ===== */}
              <section style={{ marginBottom: 64 }}>
                <div className="ed-section-header">
                  Dnešní přehled
                </div>

                <div className="ed-magazine-grid">
                  {/* HERO — leading article */}
                  <HeroArticle event={heroEvent} stats={feed.stats} />

                  {/* SIDEBAR — INDEX */}
                  <aside className="ed-sidebar">
                    <div className="ed-section-header" style={{ fontSize: 9, letterSpacing: '0.22em' }}>
                      Index
                    </div>

                    {/* Club stats */}
                    <div className="ed-sidebar-box">
                      <div className="ed-section-header" style={{ fontSize: 9, marginBottom: 0, paddingBottom: 12 }}>
                        Statistiky klubu
                      </div>
                      <div className="ed-stat-row">
                        <span className="ed-stat-label">Členů celkem</span>
                        <span className="ed-stat-value">{feed.stats.members}</span>
                      </div>
                      <div className="ed-stat-row">
                        <span className="ed-stat-label">Aktivní týmy</span>
                        <span className="ed-stat-value">{feed.stats.teams}</span>
                      </div>
                      <div className="ed-stat-row">
                        <span className="ed-stat-label">Nadcházející akce</span>
                        <span className="ed-stat-value">{feed.stats.upcomingEvents}</span>
                      </div>
                    </div>

                    {/* Quote decoration */}
                    <div className="ed-sidebar-box">
                      <span className="ed-open-quote">"</span>
                      <blockquote className="ed-sidebar-quote">
                        Sportovní klub je víc než výsledky. Je to komunita, která roste společně.
                        <cite className="ed-sidebar-quote-attr">— ABC Braník</cite>
                      </blockquote>
                    </div>

                    {/* Quick nav */}
                    <div style={{ padding: '16px 0' }}>
                      <div className="ed-section-header" style={{ fontSize: 9 }}>
                        Rychlé akce
                      </div>
                      {[
                        { label: 'Plán událostí', href: '/admin/events' },
                        { label: 'Rostry týmů', href: '/admin/teams' },
                        { label: 'Členové klubu', href: '/admin/members' },
                        { label: 'Nová událost', href: '/admin/events/new' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: `1px solid ${T.creamBorder}`,
                            textDecoration: 'none',
                            fontFamily: T.sans,
                            fontSize: 12,
                            color: T.navyLight,
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{ color: T.accent, fontWeight: 700 }}>→</span>
                        </Link>
                      ))}
                    </div>
                  </aside>
                </div>
              </section>

              {/* ===== THIS WEEK — numbered list ===== */}
              {remainingEvents.length > 0 && (
                <section className="ed-week-section">
                  <div className="ed-section-header">
                    Tento týden
                  </div>

                  {remainingEvents.map((event, idx) => (
                    <WeekRow key={event.id} event={event} index={idx + 2} />
                  ))}

                  <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <Link
                      href="/admin/events"
                      style={{
                        fontFamily: T.sans,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: T.accent,
                        textDecoration: 'none',
                        borderBottom: `1.5px solid ${T.accent}`,
                        paddingBottom: 1,
                      }}
                    >
                      Celý kalendář →
                    </Link>
                  </div>
                </section>
              )}

              {/* Fallback when no events */}
              {feed.thisWeek.length === 0 && !isLoading && (
                <section style={{ marginBottom: 64 }}>
                  <div className="ed-section-header">Tento týden</div>
                  <div style={{
                    padding: '48px 40px',
                    background: T.white,
                    border: `1px solid ${T.creamBorder}`,
                    textAlign: 'center',
                  }}>
                    <p style={{ fontFamily: T.serif, fontSize: 20, color: T.steel, fontStyle: 'italic', margin: 0 }}>
                      Tento týden nejsou naplánované žádné akce.
                    </p>
                    <Link href="/admin/events/new" style={{
                      display: 'inline-block',
                      marginTop: 16,
                      fontFamily: T.sans,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: T.accent,
                      textDecoration: 'none',
                      borderBottom: `1.5px solid ${T.accent}`,
                    }}>
                      Naplánovat akci →
                    </Link>
                  </div>
                </section>
              )}

              {/* ===== BRIEFING — Needs Attention ===== */}
              {showAttention && feed.needsAttention.length > 0 && (
                <section style={{ marginBottom: 64 }}>
                  <div className="ed-section-header">
                    Briefing
                  </div>
                  {feed.needsAttention.map((item, i) => {
                    const s = SEVERITY_STRIP[item.severity] ?? SEVERITY_STRIP.warning;
                    return (
                      <Link key={i} href={item.link} className="ed-briefing-strip">
                        <span className="ed-briefing-tag" style={{ color: s.text }}>
                          {s.label}
                        </span>
                        <div>
                          <div className="ed-briefing-title">{item.title}</div>
                          <div className="ed-briefing-desc">{item.description}</div>
                        </div>
                        <span className="ed-briefing-arrow">→</span>
                      </Link>
                    );
                  })}
                </section>
              )}

              {/* ===== WIRE — Recent Activity ===== */}
              {feed.recentActivity.length > 0 && (
                <section className="ed-wire-section">
                  <div className="ed-section-header">
                    Wire
                  </div>

                  {/* Wire header row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 80px',
                    gap: 16,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${T.navy}`,
                    marginBottom: 0,
                  }}>
                    <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.steelLight }}>Čas</span>
                    <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.steelLight }}>Zpráva</span>
                    <span style={{ fontFamily: T.sans, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.steelLight, textAlign: 'right' }}>Typ</span>
                  </div>

                  {feed.recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="ed-wire-item"
                      style={{ cursor: item.link ? 'pointer' : 'default' }}
                      onClick={() => item.link && (window.location.href = item.link)}
                    >
                      <span className="ed-wire-time">{relTime(item.timestamp)}</span>
                      <span className="ed-wire-message">{item.message}</span>
                      <span className="ed-wire-tag">{item.type}</span>
                    </div>
                  ))}
                </section>
              )}

              {/* Footer */}
              <footer className="ed-footer">
                <span className="ed-footer-name">ABC Braník</span>
                <span className="ed-footer-note">
                  Varianta 1 — Editorial · Design Preview
                </span>
              </footer>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Hero Article Component ---------- */

function HeroArticle({
  event,
  stats,
}: {
  event: EventSummary | null;
  stats: DashboardFeed['stats'];
}) {
  if (!event) {
    return (
      <div className="ed-hero-card">
        <p className="ed-hero-eyebrow">Přehled</p>
        <h2 className="ed-hero-title">ABC Braník</h2>
        <p className="ed-hero-body">
          Sportovní klub ABC Braník sdružuje {stats.members} členů ve {stats.teams} týmech.
          Celkem je naplánováno {stats.upcomingEvents} nadcházejících akcí.
          Tento týden nejsou žádné události — ideální čas naplánovat trénink.
        </p>
      </div>
    );
  }

  const { day, month, weekday } = czShortDate(event.startsAt);
  const typeLabel = EVENT_TYPE_CS[event.type] ?? event.type;
  const rsvp = event.rsvpSummary;
  const total = rsvp.yes + rsvp.maybe + rsvp.no + rsvp.pending;

  const isMatch = event.type === 'MATCH' || event.type === 'TOURNAMENT';
  const heroTitle = isMatch && event.opponent
    ? `${event.title}`
    : event.teamName
      ? `${typeLabel}: ${event.teamName}`
      : typeLabel;

  const heroBody = isMatch
    ? `${czDate(event.startsAt)} ${czTime(event.startsAt)} — ${event.homeAway === 'HOME' ? 'domácí' : event.homeAway === 'AWAY' ? 'venku' : 'neutrální hřiště'}${event.location ? `, ${event.location}` : ''}. Tým nastupuje s odhodláním podat nejlepší výkon sezóny.`
    : `Trénink ${event.teamName ? `týmu ${event.teamName}` : ''} v ${czTime(event.startsAt)}, ${czDate(event.startsAt)}${event.location ? `, ${event.location}` : ''}. Pravidelná příprava je základem každého úspěchu.`;

  return (
    <div className="ed-hero-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <p className="ed-hero-eyebrow">{typeLabel}</p>

      <h2 className="ed-hero-title">{heroTitle}</h2>

      <p className="ed-hero-body">{heroBody}</p>

      <div className="ed-hero-meta">
        <span>{weekday}</span>
        <span className="ed-hero-meta-dot" />
        <span style={{ fontStyle: 'normal', fontWeight: 600 }}>{day} {month}</span>
        <span className="ed-hero-meta-dot" />
        <span>{czTime(event.startsAt)}</span>
        {event.location && (
          <>
            <span className="ed-hero-meta-dot" />
            <span>{event.location}</span>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="ed-hero-rsvp">
          <div className="ed-rsvp-stat">
            <div className="ed-rsvp-num">{rsvp.yes}</div>
            <div className="ed-rsvp-label">Potvrzeno</div>
          </div>
          <div className="ed-rsvp-divider" />
          <div className="ed-rsvp-stat">
            <div className="ed-rsvp-num">{rsvp.pending}</div>
            <div className="ed-rsvp-label">Čeká</div>
          </div>
          <div className="ed-rsvp-divider" />
          <div className="ed-rsvp-stat">
            <div className="ed-rsvp-num">{total}</div>
            <div className="ed-rsvp-label">Celkem</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <Link href={`/admin/events/${event.id}`} className="ed-hero-link">
          Číst celý report →
        </Link>
      </div>
    </div>
  );
}

/* ---------- Week Row Component ---------- */

function WeekRow({ event, index }: { event: EventSummary; index: number }) {
  const { day, month, weekday } = czShortDate(event.startsAt);
  const typeLabel = EVENT_TYPE_CS[event.type] ?? event.type;
  const rsvp = event.rsvpSummary;
  const going = rsvp.yes;

  const displayTitle = (event.type === 'MATCH' || event.type === 'TOURNAMENT') && event.title
    ? event.title
    : event.teamName
      ? `${typeLabel} — ${event.teamName}`
      : typeLabel;

  return (
    <Link href={`/admin/events/${event.id}`} className="ed-event-row">
      <span className="ed-event-number">{String(index).padStart(2, '0')}</span>

      <div>
        <div className="ed-event-date-block">
          <span className="ed-event-big-date">{day} {month}</span>
          <span style={{ fontFamily: T.sans, fontSize: 11, color: T.steelLight, marginLeft: 8 }}>
            {czTime(event.startsAt)}
          </span>
        </div>
        <div className="ed-event-weekday">{weekday}</div>
        <div className="ed-event-title" style={{ marginTop: 6 }}>{displayTitle}</div>
        {event.location && (
          <div className="ed-event-subtitle">{event.location}</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span className="ed-event-type-pill">{typeLabel}</span>
        {going > 0 && (
          <span className="ed-event-rsvp-small">{going} jde</span>
        )}
      </div>
    </Link>
  );
}
