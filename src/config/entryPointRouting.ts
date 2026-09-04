import { buildAuthUrl } from '../lib/authIntent.js';

export type EntryPointKey =
  | 'NAV_WEDDINGS'
  | 'NAV_MOMENTS'
  | 'NAV_GET_STARTED'
  | 'HERO_WEDDINGS'
  | 'HERO_MOMENTS'
  | 'PRODUCT_CARD_WEDDINGS'
  | 'PRODUCT_CARD_MOMENTS'
  | 'FINAL_CTA';

export interface EntryPointRule {
  key: EntryPointKey;
  label: string;
  authenticatedDestination: string;
  unauthenticatedDestination: string;
}

export const ENTRY_POINT_ROUTING_TABLE: Record<EntryPointKey, EntryPointRule> = {
  NAV_WEDDINGS: {
    key: 'NAV_WEDDINGS',
    label: 'Nav "Weddings"',
    authenticatedDestination: '/weddings',
    unauthenticatedDestination: '/weddings',
  },
  NAV_MOMENTS: {
    key: 'NAV_MOMENTS',
    label: 'Nav "Moments"',
    authenticatedDestination: '/love-stories',
    unauthenticatedDestination: '/love-stories',
  },
  NAV_GET_STARTED: {
    key: 'NAV_GET_STARTED',
    label: 'Nav "Get Started" Pill',
    authenticatedDestination: '/hub',
    unauthenticatedDestination: buildAuthUrl('/hub', false),
  },
  HERO_WEDDINGS: {
    key: 'HERO_WEDDINGS',
    label: 'Hero CTA (Weddings Slide)',
    authenticatedDestination: '/weddings/create',
    unauthenticatedDestination: buildAuthUrl('/weddings/create', false),
  },
  HERO_MOMENTS: {
    key: 'HERO_MOMENTS',
    label: 'Hero CTA (Moments Slide)',
    authenticatedDestination: '/pricing',
    unauthenticatedDestination: buildAuthUrl('/pricing', false),
  },
  PRODUCT_CARD_WEDDINGS: {
    key: 'PRODUCT_CARD_WEDDINGS',
    label: 'Product Card "Create Now" (Weddings)',
    authenticatedDestination: '/weddings/create',
    unauthenticatedDestination: buildAuthUrl('/weddings/create', false),
  },
  PRODUCT_CARD_MOMENTS: {
    key: 'PRODUCT_CARD_MOMENTS',
    label: 'Product Card "Create Now" (Moments)',
    authenticatedDestination: '/pricing',
    unauthenticatedDestination: buildAuthUrl('/pricing', false),
  },
  FINAL_CTA: {
    key: 'FINAL_CTA',
    label: 'Final CTA Section "Get Started"',
    authenticatedDestination: '/hub',
    unauthenticatedDestination: buildAuthUrl('/hub', false),
  },
};

/**
 * Single Source of Truth helper for resolving entry point navigation target
 */
export function getEntryPointPath(key: EntryPointKey, isAuthenticated: boolean): string {
  const rule = ENTRY_POINT_ROUTING_TABLE[key];
  if (!rule) {
    return isAuthenticated ? '/hub' : buildAuthUrl('/hub', false);
  }
  return isAuthenticated ? rule.authenticatedDestination : rule.unauthenticatedDestination;
}
