'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImportedMember {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jerseyNumber?: number;
  position?: string;
  teamName?: string;
  role?: string;
}

interface ParsedEvent {
  title: string;
  start: string;
  end: string;
  location: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

interface EventImportResult {
  imported: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// iCal parser (client-side, no deps)
// ---------------------------------------------------------------------------
function parseICal(content: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const blocks = content.split('BEGIN:VEVENT');

  for (const block of blocks.slice(1)) {
    const endIdx = block.indexOf('END:VEVENT');
    const vevent = block.slice(0, endIdx);

    // Handle line folding (RFC 5545: lines longer than 75 chars are folded with CRLF + whitespace)
    const unfolded = vevent.replace(/\r?\n[ \t]/g, '');

    const get = (key: string) => {
      const match = unfolded.match(new RegExp(`${key}[^:]*:(.+)`));
      return match?.[1]?.trim() ?? '';
    };

    const parseDate = (val: string) => {
      const m = val.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (m && m[1] && m[2] && m[3] && m[4] && m[5] && m[6]) {
        return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).toISOString();
      }
      // All-day event: YYYYMMDD
      const dm = val.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (dm && dm[1] && dm[2] && dm[3]) {
        return new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3], 9, 0, 0)).toISOString();
      }
      return new Date(val).toISOString();
    };

    const title = get('SUMMARY').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' ');
    const startRaw = get('DTSTART');
    const endRaw = get('DTEND');
    const location = get('LOCATION').replace(/\\,/g, ',').replace(/\\;/g, ';');

    if (title && startRaw) {
      const start = parseDate(startRaw);
      const end = endRaw ? parseDate(endRaw) : start;
      events.push({ title, start, end, location });
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// CSV parsers
// ---------------------------------------------------------------------------
function splitCSVLine(line: string, sep: string): string[] {
  // Basic: handle quoted fields
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] ?? '';
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Safe array access that always returns a string (empty string for undefined). */
function col(cols: string[], i: number): string {
  return cols[i] ?? '';
}

/** Safe array access that returns undefined when index is -1 or value is empty. */
function optCol(cols: string[], i: number): string | undefined {
  if (i < 0) return undefined;
  const v = cols[i];
  return v === undefined || v === '' ? undefined : v;
}

function parseTeamSnapCSV(lines: string[]): ImportedMember[] {
  const headers = splitCSVLine(lines[0] ?? '', ',').map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));
  const firstIdx = idx('first name');
  const lastIdx = idx('last name');
  const emailIdx = idx('email');
  const phoneIdx = idx('phone');
  const jerseyIdx = idx('jersey');
  const posIdx = idx('position');

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCSVLine(line, ',');
      const jerseyRaw = optCol(cols, jerseyIdx);
      return {
        firstName: col(cols, firstIdx),
        lastName: col(cols, lastIdx),
        email: col(cols, emailIdx),
        phone: optCol(cols, phoneIdx),
        jerseyNumber: jerseyRaw ? Number(jerseyRaw) || undefined : undefined,
        position: optCol(cols, posIdx),
      };
    })
    .filter((m) => m.firstName || m.lastName || m.email);
}

function parseSpondCSV(lines: string[]): ImportedMember[] {
  const headers = splitCSVLine(lines[0] ?? '', ',').map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));
  const nameIdx = idx('name');
  const emailIdx = idx('email');
  const phoneIdx = idx('phone');
  const groupIdx = idx('group');
  const roleIdx = idx('role');

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCSVLine(line, ',');
      const fullName = col(cols, nameIdx);
      const parts = fullName.trim().split(' ');
      return {
        firstName: parts.slice(0, -1).join(' ') || fullName,
        lastName: parts.length > 1 ? (parts[parts.length - 1] ?? '') : '',
        email: col(cols, emailIdx),
        phone: optCol(cols, phoneIdx),
        teamName: optCol(cols, groupIdx),
        role: optCol(cols, roleIdx),
      };
    })
    .filter((m) => m.firstName || m.email);
}

function parseTymujCSV(lines: string[]): ImportedMember[] {
  const sep = (lines[0] ?? '').includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0] ?? '', sep).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));
  const firstIdx = idx('jméno');
  const lastIdx = idx('příjmení');
  const emailIdx = idx('email');
  const teamIdx = idx('tým');
  const posIdx = idx('pozice');
  const jerseyIdx = idx('dres');

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCSVLine(line, sep);
      const jerseyRaw = optCol(cols, jerseyIdx);
      return {
        firstName: col(cols, firstIdx),
        lastName: col(cols, lastIdx),
        email: col(cols, emailIdx),
        teamName: optCol(cols, teamIdx),
        position: optCol(cols, posIdx),
        jerseyNumber: jerseyRaw ? Number(jerseyRaw) || undefined : undefined,
      };
    })
    .filter((m) => m.firstName || m.lastName || m.email);
}

function parseGenericCSV(lines: string[]): ImportedMember[] {
  const sep = (lines[0] ?? '').includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0] ?? '', sep).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));

  const firstIdx = idx('jméno') >= 0 ? idx('jméno') : idx('first') >= 0 ? idx('first') : 0;
  const lastIdx = idx('příjmení') >= 0 ? idx('příjmení') : idx('last') >= 0 ? idx('last') : 1;
  const emailIdx = idx('email') >= 0 ? idx('email') : 2;

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCSVLine(line, sep);
      return {
        firstName: col(cols, firstIdx),
        lastName: col(cols, lastIdx),
        email: col(cols, emailIdx),
      };
    })
    .filter((m) => m.firstName || m.lastName || m.email);
}

function detectAndParseCSV(content: string): { source: string; members: ImportedMember[] } {
  const lines = content.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { source: 'CSV', members: [] };

  const header = (lines[0] ?? '').toLowerCase();

  if (header.includes('first name') && header.includes('last name')) {
    return { source: 'TeamSnap', members: parseTeamSnapCSV(lines) };
  }
  if (header.includes('group') && header.includes('role') && !header.includes('jméno')) {
    return { source: 'Spond', members: parseSpondCSV(lines) };
  }
  if (header.includes('jméno') || header.includes('příjmení')) {
    return { source: 'Týmuj', members: parseTymujCSV(lines) };
  }
  return { source: 'CSV', members: parseGenericCSV(lines) };
}

// ---------------------------------------------------------------------------
// Build CSV string for the members import endpoint
// (expects semicolon format: jméno;příjmení;email;tým;role)
// ---------------------------------------------------------------------------
function membersToImportCsv(members: ImportedMember[]): string {
  const header = 'jméno;příjmení;email;tým;role\n';
  const rows = members
    .map((m) =>
      [m.firstName, m.lastName, m.email, m.teamName ?? '', m.role ?? ''].join(';'),
    )
    .join('\n');
  return header + rows;
}

// ---------------------------------------------------------------------------
// DropZone — reusable file drop area
// ---------------------------------------------------------------------------
function DropZone({
  accept,
  fileName,
  rowCount,
  onFile,
  label,
}: {
  accept: string;
  fileName: string | null;
  rowCount?: number;
  onFile: (file: File) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors',
          dragging ? 'border-primary bg-primary/10' : fileName ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-primary/50 hover:bg-primary/5',
        )}
      >
        {fileName ? (
          <>
            <FileText className="h-7 w-7 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
            {rowCount !== undefined && (
              <span className="text-xs text-muted-foreground">{rowCount} záznamů — kliknutím změnit soubor</span>
            )}
          </>
        ) : (
          <>
            <Upload className="h-7 w-7 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">Přetáhněte nebo klikněte pro výběr</span>
          </>
        )}
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// MemberPreviewTable
// ---------------------------------------------------------------------------
function MemberPreviewTable({ members }: { members: ImportedMember[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? members : members.slice(0, 5);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Náhled — {members.length} členů
        </p>
        {members.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> méně</> : <><ChevronDown className="h-3 w-3" /> zobrazit vše</>}
          </button>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-border/50">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              {['Jméno', 'Příjmení', 'Email', 'Tým', 'Role'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((m, i) => (
              <tr
                key={i}
                className={cn(
                  'border-t border-border/30',
                  (!m.firstName || !m.lastName || !m.email) && 'bg-destructive/5 text-destructive',
                )}
              >
                <td className="px-3 py-1.5">{m.firstName || <span className="text-destructive/60">chybí</span>}</td>
                <td className="px-3 py-1.5">{m.lastName || <span className="text-destructive/60">chybí</span>}</td>
                <td className="px-3 py-1.5 font-mono">{m.email || <span className="text-destructive/60">chybí</span>}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{m.teamName || '—'}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{m.role || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventPreviewTable
// ---------------------------------------------------------------------------
function EventPreviewTable({ events }: { events: ParsedEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, 5);

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Náhled — {events.length} událostí
        </p>
        {events.length > 5 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> méně</> : <><ChevronDown className="h-3 w-3" /> zobrazit vše</>}
          </button>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-border/50">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              {['Název', 'Začátek', 'Místo'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((ev, i) => (
              <tr key={i} className="border-t border-border/30">
                <td className="px-3 py-1.5 font-medium">{ev.title}</td>
                <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{fmt(ev.start)}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{ev.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImportResultBanner
// ---------------------------------------------------------------------------
function ImportResultBanner({
  result,
  label,
  onReset,
}: {
  result: { imported: number; errors: string[] };
  label: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            Importováno {result.imported} {label}
          </p>
          {result.errors.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{result.errors.length} varování</p>
          )}
        </div>
        <button type="button" onClick={onReset} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      {result.errors.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">Varování</p>
          <ul className="space-y-0.5">
            {result.errors.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: CSV člen import (odkaz na members page)
// ---------------------------------------------------------------------------
function MemberCsvSection() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Import členů z CSV</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nahrajte soubor s členy ve formátu CSV. Podporuje formáty Sport Manager, TeamSnap, Spond a Týmuj.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Formát Sport Manager</p>
          <code className="text-xs font-mono text-foreground">
            jméno;příjmení;email;tým;role
          </code>
        </div>
        <p className="text-xs text-muted-foreground">
          Import CSV je dostupný přímo na stránce Členové. Kliknutím níže přejdete tam.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/admin/members">
            <Users className="mr-1.5 h-4 w-4" />
            Přejít na Členové a importovat
            <ExternalLink className="ml-1.5 h-3 w-3 opacity-60" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 2: iCal import
// ---------------------------------------------------------------------------
function ICalSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [result, setResult] = useState<EventImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const mutation = useMutation<void, ApiError, ParsedEvent[]>({
    mutationFn: async (evs: ParsedEvent[]) => {
      const limited = evs.slice(0, 200);
      const created: string[] = [];
      const errs: string[] = [];

      for (const ev of limited) {
        try {
          await apiFetch('/events', {
            method: 'POST',
            body: JSON.stringify({
              type: 'PRACTICE',
              title: ev.title,
              startsAt: ev.start,
              endsAt: ev.end,
              location: ev.location || undefined,
            }),
          });
          created.push(ev.title);
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : String(e);
          errs.push(`"${ev.title}": ${msg}`);
        }
      }

      setResult({ imported: created.length, errors: errs });
      setErrors(errs);
      queryClient.invalidateQueries({ queryKey: ['events', auth.clubId] });
    },
  });

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    setErrors([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseICal(text);
      setEvents(parsed.slice(0, 200));
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleReset = () => {
    setFileName(null);
    setEvents([]);
    setResult(null);
    setErrors([]);
    mutation.reset();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Import událostí z iCal (.ics)</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Importujte události z Google Calendar, Apple Calendar nebo jiné aplikace podporující formát iCal.
              Maximum 200 událostí najednou.
            </p>
          </div>
        </div>

        {result ? (
          <ImportResultBanner
            result={result}
            label={result.imported === 1 ? 'událost' : result.imported < 5 ? 'události' : 'událostí'}
            onReset={handleReset}
          />
        ) : (
          <>
            <DropZone
              accept=".ics,.ical"
              fileName={fileName}
              rowCount={events.length}
              onFile={handleFile}
              label="Vyberte .ics soubor"
            />

            {events.length > 0 && <EventPreviewTable events={events} />}

            {mutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Import selhal: {mutation.error.message}
              </div>
            )}

            {events.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(events)}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Importuji...
                    </>
                  ) : (
                    `Importovat ${events.length} událostí`
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Zrušit
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Competitor CSV import
// ---------------------------------------------------------------------------
interface CompetitorDef {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  description: string;
  sampleHeaders: string;
  format: string;
}

const COMPETITORS: CompetitorDef[] = [
  {
    id: 'teamsnap',
    name: 'TeamSnap',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Exportujte členy z TeamSnap: Roster → Export → CSV',
    sampleHeaders: 'First Name,Last Name,Email,Phone,Jersey Number,Position',
    format: 'CSV (čárka)',
  },
  {
    id: 'spond',
    name: 'Spond',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Exportujte členy ze Spond: Skupina → Členové → Export',
    sampleHeaders: 'Name,Email,Phone,Group,Role',
    format: 'CSV (čárka)',
  },
  {
    id: 'tymuj',
    name: 'Týmuj',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Exportujte členy z Týmuj.cz: Hráči → Export → CSV',
    sampleHeaders: 'Jméno;Příjmení;Email;Tým;Pozice;Číslo dresu',
    format: 'CSV (středník)',
  },
];

function CompetitorCard({ competitor }: { competitor: CompetitorDef }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ source: string; members: ImportedMember[] } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const mutation = useMutation<ImportResult, ApiError, string>({
    mutationFn: (csv: string) =>
      apiFetch<ImportResult>('/members/import', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['members', auth.clubId] });
    },
  });

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    mutation.reset();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const res = detectAndParseCSV(text);
      setParsed({ source: res.source, members: res.members.slice(0, 200) });
    };
    reader.readAsText(file, 'UTF-8');
  }, [mutation]);

  const handleImport = () => {
    if (!parsed?.members.length) return;
    const csv = membersToImportCsv(parsed.members);
    mutation.mutate(csv);
  };

  const handleReset = () => {
    setFileName(null);
    setParsed(null);
    setResult(null);
    mutation.reset();
  };

  const initial = competitor.name[0];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold', competitor.bgColor, competitor.color)}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{competitor.name}</h3>
              <Badge variant="outline" className="text-[10px] font-normal">{competitor.format}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{competitor.description}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Očekávané záhlaví</p>
          <code className="text-xs font-mono break-all">{competitor.sampleHeaders}</code>
        </div>

        {result ? (
          <ImportResultBanner
            result={result}
            label={result.imported === 1 ? 'člen' : result.imported < 5 ? 'členové' : 'členů'}
            onReset={handleReset}
          />
        ) : (
          <>
            <DropZone
              accept=".csv"
              fileName={fileName}
              rowCount={parsed?.members.length}
              onFile={handleFile}
              label={`Vyberte CSV z ${competitor.name}`}
            />

            {parsed && parsed.members.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Detekován formát: <span className="font-medium text-foreground">{parsed.source}</span>
                </div>
                <MemberPreviewTable members={parsed.members} />
              </>
            )}

            {parsed && parsed.members.length === 0 && fileName && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Žádní členové nenalezeni — zkontrolujte formát souboru
              </div>
            )}

            {mutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Import selhal: {mutation.error.message}
              </div>
            )}

            {parsed && parsed.members.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={mutation.isPending}
                  onClick={handleImport}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Importuji...
                    </>
                  ) : (
                    `Importovat ${parsed.members.length} členů`
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Zrušit
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Google Sheets import
// ---------------------------------------------------------------------------
function GoogleSheetsSection() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ source: string; members: ImportedMember[] } | null>(null);
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation<ImportResult, ApiError, string>({
    mutationFn: (csv: string) =>
      apiFetch<ImportResult>('/members/import', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['members', auth.clubId] });
    },
  });

  const handleFetch = async () => {
    if (!url.trim()) return;
    setFetchError(null);
    setParsed(null);
    setFetching(true);
    try {
      const { API_URL } = await import('@/lib/api');
      const { authStore } = await import('@/lib/auth-store');
      const token = authStore.getAccessToken();
      const clubId = authStore.getClubId();
      const endpoint = `${API_URL}/proxy/sheets?url=${encodeURIComponent(url.trim())}`;

      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(clubId ? { 'x-club-id': clubId } : {}),
        },
      });

      if (!response.ok) {
        let msg = `Chyba ${response.status}`;
        try {
          const json = await response.json() as { message?: string };
          if (json.message) msg = json.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const csv = await response.text();
      const res = detectAndParseCSV(csv);
      setParsed({ source: res.source, members: res.members.slice(0, 200) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Nepodařilo se načíst tabulku';
      setFetchError(msg);
    } finally {
      setFetching(false);
    }
  };

  const handleImport = () => {
    if (!parsed?.members.length) return;
    const csv = membersToImportCsv(parsed.members);
    importMutation.mutate(csv);
  };

  const handleReset = () => {
    setUrl('');
    setParsed(null);
    setResult(null);
    setFetchError(null);
    importMutation.reset();
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Import z Google Sheets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vložte odkaz na veřejný Google Sheet (sdílený jako "kdokoli s odkazem může zobrazit").
              Sheet musí mít v prvním řádku záhlaví.
            </p>
          </div>
        </div>

        {result ? (
          <ImportResultBanner
            result={result}
            label={result.imported === 1 ? 'člen' : result.imported < 5 ? 'členové' : 'členů'}
            onReset={handleReset}
          />
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="sheets-url" className="text-xs">URL Google Sheetu</Label>
              <div className="flex gap-2">
                <Input
                  id="sheets-url"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!url.trim() || fetching}
                  onClick={handleFetch}
                >
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Načíst'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Otevřete Google Sheet → Sdílet → Zobrazit odkaz → nastavte "Kdokoli s odkazem"
              </p>
            </div>

            {fetchError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {fetchError}
              </div>
            )}

            {parsed && parsed.members.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Detekován formát: <span className="font-medium text-foreground">{parsed.source}</span>
                </div>
                <MemberPreviewTable members={parsed.members} />
              </>
            )}

            {parsed && parsed.members.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Žádní členové nenalezeni — zkontrolujte záhlaví sheetu
              </div>
            )}

            {importMutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Import selhal: {importMutation.error.message}
              </div>
            )}

            {parsed && parsed.members.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={importMutation.isPending}
                  onClick={handleImport}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Importuji...
                    </>
                  ) : (
                    `Importovat ${parsed.members.length} členů`
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  Zrušit
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import dat"
        subtitle="Migrujte z jiné platformy nebo importujte data ze souboru"
      />

      <div className="space-y-8 max-w-3xl">
        {/* Members CSV */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Členové
          </h2>
          <MemberCsvSection />
        </section>

        {/* Competitors */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Migrace z konkurence
          </h2>
          <p className="text-sm text-muted-foreground -mt-1">
            Exportujte data z jiné platformy a nahrajte je sem. Formát se detekuje automaticky.
          </p>
          <div className="grid gap-4 sm:grid-cols-1">
            {COMPETITORS.map((c) => (
              <CompetitorCard key={c.id} competitor={c} />
            ))}
          </div>
        </section>

        {/* iCal */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Události
          </h2>
          <ICalSection />
        </section>

        {/* Google Sheets */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Google Sheets
          </h2>
          <GoogleSheetsSection />
        </section>
      </div>
    </>
  );
}
