import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import type { NavAccess } from './member-context';
import type { FeatureKey, FeatureFlags } from './features';
import {
  Activity,
  LayoutDashboard,
  Users,
  CalendarDays,
  UserCircle,
  CreditCard,
  MessageCircle,
  Bell,
  Settings,
  Repeat,
  Camera,
  BarChart2,
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
    label: 'Přehled',
    description: 'Přehled a stav klubu',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/teams',
    label: 'Týmy',
    description: 'Soupiska a realizační tým',
    icon: Users,
    access: 'admin_or_coach',
  },
  {
    href: '/admin/events',
    label: 'Události',
    description: 'Tréninky, zápasy, RSVP',
    icon: CalendarDays,
    feature: 'calendar',
  },
  {
    href: '/admin/treninky',
    label: 'Tréninky',
    description: 'Knihovna cvičení a tréninků',
    icon: Repeat,
    access: 'admin_or_coach',
    feature: 'trainingTemplates',
  },
  {
    href: '/admin/gallery',
    label: 'Galerie',
    description: 'Fotky z tréninků a zápasů',
    icon: Camera,
    feature: 'gallery',
  },
  {
    href: '/admin/messages',
    label: 'Zprávy',
    description: 'Týmový chat a přímé zprávy',
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
    href: '/admin/activity',
    label: 'Aktivita',
    description: 'Timeline dění v klubu',
    icon: Activity,
    access: 'admin_or_coach',
  },
  {
    href: '/admin/members',
    label: 'Členové',
    description: 'Hráči, rodiče, zákonní zástupci',
    icon: UserCircle,
    access: 'admin',
  },
  {
    href: '/admin/payments',
    label: 'Platby',
    description: 'Příspěvky a platební přehledy',
    icon: CreditCard,
    access: 'admin_or_finance',
    feature: 'payments',
  },
  {
    href: '/admin/account',
    label: 'Účet',
    description: 'Profil a nastavení',
    icon: Settings,
  },
  {
    href: '/admin/platform-analytics',
    label: 'Platform Analytics',
    description: 'Souhrn dat platformy',
    icon: BarChart2,
    access: 'platform_admin',
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
