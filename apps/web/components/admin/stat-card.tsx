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
  const colors = {
    default: { icon: 'bg-primary/10 text-primary', border: '' },
    primary: { icon: 'bg-primary/10 text-primary', border: 'border-primary/20' },
    success: { icon: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20' },
    warning: { icon: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
    danger: { icon: 'bg-red-500/10 text-red-500', border: 'border-red-500/20' },
  }[variant];

  return (
    <Card className={cn('group overflow-hidden hover-lift', colors.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-105', colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          {status && (
            <span className={cn(
              'h-2 w-2 rounded-full',
              status === 'ok' && 'bg-emerald-500',
              status === 'warning' && 'bg-amber-500',
              status === 'error' && 'bg-red-500'
            )} />
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight font-mono tabular-nums">
              {value}
            </div>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                trend >= 0 ? 'text-emerald-500' : 'text-red-500'
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
