'use client';

import { Check, CheckCheck, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RSVP_VARIANT } from '@/lib/role-colors';
import { RSVP_STATUS_LABEL } from '@/lib/event-labels';
import type { EventDetail } from '@/lib/api';

interface EventAttendanceTabProps {
  event: EventDetail;
  eventId: string;
  past: boolean;
  isCoachOrAdmin: boolean;
  bulkAttendance: Record<string, boolean>;
  bulkRsvpConfirm: 'YES' | 'NO' | null;
  rsvpIsPending: boolean;
  attendanceIsPending: boolean;
  onSetBulkAttendance: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  onSetBulkRsvpConfirm: (value: 'YES' | 'NO' | null) => void;
  onSaveAttendance: (entries: Array<{ memberId: string; attended: boolean }>) => void;
  onBulkRsvpConfirm: (status: 'YES' | 'NO') => void;
}

export function EventAttendanceTab({
  event,
  past,
  isCoachOrAdmin,
  bulkAttendance,
  bulkRsvpConfirm,
  rsvpIsPending,
  attendanceIsPending,
  onSetBulkAttendance,
  onSetBulkRsvpConfirm,
  onSaveAttendance,
  onBulkRsvpConfirm,
}: EventAttendanceTabProps) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">
            Docházka ({event.attendees.length} členů)
          </CardTitle>
          <div className="flex gap-2">
            {/* Bulk RSVP — for coaches, future events */}
            {isCoachOrAdmin && !past && (
              <>
                {bulkRsvpConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Nastavit RSVP &quot;{bulkRsvpConfirm === 'YES' ? 'ANO' : 'NE'}&quot; pro{' '}
                      {event.attendees.filter((a) => a.status === 'PENDING').length} čekajících?
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onSetBulkRsvpConfirm(null)}
                      disabled={rsvpIsPending}
                    >
                      Ne
                    </Button>
                    <Button
                      variant={bulkRsvpConfirm === 'YES' ? 'default' : 'destructive'}
                      size="sm"
                      className="h-7 text-xs"
                      disabled={rsvpIsPending}
                      onClick={() => onBulkRsvpConfirm(bulkRsvpConfirm)}
                    >
                      Ano
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={rsvpIsPending}
                      onClick={() => {
                        const pending = event.attendees.filter((a) => a.status === 'PENDING');
                        if (pending.length === 0) return;
                        onSetBulkRsvpConfirm('YES');
                      }}
                    >
                      <CheckCheck className="mr-1 h-3 w-3" />
                      Vše ANO
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={rsvpIsPending}
                      onClick={() => {
                        const pending = event.attendees.filter((a) => a.status === 'PENDING');
                        if (pending.length === 0) return;
                        onSetBulkRsvpConfirm('NO');
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Vše NE
                    </Button>
                  </>
                )}
              </>
            )}
            {/* Bulk attendance — for coaches, past events */}
            {isCoachOrAdmin && past && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                disabled={attendanceIsPending || Object.keys(bulkAttendance).length === 0}
                onClick={() => {
                  const entries = Object.entries(bulkAttendance).map(([memberId, attended]) => ({
                    memberId,
                    attended,
                  }));
                  if (entries.length > 0) {
                    onSaveAttendance(entries);
                  }
                }}
              >
                <Check className="mr-1 h-3 w-3" />
                Uložit docházku ({Object.keys(bulkAttendance).length})
              </Button>
            )}
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider">Člen</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Stav</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Poznámka</TableHead>
              {past && (
                <TableHead className="text-[11px] uppercase tracking-wider">Účast</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {event.attendees.map((a) => (
              <TableRow key={a.memberId} className="border-border/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                        {a.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{a.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={RSVP_VARIANT[a.status] ?? 'default'} className="text-[11px]">
                    {RSVP_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.note ?? '--'}</TableCell>
                {past && (
                  <TableCell>
                    {a.attended != null && !(a.memberId in bulkAttendance) ? (
                      <Badge
                        variant={a.attended ? 'success' : 'danger'}
                        className="text-[11px]"
                      >
                        {a.attended ? 'Ano' : 'Ne'}
                      </Badge>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            bulkAttendance[a.memberId] === true
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'text-muted-foreground hover:text-emerald-500'
                          }`}
                          onClick={() =>
                            onSetBulkAttendance((prev) => ({ ...prev, [a.memberId]: true }))
                          }
                        >
                          ✓
                        </button>
                        <button
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            bulkAttendance[a.memberId] === false
                              ? 'bg-red-500/20 text-red-500'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          onClick={() =>
                            onSetBulkAttendance((prev) => ({ ...prev, [a.memberId]: false }))
                          }
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
