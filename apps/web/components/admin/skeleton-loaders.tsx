import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// ── DashboardSkeleton ─────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards — 4 columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-8 w-14 rounded" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* This Week section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-0 overflow-hidden rounded-xl border border-border/50 bg-card"
          >
            <div className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-1 border-r border-border/30 py-4">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex flex-1 items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Needs Attention section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── EventListSkeleton ─────────────────────────────────────────────────────────

export function EventListSkeleton() {
  return (
    <div className="space-y-4">
      {/* View switcher toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Event cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-xl border border-border/50 bg-card"
        >
          <div className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-1 border-r border-border/30 py-4">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-1 items-center gap-4 px-4 py-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MemberListSkeleton ────────────────────────────────────────────────────────

export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border/50 px-4 py-3">
          <Skeleton className="h-3 w-4" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex flex-1 items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <div className="flex flex-1 gap-1.5">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ChatSkeleton ──────────────────────────────────────────────────────────────

export function ChatSkeleton() {
  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border border-border/50">
      {/* Conversation list sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border/50">
        {/* Search */}
        <div className="border-b border-border/50 p-3">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Channel section header */}
        <div className="px-3 py-2">
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Conversations */}
        <div className="space-y-1 px-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-8 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Chat message area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Incoming messages (left) */}
          <div className="flex items-end gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 max-w-xs">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-14 w-64 rounded-2xl rounded-bl-sm" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 max-w-xs">
              <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
            </div>
          </div>

          {/* Outgoing messages (right) */}
          <div className="flex items-end justify-end gap-2">
            <div className="flex flex-col items-end space-y-1 max-w-xs">
              <Skeleton className="h-10 w-56 rounded-2xl rounded-br-sm" />
            </div>
          </div>
          <div className="flex items-end justify-end gap-2">
            <div className="flex flex-col items-end space-y-1 max-w-xs">
              <Skeleton className="h-16 w-72 rounded-2xl rounded-br-sm" />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-3">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── DetailPageSkeleton ────────────────────────────────────────────────────────

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10" />
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 pb-px">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={`h-9 rounded-md rounded-b-none ${i === 0 ? 'w-24' : 'w-20'}`} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main panel */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex flex-1 items-center gap-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-14 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
