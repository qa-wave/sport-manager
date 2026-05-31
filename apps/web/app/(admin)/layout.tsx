'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { CommandPalette } from '@/components/command-palette';
import { OnboardingTour } from '@/components/admin/onboarding-tour';
import { AiChatWidget } from '@/components/admin/ai-chat';
import { QueryProvider } from '@/components/query-provider';
import { AuthGuard } from '@/components/auth-guard';
import { useClubThemeInjection } from '@/lib/use-club-theme';
import { DashboardSkeleton } from '@/components/admin/skeleton-loaders';

function ThemeInjector() {
  useClubThemeInjection();
  return null;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <QueryProvider>
      <AuthGuard>
        <ThemeInjector />
        <div className="flex min-h-screen bg-background text-foreground pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onMobileOpen={() => setMobileSidebarOpen(true)} />
            <CommandPalette />
            <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
                <Suspense fallback={<DashboardSkeleton />}>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
        </div>
        <OnboardingTour />
        <AiChatWidget />
      </AuthGuard>
      <Toaster position="bottom-right" richColors closeButton />
    </QueryProvider>
  );
}
