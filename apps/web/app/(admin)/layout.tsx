'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { QueryProvider } from '@/components/query-provider';
import { useClubThemeInjection } from '@/lib/use-club-theme';

function ThemeInjector() {
  useClubThemeInjection();
  return null;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <QueryProvider>
      <ThemeInjector />
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMobileOpen={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <div className="mx-auto max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
