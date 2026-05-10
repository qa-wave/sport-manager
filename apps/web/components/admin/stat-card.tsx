import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  status,
  variant = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  status?: 'ok' | 'warning' | 'error';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-300 hover:border-glow shine',
      '',
      variant === 'primary' && 'border-primary/20 hover:border-primary/40',
      variant === 'success' && 'border-green-500/20 hover:border-green-500/40',
      variant === 'warning' && 'border-yellow-500/20 hover:border-yellow-500/40',
      variant === 'danger' && 'border-red-500/20 hover:border-red-500/40',
    )}>
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
        variant === 'default' && 'bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5',
        variant === 'primary' && 'bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5',
        variant === 'success' && 'bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5',
        variant === 'warning' && 'bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/5',
        variant === 'danger' && 'bg-gradient-to-br from-red-500/10 via-transparent to-pink-500/5',
      )} />

      <CardContent className="relative z-10 p-5">
        <div className="flex items-start justify-between">
          <div className={cn(
            'rounded-lg p-2.5 transition-all duration-300 group-hover:scale-110',
            variant === 'default' && 'bg-primary/10 text-primary shadow-sm',
            variant === 'primary' && 'bg-primary/15 text-primary shadow-sm',
            variant === 'success' && 'bg-green-500/15 text-green-500 shadow-sm',
            variant === 'warning' && 'bg-yellow-500/15 text-yellow-500 shadow-sm',
            variant === 'danger' && 'bg-red-500/15 text-red-500 shadow-sm',
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {status && (
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full animate-pulse-subtle',
                status === 'ok' && 'bg-primary shadow-sm',
                status === 'warning' && 'bg-warning shadow-sm',
                status === 'error' && 'bg-destructive shadow-sm'
              )}
            />
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-[1.02]">
              {value}
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                trend >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend >= 0 ? '+' : ''}{trend}%</span>
              </div>
            )}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
