import type { NextConfig } from 'next';
import { join } from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@club/contracts', '@club/db'],
  typedRoutes: true,
  // Pin workspace root to the monorepo root so Next doesn't walk up to
  // /Users/tm/package-lock.json and misdetect the workspace.
  outputFileTracingRoot: join(__dirname, '../..'),
  // Server-only packages — don't bundle into client
  serverExternalPackages: ['@prisma/client', 'ioredis', 'bcrypt'],
  // Standalone output for self-hosted deploy
  output: 'standalone',
};

export default config;
