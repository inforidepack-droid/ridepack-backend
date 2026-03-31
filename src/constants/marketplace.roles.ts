/**
 * Users who can book trips, publish trips, save cards, and use Stripe Connect.
 * Excludes `admin` (platform operator, not a marketplace participant).
 */
export const MARKETPLACE_PARTICIPANT_ROLES = ["user", "sender", "rider"] as const;

export const isMarketplaceParticipantRole = (role: string | undefined): boolean =>
  role !== undefined &&
  (MARKETPLACE_PARTICIPANT_ROLES as readonly string[]).includes(role);
