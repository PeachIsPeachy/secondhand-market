export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function categoryLabel(value: string) {
  const map: Record<string, string> = {
    electronics: "Electronics",
    fashion: "Fashion",
    home: "Home & garden",
    sports: "Sports & outdoors",
    books: "Books & media",
    toys: "Toys & games",
    other: "Other",
  };
  return map[value] ?? value;
}

export function conditionLabel(value: string) {
  const map: Record<string, string> = {
    new: "New",
    like_new: "Like new",
    used: "Used",
    damaged: "Damaged",
  };
  return map[value] ?? value;
}
