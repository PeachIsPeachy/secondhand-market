export const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home", label: "Home & garden" },
  { value: "sports", label: "Sports & outdoors" },
  { value: "books", label: "Books & media" },
  { value: "toys", label: "Toys & games" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "used", label: "Used" },
  { value: "damaged", label: "Damaged" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type ConditionValue = (typeof CONDITIONS)[number]["value"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
