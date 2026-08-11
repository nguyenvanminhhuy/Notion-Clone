import {
  Home,
  Star,
  Clock,
  Share2,
  Trash2,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'favorites', label: 'Favorites', icon: Star, href: '/favorites' },
  { id: 'recent', label: 'Recent', icon: Clock, href: '/recent' },
  { id: 'shared', label: 'Shared', icon: Share2, href: '/shared' },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { id: 'trash', label: 'Trash', icon: Trash2, href: '/trash' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];
