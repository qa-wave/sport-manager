'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ParsedRow {
  rowNum: number;
  firstName: string;
  lastName: string;
  email: string;
  team: string;
  role: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// CSV parse (client-side preview only, semicolon-separated)
// ---------------------------------------------------------------------------
function parseCsvPreview(raw: string): ParsedRow[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  return lines.slice(1).map((line, i) => {
    const [firstName = '', lastName = '', email = '', team = '', role = ''] = line
      .split(';')
      .map((c) => c.trim());
    return { rowNum: i + 2, firstName, lastName, email, team, role };
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CsvImportDialog({ open, onClose }: CsvImportDialogProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);

  const mutation = useMutation<ImportResult, ApiError, string>({
    mutationFn: (csv: string) =>
      apiFetch<ImportResult>('/members/import', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      }),
    onSuccess: (data) => {
      setResult(data);
      // Invalidate members list so it refreshes
      queryClient.invalidateQueries({ queryKey: ['members', auth.clubId] });
    },
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setResult(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCsvContent(text);
        setPreview(parseCsvPreview(text));
      };
      reader.readAsText(file, 'UTF-8');
    },
    [],
  );

  const handleImport = () => {
    if (!csvContent) return;
    mutation.mutate(csvContent);
  };

  const handleClose = () => {
    setCsvContent('');
    setFileName('');
    setPreview([]);
    setResult(null);
    mutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!open) return null;

  const hasValidRows = preview.some(
    (r) => r.firstName && r.lastName && r.email,
  );

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Dialog panel */}
      <div className="relative w-full max-w-2xl rounded-xl border border-border/60 bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Import členů z CSV</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Formát: <span className="font-mono">jméno;příjmení;email;tým;role</span> — první řádek je záhlaví
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">
          {/* File picker */}
          {!result && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5',
                  fileName && 'border-primary/30 bg-primary/5',
                )}
              >
                {fileName ? (
                  <>
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {preview.length} řádků načteno — kliknutím změnit soubor
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Vyberte CSV soubor</span>
                    <span className="text-xs text-muted-foreground">
                      Kliknutím otevřete výběr souboru (.csv)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview table */}
          {preview.length > 0 && !result && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Náhled ({preview.length} řádků)
              </p>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border/50">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      {['#', 'Jméno', 'Příjmení', 'Email', 'Tým', 'Role'].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr
                        key={row.rowNum}
                        className={cn(
                          'border-t border-border/30',
                          (!row.firstName || !row.lastName || !row.email) &&
                            'bg-destructive/5 text-destructive',
                        )}
                      >
                        <td className="px-3 py-1.5 tabular-nums text-muted-foreground">
                          {row.rowNum}
                        </td>
                        <td className="px-3 py-1.5">{row.firstName || <span className="text-destructive/70">chybí</span>}</td>
                        <td className="px-3 py-1.5">{row.lastName || <span className="text-destructive/70">chybí</span>}</td>
                        <td className="px-3 py-1.5 font-mono">{row.email || <span className="text-destructive/70">chybí</span>}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.team || '—'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.role || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error from mutation */}
          {mutation.isError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Import selhal: {mutation.error.message}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Importováno {result.imported} {result.imported === 1 ? 'člen' : result.imported < 5 ? 'členové' : 'členů'}
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {result.errors.length} {result.errors.length === 1 ? 'upozornění' : 'upozornění'}
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-destructive">
                    Chyby a varování
                  </p>
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/50 px-6 py-4">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {result ? 'Zavřít' : 'Zrušit'}
          </Button>
          {!result && (
            <Button
              size="sm"
              disabled={!hasValidRows || mutation.isPending}
              onClick={handleImport}
            >
              {mutation.isPending ? 'Importuji...' : 'Importovat'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
