import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Mini sparkline (30px výška, 7 bodů) ──────────────────────────────────────

function MiniSparkline({
  data,
  color = 'hsl(var(--primary))',
}: {
  data: number[];
  color?: string;
}) {
  const W = 60;
  const H = 30;
  const padX = 2;
  const padY = 3;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - ((v - min) / range) * chartH,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 opacity-60"
      aria-hidden="true"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* poslední bod zvýrazníme */}
      {pts.length > 0 && (() => {
        const lastPt = pts[pts.length - 1];
        return lastPt ? (
          <circle cx={lastPt.x} cy={lastPt.y} r={2} fill={color} />
        ) : null;
      })()}
    </svg>
  );
}

/**
 * Generuje placeholder sparkline data z aktuální hodnoty (simulovaný trend).
 * Používá se když nemáme reálná historická data.
 */
export function placeholderSparkline(currentValue: number, points = 7): number[] {
  const base = typeof currentValue === 'number' ? currentValue : 50;
  return Array.from({ length: points }, (_, i) => {
    const offset = (Math.sin(i * 1.3 + base * 0.1) * 8) + (i / points) * (base > 60 ? 3 : -2);
    return Math.max(0, Math.min(100, Math.round(base + offset - 4)));
  });
}

// ── StatCard ──────────────────────────────────────────────────────────────────

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  status,
  variant = 'default',
  sparkline,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  status?: 'ok' | 'warning' | 'error';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** Pole max 7 číselných hodnot pro mini sparkline. Pokud není, zobrazí se placeholder. */
  sparkline?: number[] | false;
}) {
  const colors = {
    default: { icon: 'bg-primary/10 text-primary', border: '', sparkColor: 'hsl(var(--primary))' },
    primary: { icon: 'bg-primary/10 text-primary', border: 'border-primary/20', sparkColor: 'hsl(var(--primary))' },
    success: { icon: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20', sparkColor: '#22c55e' },
    warning: { icon: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20', sparkColor: '#f59e0b' },
    danger: { icon: 'bg-red-500/10 text-red-500', border: 'border-red-500/20', sparkColor: '#ef4444' },
  }[variant];

  // Sparkline data: pokud je false, nezobrazujeme; pokud chybí, generujeme placeholder
  const sparklineData: number[] | null =
    sparkline === false
      ? null
      : Array.isArray(sparkline) && sparkline.length >= 2
        ? sparkline
        : typeof value === 'number'
          ? placeholderSparkline(value)
          : null;

  return (
    <Card className={cn('group overflow-hidden hover-lift', colors.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105', colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            {sparklineData && (
              <MiniSparkline data={sparklineData} color={colors.sparkColor} />
            )}
            {status && (
              <span className={cn(
                'h-2 w-2 rounded-full',
                status === 'ok' && 'bg-emerald-500',
                status === 'warning' && 'bg-amber-500',
                status === 'error' && 'bg-red-500'
              )} />
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight font-mono tabular-nums">
              {value}
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                trend >= 0 ? 'text-accent' : 'text-red-500'
              )}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
        </div>
        {subtitle && (
          <div className="mt-2 text-xs text-muted-foreground/70">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
