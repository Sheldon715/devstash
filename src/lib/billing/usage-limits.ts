import type { Plan } from "../../../generated/prisma/enums";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export interface UsageLimitResult {
  allowed: boolean;
  message: string | null;
}

export function isProPlan(plan: Plan | string | null | undefined) {
  return plan === "PRO";
}

export function canCreateItem(
  plan: Plan | string | null | undefined,
  totalItems: number,
): UsageLimitResult {
  if (isProPlan(plan) || totalItems < FREE_ITEM_LIMIT) {
    return {
      allowed: true,
      message: null,
    };
  }

  return {
    allowed: false,
    message: "Free workspaces can save up to 50 items. Upgrade to Pro to save more.",
  };
}

export function canCreateCollection(
  plan: Plan | string | null | undefined,
  totalCollections: number,
): UsageLimitResult {
  if (isProPlan(plan) || totalCollections < FREE_COLLECTION_LIMIT) {
    return {
      allowed: true,
      message: null,
    };
  }

  return {
    allowed: false,
    message: "Free workspaces can create up to 3 collections. Upgrade to Pro to create more.",
  };
}
