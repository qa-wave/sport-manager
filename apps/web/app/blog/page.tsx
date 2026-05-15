import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Tag, Trophy } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog | Sport Manager',
  description:
    'Tipy, návody a novinky pro správce sportovních klubů. RSVP, docházka, komunikace s rodiči a digitalizace mládežnického sportu.',
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/blog',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Návody: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Tipy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Privacy: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Tréninky: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Migrace: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  Funkce: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogIndexPage() {
  const [featured, ...rest] = BLOG_POSTS;
  if (!featured) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 glass px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
            <Link href="/blog" className="text-foreground font-medium">Blog</Link>
            <Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Registrace
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            Blog
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Tipy pro moderní řízení klubu
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-base">
            Návody, case studies a funkce Sport Manageru pro trenéry a vedoucí sportovních klubů.
          </p>
        </div>

        {/* Featured article */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group mb-12 block overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-xl transition-all duration-300"
        >
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[featured.category] ?? 'bg-muted text-muted-foreground'}`}>
                <Tag className="h-3 w-3" />
                {featured.category}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(featured.date)}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {featured.readingTime}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
              {featured.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Číst článek
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Article grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-muted text-muted-foreground'}`}>
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {post.readingTime}
                  </span>
                </div>
                <h2 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(post.date)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* CTA */}
      <section className="border-t border-border/40 px-6 py-16 bg-muted/30">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Vyzkoušejte Sport Manager zdarma</h2>
          <p className="text-muted-foreground mb-6">Žádná kreditní karta. Nastavení za 2 minuty.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Registrace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-brand text-white">
              <Trophy className="h-2.5 w-2.5" />
            </div>
            <span>Sport Manager</span>
          </div>
          <div className="flex gap-4">
            <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Registrace</Link>
          </div>
          <span>© 2026 Sport Manager</span>
        </div>
      </footer>
    </div>
  );
}
