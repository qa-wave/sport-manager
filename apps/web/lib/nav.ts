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
  FileSignature,
  Vote,
  FolderOpen,
  FileBarChart2,
  Upload,
  Globe,
} from 'lucide-react';

export type NavItem = {
  href: Route;
  label: string;
  /** i18n key suffix used as nav.<labelKey> — falls back to label if missing */
  labelKey?: string;
  description: string;
  icon: LucideIcon;
  access?: NavAccess;
  /** When set, the item is hidden if the club has this feature disabled. */
  feature?: FeatureKey;
  /** Visual grouping in the sidebar. Defaults to 'main'. */
  group?: 'main' | 'manage' | 'tools';
};

export const ADMIN_NAV: NavItem[] = [
  // ── main ──────────────────────────────────────────────────────────────
  {
    href: '/admin',
    label: 'Přehled',
    labelKey: 'dashboard',
    description: 'Přehled a stav klubu',
    icon: LayoutDashboard,
    group: 'main',
  },
  {
    href: '/admin/events',
    label: 'Události',
    labelKey: 'events',
    description: 'Tréninky, zápasy, RSVP',
    icon: CalendarDays,
    feature: 'calendar',
    group: 'main',
  },
  {
    href: '/admin/teams',
    label: 'Týmy',
    labelKey: 'teams',
    description: 'Soupiska a realizační tým',
    icon: Users,
    access: 'admin_or_coach',
    group: 'main',
  },
  {
    href: '/admin/messages',
    label: 'Zprávy',
    labelKey: 'messages',
    description: 'Týmový chat a přímé zprávy',
    icon: MessageCircle,
    feature: 'messages',
    group: 'main',
  },
  {
    href: '/admin/notifications',
    label: 'Oznámení',
    labelKey: 'notifications',
    description: 'Vaše oznámení',
    icon: Bell,
    feature: 'notifications',
    group: 'main',
  },
  // ── manage ────────────────────────────────────────────────────────────
  {
    href: '/admin/members',
    label: 'Členové',
    labelKey: 'members',
    description: 'Hráči, rodiče, zákonní zástupci',
    icon: UserCircle,
    access: 'admin',
    group: 'manage',
  },
  {
    href: '/admin/payments',
    label: 'Platby',
    labelKey: 'payments',
    description: 'Příspěvky a platební přehledy',
    icon: CreditCard,
    access: 'admin_or_finance',
    feature: 'payments',
    group: 'manage',
  },
  {
    href: '/admin/waivers',
    label: 'Souhlasy',
    labelKey: 'waivers',
    description: 'GDPR, zdravotní a mediální souhlasy',
    icon: FileSignature,
    access: 'admin',
    feature: 'waivers',
    group: 'manage',
  },
  {
    href: '/admin/polls',
    label: 'Hlasování',
    labelKey: 'polls',
    description: 'Ankety a časová hlasování',
    icon: Vote,
    access: 'any' as NavAccess,
    group: 'manage',
  },
  // ── tools ─────────────────────────────────────────────────────────────
  {
    href: '/admin/treninky',
    label: 'Tréninky',
    labelKey: 'training',
    description: 'Knihovna cvičení a tréninků',
    icon: Repeat,
    access: 'admin_or_coach',
    feature: 'trainingTemplates',
    group: 'tools',
  },
  {
    href: '/admin/gallery',
    label: 'Galerie',
    labelKey: 'gallery',
    description: 'Fotky z tréninků a zápasů',
    icon: Camera,
    feature: 'gallery',
    group: 'tools',
  },
  {
    href: '/admin/documents',
    label: 'Dokumenty',
    labelKey: 'documents',
    description: 'Pravidla, formuláře a dokumenty klubu',
    icon: FolderOpen,
    access: 'any' as NavAccess,
    group: 'tools',
  },
  {
    href: '/admin/federation-sync',
    label: 'Liga sync',
    labelKey: 'federationSync',
    description: 'Synchronizace rozpisu ze svazu',
    icon: Globe,
    access: 'admin',
    group: 'tools',
  },
  {
    href: '/admin/import',
    label: 'Import',
    labelKey: 'import',
    description: 'Importovat data z jiné platformy',
    icon: Upload,
    access: 'admin',
    group: 'tools',
  },
  {
    href: '/admin/activity',
    label: 'Aktivita',
    labelKey: 'activity',
    description: 'Timeline dění v klubu',
    icon: Activity,
    access: 'admin_or_coach',
    group: 'tools',
  },
  {
    href: '/admin/account',
    label: 'Účet',
    labelKey: 'account',
    description: 'Profil a nastavení',
    icon: Settings,
    group: 'tools',
  },
  {
    href: '/admin/platform-analytics',
    label: 'Platform Analytics',
    labelKey: 'platformAnalytics',
    description: 'Souhrn dat platformy',
    icon: BarChart2,
    access: 'platform_admin',
    group: 'tools',
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
