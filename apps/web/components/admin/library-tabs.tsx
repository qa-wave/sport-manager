'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, HeartPulse, LayoutGrid, Repeat, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = {
  href: string;
  label: string;
  icon: typeof Repeat;
  matchPrefix?: string;
};

const TABS: Tab[] = [
  { href: '/admin/library', label: 'Přehled', icon: LayoutGrid },
  { href: '/admin/treninky', label: 'Tréninky', icon: Repeat, matchPrefix: '/admin/treninky' },
  { href: '/admin/fyzio', label: 'Fyzio', icon: HeartPulse, matchPrefix: '/admin/fyzio' },
  { href: '/admin/training-templates', label: 'Šablony', icon: BookOpen, matchPrefix: '/admin/training-templates' },
  { href: '/admin/library/strategies', label: 'Strategie', icon: ScrollText, matchPrefix: '/admin/library/strategies' },
];

export function LibraryTabs() {
  const pathname = usePathname() ?? '';

  function isActive(tab: Tab): boolean {
    if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix);
    return pathname === tab.href;
  }

  return (
    <nav className="-mt-2 mb-4 flex flex-wrap gap-1 border-b border-border/60">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={tab.href as never}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
