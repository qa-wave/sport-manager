import type { BadgeProps } from '@/components/ui/badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export const ROLE_VARIANT: Record<string, BadgeVariant> = {
  PLAYER: 'default',
  HEAD_COACH: 'success',
  ASSISTANT_COACH: 'info',
  TEAM_MANAGER: 'warning',
  MEDIC: 'danger',
  OWNER: 'success',
  ADMIN: 'success',
  FINANCE: 'warning',
  COMMUNICATIONS: 'info',
};

export const PAYMENT_VARIANT: Record<string, BadgeVariant> = {
  PAID: 'success',
  PENDING: 'warning',
  PROCESSING: 'info',
  FAILED: 'danger',
  REFUNDED: 'default',
};

export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  SUSPENDED: 'danger',
  ARCHIVED: 'outline',
};

export const RSVP_VARIANT: Record<string, BadgeVariant> = {
  YES: 'success',
  NO: 'danger',
  MAYBE: 'warning',
  PENDING: 'default',
};

export const EVENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  PRACTICE: 'default',
  MATCH: 'success',
  TOURNAMENT: 'info',
  MEETING: 'warning',
  SOCIAL: 'outline',
};
