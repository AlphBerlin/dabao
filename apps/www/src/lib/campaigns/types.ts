/**
 * Campaign types and utilities
 */

/**
 * Campaign status enum
 */
export enum CampaignStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED"
}

/**
 * Campaign type enum
 */
export enum CampaignType {
  WELCOME = "WELCOME",
  REFERRAL = "REFERRAL",
  POINTS_MULTIPLIER = "POINTS_MULTIPLIER",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  PROMOTION = "PROMOTION",
  SPECIAL_EVENT = "SPECIAL_EVENT",
  HOLIDAY = "HOLIDAY",
  CUSTOM = "CUSTOM"
}

/**
 * Helper function to check if a campaign is active
 * @param status - The campaign status
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns boolean - Whether the campaign is active
 */
export function isCampaignActive(
  status: CampaignStatus,
  startDate?: Date | null,
  endDate?: Date | null
): boolean {
  if (status !== CampaignStatus.ACTIVE) {
    return false;
  }

  const now = new Date();

  // Check if campaign has started
  if (startDate && now < startDate) {
    return false;
  }

  // Check if campaign has ended
  if (endDate && now > endDate) {
    return false;
  }

  return true;
}
