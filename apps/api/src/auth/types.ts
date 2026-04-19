/**
 * Shape of the signed JWT access token payload.
 *
 * We intentionally keep this minimal — just identity. Role resolution happens
 * on every request via RbacService joining TeamMembership/ClubRole. Roles in
 * the token would go stale on role changes and make revocation harder.
 */
export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Refresh token payload. Refresh tokens are rotated on every use and
 * hashed-at-rest in the Session table.
 */
export interface JwtRefreshPayload {
  sub: string; // userId
  sid: string; // Session.id
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
