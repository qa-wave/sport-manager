'use client';

/**
 * Varianta 2 — "Stadium"
 * ESPN / Nike Training Club / broadcast dashboard aesthetic.
 *
 * Design systém:
 *   Pozadí:   #0a0e1a  (deep stadium night)
 *   Surface:  #0f1424  (card layer)
 *   Action:   #609bc6  (Braník modrá)
 *   Glow:     rgba(96,155,198,0.28)
 *   Alert:    #ff5e1a  (alarm orange — Needs Attention)
 *   Muted:    #4a5568
 *   Text:     #e8edf5 / #a0aec0
 *
 * Fonty: Space Grotesk (hero/labels) + JetBrains Mono (čísla/časy)
 *
 * Kompletně izolované inline styly — nic nelekne mimo tuto stránku.
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { apiFetch, type DashboardFeed } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

// ─── Fonts ──────────────────────────────────────────────────────────────────

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sg',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-jb',
  display: 'swap',
});

// ─── Design tokens ───────────────────────────────────────────────────────────

const T = {
  bg: '#0a0e1a',
  surface: '#0f1424',
  surfaceHigh: '#141928',
  border: '#1e2638',
  borderGlow: 'rgba(96,155,198,0.35)',
  action: '#609bc6',
  actionDim: 'rgba(96,155,198,0.15)',
  glow: '0 0 24px rgba(96,155,198,0.28)',
  glowStrong: '0 0 40px rgba(96,155,198,0.45)',
  alert: '#ff5e1a',
  alertDim: 'rgba(255,94,26,0.12)',
  alertBorder: 'rgba(255,94,26,0.5)',
  success: '#22c55e',
  amber: '#f59e0b',
  text: '#e8edf5',
  textSub: '#a0aec0',
  textDim: '#4a5568',
  sg: 'var(--font-sg), "Helvetica Neue", Arial, sans-serif',
  mono: 'var(--font-jb), "JetBrains Mono", "SF Mono", monospace',
} as const;

// ─── Colour map per event type ───────────────────────────────────────────────

const EVENT_COLOR: Record<string, string> = {
  PRACTICE: T.action,
  MATCH: T.amber,
  TOURNAMENT: '#a855f7',
  MEETING: '#22d3ee',
  SOCIAL: '#ec4899',
};

const EVENT_LABEL: Record<string, string> = {
  PRACTICE: 'PRACTICE',
  MATCH: 'MATCH',
  TOURNAMENT: 'TOURNAMENT',
  MEETING: 'MEETING',
  SOCIAL: 'SOCIAL',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleString('en-GB', opts);
}
function timeStr(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function dayNum(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit' });
}
function weekdayShort(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
}
function monthShort(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedNumber({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return <>{val}</>;
}

// ─── Live pulse dot ──────────────────────────────────────────────────────────

function PulseDot({ color = T.action }: { color?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: on ? `0 0 10px ${color}` : 'none',
        transition: 'box-shadow 0.4s ease',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Scoreboard clock ────────────────────────────────────────────────────────

function ScoreboardClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 36,
          fontWeight: 800,
          color: T.text,
          letterSpacing: 2,
          lineHeight: 1,
        }}
      >
        {time}
      </div>
      <div
        style={{
          fontFamily: T.sg,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2,
          color: T.textDim,
          marginTop: 4,
          textTransform: 'uppercase',
        }}
      >
        {date}
      </div>
    </div>
  );
}

// ─── Scoreboard header ───────────────────────────────────────────────────────

function ScoreboardHeader({ hasMatchToday }: { hasMatchToday: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px 16px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle scan-line texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Left: club identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Logo badge */}
        <div
          style={{
            width: 56,
            height: 56,
            background: T.actionDim,
            border: `2px solid ${T.action}`,
            boxShadow: T.glow,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: T.sg,
              fontSize: 22,
              fontWeight: 700,
              color: T.action,
              letterSpacing: -0.5,
            }}
          >
            B
          </span>
        </div>

        <div>
          <div
            style={{
              fontFamily: T.sg,
              fontSize: 28,
              fontWeight: 700,
              color: T.text,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            ABC BRANÍK
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
            <PulseDot color={T.action} />
            <span
              style={{
                fontFamily: T.sg,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.5,
                color: T.action,
                textTransform: 'uppercase',
              }}
            >
              {hasMatchToday ? 'GAMEDAY' : 'TRAINING DAY'}
            </span>
            <span
              style={{
                width: 1,
                height: 12,
                background: T.textDim,
              }}
            />
            <span
              style={{
                fontFamily: T.sg,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 1.5,
                color: T.textDim,
              }}
            >
              LIVE DASHBOARD
            </span>
          </div>
        </div>
      </div>

      {/* Right: real-time clock */}
      <ScoreboardClock />
    </div>
  );
}

// ─── Stat strip ──────────────────────────────────────────────────────────────

function StatStrip({ members, upcoming, attendanceRate }: {
  members: number;
  upcoming: number;
  attendanceRate: number;
}) {
  const stats = [
    { label: 'MEMBERS ACTIVE', value: members, unit: '' },
    { label: 'UPCOMING EVENTS', value: upcoming, unit: '' },
    { label: 'ATTENDANCE RATE', value: attendanceRate, unit: '%' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            padding: '24px 32px',
            borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
            position: 'relative',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: T.action,
              boxShadow: `0 0 8px ${T.action}`,
              opacity: 0.6,
            }}
          />

          <div
            style={{
              fontFamily: T.sg,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: T.textDim,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 72,
              fontWeight: 800,
              color: T.text,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            <AnimatedNumber target={s.value} duration={1400} />
            {s.unit && (
              <span style={{ fontSize: 36, color: T.action, marginLeft: 4 }}>{s.unit}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Needs Attention banner ───────────────────────────────────────────────────

function AlertBanner({ items, onNavigate }: {
  items: DashboardFeed['needsAttention'];
  onNavigate: (link: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        margin: '0 32px 0',
        borderLeft: `3px solid ${T.alert}`,
        background: T.alertDim,
        border: `1px solid ${T.alertBorder}`,
        borderLeftWidth: 3,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: `1px solid ${T.alertBorder}`,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            background: T.alert,
            borderRadius: '50%',
            boxShadow: `0 0 8px ${T.alert}`,
          }}
        />
        <span
          style={{
            fontFamily: T.sg,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: T.alert,
            textTransform: 'uppercase',
          }}
        >
          NEEDS ATTENTION — {items.length} {items.length === 1 ? 'ALERT' : 'ALERTS'}
        </span>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => onNavigate(item.link)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '10px 16px',
            cursor: 'pointer',
            borderBottom: i < items.length - 1 ? `1px solid rgba(255,94,26,0.12)` : 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,94,26,0.07)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            style={{
              fontFamily: T.sg,
              fontSize: 11,
              fontWeight: 700,
              color: item.severity === 'critical' ? T.alert : '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              minWidth: 60,
              flexShrink: 0,
            }}
          >
            {item.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
          </div>
          <div
            style={{
              fontFamily: T.sg,
              fontSize: 13,
              fontWeight: 600,
              color: T.text,
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              fontFamily: T.sg,
              fontSize: 12,
              color: T.textSub,
              flex: 1,
            }}
          >
            {item.description}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.alert,
              letterSpacing: 1,
            }}
          >
            VIEW &rsaquo;
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Ticker bar ──────────────────────────────────────────────────────────────

function TickerBar({ events }: { events: DashboardFeed['thisWeek'] }) {
  if (events.length === 0) return null;

  // Duplicate for seamless scroll
  const items = [...events, ...events];

  return (
    <div
      style={{
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        background: '#090d18',
        overflow: 'hidden',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Label */}
      <div
        style={{
          flexShrink: 0,
          padding: '0 16px',
          borderRight: `1px solid ${T.border}`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: T.actionDim,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: T.sg,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            color: T.action,
            textTransform: 'uppercase',
          }}
        >
          THIS WEEK
        </span>
      </div>

      {/* Scrolling track */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 0,
            width: 'max-content',
            animation: 'stadium-ticker 30s linear infinite',
          }}
        >
          {items.map((ev, i) => {
            const color = EVENT_COLOR[ev.type] ?? T.action;
            return (
              <div
                key={`${ev.id}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 20px',
                  borderRight: `1px solid ${T.border}`,
                  height: 36,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 5px ${color}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: color,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {weekdayShort(ev.startsAt)} {dayNum(ev.startsAt)}
                </span>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    color: T.textDim,
                    letterSpacing: 0.5,
                  }}
                >
                  {timeStr(ev.startsAt)}
                </span>
                <span
                  style={{
                    fontFamily: T.sg,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textSub,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {ev.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes stadium-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─── Event card (broadcast style) ─────────────────────────────────────────────

function EventCard({ event, onClick }: {
  event: DashboardFeed['thisWeek'][number];
  onClick: () => void;
}) {
  const color = EVENT_COLOR[event.type] ?? T.action;
  const label = EVENT_LABEL[event.type] ?? event.type;
  const rsvp = event.rsvpSummary;
  const isLive = (() => {
    const now = Date.now();
    const start = new Date(event.startsAt).getTime();
    const end = new Date(event.endsAt).getTime();
    return now >= start && now <= end;
  })();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        cursor: 'pointer',
        background: hovered ? T.surfaceHigh : T.surface,
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${hovered ? color + '60' : T.border}`,
        borderLeftWidth: 3,
        borderLeftColor: color,
        transition: 'all 0.15s ease',
        boxShadow: hovered ? `0 0 20px rgba(0,0,0,0.3), inset 0 0 40px rgba(${hexToRgb(color)},0.04)` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Time column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 20px',
          borderRight: `1px solid ${T.border}`,
          minWidth: 80,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${color}0a 0%, transparent 100%)`,
        }}
      >
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 28,
            fontWeight: 800,
            color: T.text,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          {dayNum(event.startsAt)}
        </div>
        <div
          style={{
            fontFamily: T.sg,
            fontSize: 10,
            fontWeight: 700,
            color: color,
            letterSpacing: 1.5,
            marginTop: 2,
          }}
        >
          {monthShort(event.startsAt)}
        </div>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 700,
            color: T.textSub,
            marginTop: 6,
            letterSpacing: 0.5,
          }}
        >
          {timeStr(event.startsAt)}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '14px 20px',
          gap: 16,
          minWidth: 0,
        }}
      >
        {/* Type badge */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              background: `${color}18`,
              border: `1px solid ${color}50`,
              fontFamily: T.sg,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: color,
              textTransform: 'uppercase',
            }}
          >
            {isLive && <PulseDot color={color} />}
            {isLive ? 'LIVE' : label}
          </div>
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.sg,
              fontSize: 16,
              fontWeight: 700,
              color: T.text,
              letterSpacing: -0.3,
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 4,
            }}
          >
            {event.teamName && (
              <span
                style={{
                  fontFamily: T.sg,
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.action,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}
              >
                {event.teamName}
              </span>
            )}
            {event.location && (
              <>
                <span style={{ color: T.textDim, fontSize: 11 }}>·</span>
                <span
                  style={{
                    fontFamily: T.sg,
                    fontSize: 11,
                    color: T.textSub,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.location}
                </span>
              </>
            )}
            {event.homeAway && (
              <>
                <span style={{ color: T.textDim, fontSize: 11 }}>·</span>
                <span
                  style={{
                    fontFamily: T.sg,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    color: event.homeAway === 'HOME' ? T.success : T.textSub,
                    textTransform: 'uppercase',
                  }}
                >
                  {event.homeAway}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RSVP column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 20px',
          borderLeft: `1px solid ${T.border}`,
          flexShrink: 0,
          minWidth: 80,
        }}
      >
        {rsvp.total === 0 ? (
          <span style={{ fontFamily: T.sg, fontSize: 10, color: T.textDim }}>NO RSVP</span>
        ) : (
          <>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 24,
                fontWeight: 800,
                color: T.success,
                lineHeight: 1,
              }}
            >
              {rsvp.yes}
            </div>
            <div
              style={{
                fontFamily: T.sg,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: T.textDim,
                marginTop: 2,
                textTransform: 'uppercase',
              }}
            >
              GOING
            </div>
            {rsvp.pending > 0 && (
              <div
                style={{
                  marginTop: 4,
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.amber,
                  fontWeight: 700,
                }}
              >
                +{rsvp.pending} ?
              </div>
            )}
          </>
        )}
      </div>

      {/* Arrow indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 12,
          color: hovered ? color : T.textDim,
          transition: 'color 0.15s',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        &rsaquo;
      </div>
    </div>
  );
}

// ─── Recent activity ──────────────────────────────────────────────────────────

function ActivityLog({ items }: { items: DashboardFeed['recentActivity'] }) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${T.border}`,
          background: 'rgba(255,255,255,0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: T.sg,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: T.textDim,
            textTransform: 'uppercase',
          }}
        >
          ACTIVITY LOG
        </span>
      </div>
      <div>
        {items.slice(0, 5).map((item, i) => {
          const ago = (() => {
            const diff = Date.now() - new Date(item.timestamp).getTime();
            const m = Math.floor(diff / 60000);
            if (m < 60) return `${m}m`;
            const h = Math.floor(m / 60);
            if (h < 24) return `${h}h`;
            return `${Math.floor(h / 24)}d`;
          })();

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 16px',
                borderBottom: i < items.length - 1 && i < 4 ? `1px solid ${T.border}` : 'none',
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: T.action,
                  opacity: 0.5,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontFamily: T.sg,
                  fontSize: 12,
                  color: T.textSub,
                }}
              >
                {item.message}
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.textDim,
                  flexShrink: 0,
                }}
              >
                {ago}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ h = 60, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        background: `linear-gradient(90deg, ${T.surface} 0%, #181e30 50%, ${T.surface} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'stadium-shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

// ─── Util: hex to rgb for box-shadow ─────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function StadiumDashboardPage() {
  const auth = useAuth();
  const router = useRouter();

  const { data: feed, isLoading } = useQuery<DashboardFeed>({
    queryKey: ['dashboard-feed', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 30_000,
  });

  const hasMatchToday = feed?.thisWeek.some((ev) => {
    if (ev.type !== 'MATCH' && ev.type !== 'TOURNAMENT') return false;
    const d = new Date(ev.startsAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }) ?? false;

  const attendanceRate = feed
    ? (() => {
        const total = feed.thisWeek.reduce((s, e) => s + e.rsvpSummary.total, 0);
        const yes = feed.thisWeek.reduce((s, e) => s + e.rsvpSummary.yes, 0);
        return total > 0 ? Math.round((yes / total) * 100) : 0;
      })()
    : 0;

  return (
    <div
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.sg,
      }}
    >
      {/* Global animation keyframes */}
      <style>{`
        @keyframes stadium-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Back nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 32px',
          borderBottom: `1px solid ${T.border}`,
          background: '#07090f',
        }}
      >
        <Link
          href="/admin/design-preview"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: T.sg,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: T.textDim,
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.action)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textDim)}
        >
          &larr; BACK TO VARIANTS
        </Link>
        <span style={{ color: T.textDim, fontSize: 10 }}>·</span>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.textDim,
            letterSpacing: 1,
          }}
        >
          VARIANT 2 — STADIUM
        </span>
      </div>

      {/* Scoreboard header */}
      <ScoreboardHeader hasMatchToday={hasMatchToday} />

      {isLoading ? (
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton h={120} />
          <Skeleton h={60} />
          <Skeleton h={60} />
          <Skeleton h={60} />
        </div>
      ) : !feed ? null : (
        <>
          {/* Stat strip */}
          <StatStrip
            members={feed.stats.members}
            upcoming={feed.stats.upcomingEvents}
            attendanceRate={attendanceRate}
          />

          {/* Ticker bar */}
          <TickerBar events={feed.thisWeek} />

          {/* Main content */}
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Needs attention */}
            {feed.needsAttention.length > 0 && (
              <AlertBanner
                items={feed.needsAttention}
                onNavigate={(link) => router.push(link)}
              />
            )}

            {/* Events section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 2,
                      height: 16,
                      background: T.action,
                      boxShadow: T.glow,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: T.sg,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      color: T.textDim,
                      textTransform: 'uppercase',
                    }}
                  >
                    THIS WEEK — {feed.thisWeek.length} EVENT{feed.thisWeek.length !== 1 ? 'S' : ''}
                  </span>
                </div>
                <Link
                  href="/admin/events"
                  style={{
                    fontFamily: T.sg,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    color: T.action,
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                  }}
                >
                  ALL EVENTS &rsaquo;
                </Link>
              </div>

              {feed.thisWeek.length === 0 ? (
                <div
                  style={{
                    padding: '32px 24px',
                    textAlign: 'center',
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    fontFamily: T.sg,
                    fontSize: 13,
                    color: T.textDim,
                  }}
                >
                  NO EVENTS THIS WEEK
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {feed.thisWeek.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom row: activity + quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

              {/* Activity log */}
              <ActivityLog items={feed.recentActivity} />

              {/* Quick actions panel */}
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${T.border}`,
                    background: 'rgba(255,255,255,0.015)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.sg,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      color: T.textDim,
                      textTransform: 'uppercase',
                    }}
                  >
                    QUICK ACTIONS
                  </span>
                </div>

                {[
                  { label: 'SCHEDULE EVENT', href: '/admin/events/new', accent: true },
                  { label: 'MEMBERS', href: '/admin/members', accent: false },
                  { label: 'TEAMS', href: '/admin/teams', accent: false },
                  { label: 'MESSAGES', href: '/admin/messages', accent: false },
                  { label: 'ALL EVENTS', href: '/admin/events', accent: false },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 16px',
                      borderBottom: `1px solid ${T.border}`,
                      textDecoration: 'none',
                      fontFamily: T.sg,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: action.accent ? T.action : T.textSub,
                      background: action.accent ? T.actionDim : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = action.accent
                        ? 'rgba(96,155,198,0.25)'
                        : 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = action.accent ? T.actionDim : 'transparent';
                    }}
                  >
                    {action.label}
                    <span style={{ fontSize: 14 }}>&rsaquo;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
