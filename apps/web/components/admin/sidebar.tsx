'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { ADMIN_NAV, isNavItemFeatureEnabled } from '@/lib/nav';
import { useMemberContext, canAccessNavItem, getPrimaryRoleLabel } from '@/lib/member-context';
import { useFeatures } from '@/lib/features';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { data: memberCtx } = useMemberContext();
  const flags = useFeatures();
  const nav = (memberCtx
    ? ADMIN_NAV.filter((item) => canAccessNavItem(memberCtx, item.access))
    : ADMIN_NAV
  ).filter((item) => isNavItemFeatureEnabled(item, flags));
  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : 'Admin';

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden flex-col border-r border-border/60 bg-card transition-[width] duration-200 ease-in-out md:flex',
          'relative',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />

        {/* Brand */}
        <div className="relative flex h-14 items-center gap-2.5 border-b border-border/60 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.4)] transition-shadow hover:shadow-[0_0_16px_-2px_hsl(var(--primary)/0.5)]">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">
                Club App
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {nav.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
                  active
                    ? 'bg-primary/10 font-medium text-foreground shadow-[inset_0_0_12px_-6px_hsl(var(--primary)/0.2)]'
                    : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-all duration-200',
                    active
                      ? 'text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        <Separator className="opacity-50" />

        {/* Footer */}
        <div className="relative flex items-center justify-between px-3 py-2.5">
          {!collapsed && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              v0.0.1
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
