export const CATEGORIES = [
  "FOOD",
  "GROCERIES",
  "TRAVEL",
  "SHOPPING",
  "SUBSCRIPTIONS",
  "RENT",
  "EDUCATION",
  "BILLS",
  "TRANSFERS",
  "OTHER",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  FOOD: "Food",
  GROCERIES: "Groceries",
  TRAVEL: "Travel",
  SHOPPING: "Shopping",
  SUBSCRIPTIONS: "Subscriptions",
  RENT: "Rent/Hostel",
  EDUCATION: "Education",
  BILLS: "Bills",
  TRANSFERS: "Transfers to friends",
  OTHER: "Other",
};

/** Shorter labels for chips and tight rows. */
export const CATEGORY_SHORT: Record<CategoryId, string> = {
  ...CATEGORY_LABEL,
  SUBSCRIPTIONS: "Subs",
  TRANSFERS: "Friends",
};

export function isCategory(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
