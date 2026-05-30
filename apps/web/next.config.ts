import type { NextConfig } from 'next';
import { join } from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework via the X-Powered-By header (security hardening).
  poweredByHeader: false,
  transpilePackages: ['@sport-manager/contracts', '@sport-manager/db'],
  typedRoutes: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '*.pravatar.cc' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  // Pin workspace root to the monorepo root so Next doesn't walk up to
  // /Users/tm/package-lock.json and misdetect the workspace.
  outputFileTracingRoot: join(__dirname, '../..'),
  // Server-only packages — don't bundle into client
  serverExternalPackages: ['@prisma/client', 'ioredis', 'bcrypt'],
  // Standalone output for self-hosted deploy
  output: 'standalone',
  // TS errors now block the build (dead sentry/arcjet files removed, tests
  // excluded from build typecheck). ESLint stays ignored until a config is
  // added — `lint` is currently a no-op (tracked separately).
  eslint: { ignoreDuringBuilds: true },
};

export default config;
