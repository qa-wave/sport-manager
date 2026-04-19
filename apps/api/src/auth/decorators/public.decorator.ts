import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler as public (unauthenticated). Use sparingly:
 * auth endpoints, health, guest-facing public pages.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
