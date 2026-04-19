'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type MemberDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT, PAYMENT_VARIANT, STATUS_VARIANT, RSVP_VARIANT } from '@/lib/role-colors';

function formatDate(d: string | null): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100);
}

function memberAge(dob: string | null): string | null {
  if (!dob) return null;
  return `${new Date().getFullYear() - new Date(dob).getFullYear()}`;
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const auth = useAuth();

  const { data: m, isLoading, isError } = useQuery<MemberDetail, ApiError>({
    queryKey: ['member', memberId, auth.clubId],
    queryFn: () => apiFetch<MemberDetail>(`/members/${memberId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!memberId,
    retry: false,
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Member" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError || !m) {
    return (
      <>
        <PageHeader
          title="Member"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/members"><ChevronLeft className="mr-1 h-4 w-4" />Back</Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load member profile
          </CardContent>
        </Card>
      </>
    );
  }

  const ageStr = memberAge(m.dateOfBirth);

  return (
    <>
      <PageHeader
        title={`${m.firstName} ${m.lastName}`}
        subtitle={m.isMinor ? 'Minor' : 'Adult member'}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/members"><ChevronLeft className="mr-1 h-4 w-4" />Back to members</Link>
          </Button>
        }
      />

      {/* Hero card */}
      <Card className="relative overflow-hidden gradient-card">
        {/* Sport accent gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
        <CardContent className="relative p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                  {m.firstName[0]}{m.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {m.jerseyNumber != null && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
                  {m.jerseyNumber}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight">{m.firstName} {m.lastName}</h2>
                <Badge variant={STATUS_VARIANT[m.status] ?? 'default'}>{m.status}</Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{m.email}</span>
                {m.phone && <span>{m.phone}</span>}
                {ageStr && <span className="font-medium text-foreground/70">{ageStr} years old</span>}
                {m.dateOfBirth && <span>Born {formatDate(m.dateOfBirth)}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.position && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    {m.position}
                  </Badge>
                )}
                {m.clubRoles.map((r) => (
                  <Badge key={r} variant={ROLE_VARIANT[r] ?? 'default'}>{r}</Badge>
                ))}
              </div>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <div className="rounded-md bg-secondary/50 px-2.5 py-1.5">
                <div className="font-medium text-foreground/80">Joined {formatDate(m.joinedAt)}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide">{m.locale}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="waivers">Waivers</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Teams */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Teams & Roles</CardTitle>
              </CardHeader>
              <CardContent>
                {m.teamRoles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No team assignments</p>
                ) : (
                  <div className="space-y-2">
                    {m.teamRoles.map((tr) => (
                      <div key={`${tr.teamId}-${tr.role}`} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{tr.teamName}</div>
                          <div className="text-xs text-muted-foreground">
                            {(tr as any).sport} · {(tr as any).season}{tr.ageGroup ? ` · ${tr.ageGroup}` : ''}
                          </div>
                        </div>
                        <Badge variant={ROLE_VARIANT[tr.role] ?? 'default'}>
                          {tr.role.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guardians */}
            {m.guardians.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Guardians</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(m.guardians as any[]).map((g: any) => (
                    <div key={g.memberId}>
                      <div className="flex items-center justify-between">
                        <Link href={`/admin/members/${g.memberId}` as any} className="text-sm font-medium hover:text-primary">
                          {g.name}
                        </Link>
                        <div className="flex gap-1">
                          {g.isPrimary && <Badge variant="success">PRIMARY</Badge>}
                          <Badge variant="outline">{g.relationship}</Badge>
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{g.email}{g.phone ? ` · ${g.phone}` : ''}</div>
                      <div className="mt-1 flex gap-2 text-xs">
                        <PermBadge label="Payments" on={g.canViewPayments} />
                        <PermBadge label="Pay" on={g.canMakePayments} />
                        <PermBadge label="Medical" on={g.canViewMedical} />
                        <PermBadge label="Waivers" on={g.canSignWaivers} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Guardian of */}
            {m.guardianOf.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Guardian of ({m.guardianOf.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(m.guardianOf as any[]).map((c: any) => (
                    <div key={c.memberId}>
                      <div className="flex items-center justify-between">
                        <Link href={`/admin/members/${c.memberId}` as any} className="text-sm font-medium hover:text-primary">
                          {c.name}
                        </Link>
                        {c.jerseyNumber != null && (
                          <Badge variant="outline" className="font-mono">#{c.jerseyNumber}</Badge>
                        )}
                      </div>
                      {c.teams?.length > 0 && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{c.teams.join(' · ')}</div>
                      )}
                      <div className="mt-1 flex gap-2 text-xs">
                        <PermBadge label="Payments" on={c.canViewPayments} />
                        <PermBadge label="Medical" on={c.canViewMedical} />
                        <PermBadge label="Waivers" on={c.canSignWaivers} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Medical notes */}
            {m.medicalNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Medical Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.medicalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <Card>
            {m.recentAttendance.length === 0 ? (
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                No attendance records
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Attended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.recentAttendance.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{a.eventTitle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.eventType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(a.eventDate)}</TableCell>
                      <TableCell>
                        <Badge variant={RSVP_VARIANT[a.status] ?? 'default'}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.attended != null ? (
                          <Badge variant={a.attended ? 'success' : 'danger'}>
                            {a.attended ? 'Yes' : 'No'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <div className="space-y-3">
            {m.paymentsMade.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Payments Made</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {m.paymentsMade.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.feeName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : 'Unpaid'}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.amountCents, p.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {m.paymentsFor.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Payments For This Member</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {m.paymentsFor.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.feeName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.paidBy}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : 'Unpaid'}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(p.amountCents, p.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {m.paymentsMade.length === 0 && m.paymentsFor.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-xs text-muted-foreground">
                  No payment records
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Waivers */}
        <TabsContent value="waivers">
          <Card>
            {m.waivers.length === 0 ? (
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                No waivers signed
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waiver</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Signed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.waivers.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{w.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{w.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.signedBy}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(w.signedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function PermBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={on ? 'text-accent-foreground' : 'text-muted-foreground line-through opacity-50'}>
      {label}
    </span>
  );
}
