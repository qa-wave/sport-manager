import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Tag, Trophy } from 'lucide-react';
import { BLOG_POSTS, getBlogPost, getRelatedPosts } from '@/lib/blog';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://sport-manager.qawave.ai/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'Sport Manager',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sport Manager',
      url: 'https://sport-manager.qawave.ai',
    },
    mainEntityOfPage: `https://sport-manager.qawave.ai/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110 transition-all"
            >
              Začít zdarma
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na blog
        </Link>

        {/* Article header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[post.category] ?? 'bg-muted text-muted-foreground'}`}>
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">{formatDate(post.date)}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} čtení
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        </header>

        {/* Article content */}
        <article
          className="prose prose-neutral dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA inline */}
        <div className="mt-12 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
          <h3 className="font-bold text-lg mb-2">Chcete to vyzkoušet?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sport Manager je zdarma. Nastavení zabere 2 minuty.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow hover:brightness-110 transition-all hover:-translate-y-0.5"
          >
            Začít zdarma
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="border-t border-border/40 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-bold mb-8">Další články</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[p.category] ?? 'bg-muted text-muted-foreground'}`}>
                      {p.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {p.readingTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
                    {p.title}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-2 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-violet-600 text-white">
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
