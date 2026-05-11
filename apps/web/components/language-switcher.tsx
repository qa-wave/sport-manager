'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Search, Check } from 'lucide-react';
import { LANGUAGES, getStoredLocale, setStoredLocale, findLanguage } from '@/lib/languages';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [locale, setLocale] = useState('cs');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return LANGUAGES;
    const q = search.toLowerCase();
    return LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || l.nameEn.toLowerCase().includes(q) || l.code.includes(q)
    );
  }, [search]);

  const current = findLanguage(locale);

  function selectLanguage(code: string) {
    setLocale(code);
    setStoredLocale(code);
    setOpen(false);
    // In the future: trigger i18n reload
    // For now just store preference
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Vybrat jazyk"
      >
        <span className="text-base leading-none">{current?.flag ?? '🌍'}</span>
        {!compact && (
          <span className="hidden sm:inline font-medium">{current?.name ?? 'Jazyk'}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 animate-scale-in rounded-xl border border-border/60 bg-card shadow-xl">
          {/* Search */}
          <div className="relative border-b border-border/40 p-2">
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full rounded-lg bg-muted/50 py-2 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-muted"
            />
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                Žádný jazyk nenalezen
              </div>
            ) : (
              filtered.map(lang => {
                const isActive = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage(lang.code)}
                    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/5 text-foreground'
                        : 'text-foreground/80 hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-base leading-none w-6 text-center shrink-0">{lang.flag}</span>
                    <span className={`flex-1 text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {lang.name}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
