'use client';

import { Globe, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n';

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const themes = [
    { value: 'light', label: t('account.light'), icon: Sun },
    { value: 'dark', label: t('account.dark'), icon: Moon },
    { value: 'system', label: t('account.system'), icon: Monitor },
  ] as const;

  return (
    <>
      {/* Theme */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t('account.appearance')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-xs font-medium transition-all ${
                  theme === value
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t('account.language')}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <p className="text-xs text-muted-foreground">{t('account.languageDesc')}</p>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
