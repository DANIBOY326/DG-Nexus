import {
  Briefcase,
  Home,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

/**
 * Canonical Phase 1 Information Architecture (DG NEXUS Responsive Design Spec).
 * Progressive Phase 2-5 pillars (Communities, Learn, Mentorship, Workspace)
 * slot into this registry behind feature flags without changing shell chrome.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "Network", href: "/network", icon: Users },
  { label: "Nexus AI", href: "/ai", icon: Sparkles },
  { label: "Profile", href: "/profile", icon: User },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/home") {
    return pathname === "/home" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
