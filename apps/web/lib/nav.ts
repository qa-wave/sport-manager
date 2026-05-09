import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import type { NavAccess } from './member-context';
import type { FeatureKey, FeatureFlags } from './features';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UserCircle,
  CreditCard,
  MessageCircle,
  Bell,
  Settings,
  Repeat,
} from 'lucide-react';

export type NavItem = {
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
  access?: NavAccess;
  /** When set, the item is hidden if the club has this feature disabled. */
  feature?: FeatureKey;
};

export const ADMIN_NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    description: 'Overview & health',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/teams',
    label: 'Teams',
    description: 'Rosters & coaching staff',
    icon: Users,
    access: 'admin_or_coach',
  },
  {
    href: '/admin/events',
    label: 'Events',
    description: 'Practices, matches, RSVPs',
    icon: CalendarDays,
    feature: 'calendar',
  },
  {
    href: '/admin/training-templates',
    label: 'Šablony',
    description: 'Opakující se tréninky',
    icon: Repeat,
    access: 'admin_or_coach',
    feature: 'trainingTemplates',
  },
  {
    href: '/admin/messages',
    label: 'Messages',
    description: 'Team chat & DMs',
    icon: MessageCircle,
    feature: 'messages',
  },
  {
    href: '/admin/notifications',
    label: 'Oznámení',
    description: 'Vaše oznámení',
    icon: Bell,
    feature: 'notifications',
  },
  {
    href: '/admin/members',
    label: 'Members',
    description: 'Players, parents, guardians',
    icon: UserCircle,
    access: 'admin',
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    description: 'Fees & Stripe activity',
    icon: CreditCard,
    access: 'admin_or_finance',
    feature: 'payments',
  },
  {
    href: '/admin/account',
    label: 'Account',
    description: 'Profile & settings',
    icon: Settings,
  },
];

/**
 * Returns true when this nav item's feature is enabled for the active club.
 * Items without a `feature` always pass.
 */
export function isNavItemFeatureEnabled(
  item: NavItem,
  flags: FeatureFlags,
): boolean {
  if (!item.feature) return true;
  return flags[item.feature];
}
