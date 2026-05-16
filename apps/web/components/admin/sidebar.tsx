'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ADMIN_NAV, isNavItemFeatureEnabled } from '@/lib/nav';
import { useMemberContext, canAccessNavItem, getPrimaryRoleLabel } from '@/lib/member-context';
import { useFeatures } from '@/lib/features';
import { useTranslation } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
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
  mobileOpen = false,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const { t } = useTranslation();
  const { data: memberCtx } = useMemberContext();
  const flags = useFeatures();
  const { data: me } = useQuery<MeResponse>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60_000,
  });
  const nav = (memberCtx
    ? ADMIN_NAV.filter((item) => canAccessNavItem(memberCtx, item.access, me?.isPlatformAdmin))
    : ADMIN_NAV
  ).filter((item) => isNavItemFeatureEnabled(item, flags));
  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : 'Admin';

  // Translate nav label: try nav.<key> translation, fall back to item.label
  function navLabel(item: typeof nav[number]): string {
    const key = `nav.${item.labelKey ?? ''}`;
    const translated = t(key);
    // If key not found, t() returns the key itself — use item.label as fallback
    return translated !== key ? translated : item.label;
  }

  const NAV_GROUPS = [
    { key: 'main' as const, label: 'Hlavní' },
    { key: 'manage' as const, label: 'Správa' },
    { key: 'tools' as const, label: 'Nástroje' },
  ];

  // Prefetch high-frequency routes; disable for rarely visited pages
  const LOW_PREFETCH_HREFS = new Set([
    '/admin/audit-log',
    '/admin/platform-analytics',
    '/admin/season-report',
    '/admin/federation-sync',
    '/admin/import',
  ]);

  function shouldPrefetch(href: string): boolean {
    return !LOW_PREFETCH_HREFS.has(href);
  }

  function renderNavLink(item: typeof nav[number], onItemClick?: () => void) {
    const active =
      item.href === '/admin'
        ? pathname === '/admin'
        : pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onItemClick}
        prefetch={shouldPrefetch(item.href)}
        className={cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
          active
            ? 'bg-primary/10 font-medium text-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
        )}
      >
        {active && (
          <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-brand" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors duration-200',
            active
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        <span>{navLabel(item)}</span>
      </Link>
    );
  }

  const navItems = (onItemClick?: () => void) =>
    NAV_GROUPS.map((group) => {
      const items = nav.filter((i) => (i.group ?? 'main') === group.key);
      if (items.length === 0) return null;
      return (
        <div key={group.key}>
          {group.key !== 'main' && (
            <>
              <Separator className="my-2 opacity-30" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </div>
            </>
          )}
          {items.map((item) => renderNavLink(item, onItemClick))}
        </div>
      );
    });

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden flex-col border-r border-border/60 bg-card transition-[width] duration-200 ease-in-out md:flex',
          'relative',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Brand */}
        <div className="relative flex h-14 items-center gap-2.5 border-b border-border/60 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 shadow-sm">
            <BrandLogo size={20} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">
                Sport Manager
              </span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav data-tour="sidebar" className="relative flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {NAV_GROUPS.map((group) => {
            const items = nav.filter((i) => (i.group ?? 'main') === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                {group.key !== 'main' && (
                  <>
                    <Separator className="my-2 opacity-30" />
                    {!collapsed && (
                      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        {group.label}
                      </div>
                    )}
                  </>
                )}
                {items.map((item) => {
                  const active =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={shouldPrefetch(item.href)}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
                        active
                          ? 'bg-primary/10 font-medium text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-brand" />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors duration-200',
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      {!collapsed && <span>{navLabel(item)}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {navLabel(item)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return link;
                })}
              </div>
            );
          })}
        </nav>

        <Separator className="opacity-50" />

        {/* Footer */}
        <div className="relative flex items-center justify-between px-3 py-2.5">
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
          {!collapsed && (
            <button
              data-tour="help"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 text-[11px] font-bold text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
              title="Nápověda"
              aria-label="Nápověda"
            >
              ?
            </button>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={onMobileClose}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <aside
          className={cn(
            'fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-border/60 bg-card transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Brand + close button */}
          <div className="relative flex h-14 items-center justify-between border-b border-border/60 px-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 shadow-sm">
                <BrandLogo size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">
                  Sport Manager
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onMobileClose}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            {navItems(onMobileClose)}
          </nav>

          <Separator className="opacity-50" />

          {/* Footer */}
          <div className="px-3 py-2.5" />
        </aside>
      </div>
    </TooltipProvider>
  );
}
