/**
 * Cambodia provinces + representative cities / districts for marketplace location pickers.
 * Stored profile & listing location format: "City, Province, Cambodia", or "Province, Cambodia"
 * when city equals province (e.g. Phnom Penh municipality-wide).
 */

export const CAMBODIA_PROVINCE_CITIES: Record<string, readonly string[]> = {
  "Phnom Penh": [
    "Phnom Penh",
    "Chamkar Mon",
    "Daun Penh",
    "Tuol Kouk",
    "Boeung Keng Kang",
    "Prampir Meakkakra",
    "Dangkao",
    "Mean Chey",
    "Russey Keo",
    "Sen Sok",
    "Por Sen Chey",
    "Prek Pnov",
    "Chroy Changvar",
  ],
  "Banteay Meanchey": [
    "Serei Saophoan",
    "Poipet",
    "Malai",
    "Preah Net Preah",
    "Ou Chrov",
    "Thma Puok",
  ],
  Battambang: [
    "Battambang",
    "Banan",
    "Moung Ruessei",
    "Rotanak Mondol",
    "Sangkae",
    "Thma Koul",
    "Kamrieng",
  ],
  "Kampong Cham": [
    "Kampong Cham",
    "Batheay",
    "Cheung Prey",
    "Kang Meas",
    "Prey Chhor",
    "Stung Trang",
    "Kampong Siem",
  ],
  "Kampong Chhnang": [
    "Kampong Chhnang",
    "Cholkiri",
    "Kampong Tralach",
    "Rolea B'ier",
    "Sameakki Mean Chey",
    "Teuk Phos",
  ],
  "Kampong Speu": [
    "Chbar Mon",
    "Baset",
    "Kong Pisei",
    "Phnom Sruoch",
    "Samraong Tong",
    "Thpong",
  ],
  "Kampong Thom": [
    "Stung Saen",
    "Baray",
    "Kampong Svay",
    "Prasat Ballangk",
    "Sandan",
    "Stoung",
  ],
  Kampot: ["Kampot", "Dang Tong", "Chhouk", "Chum Kiri", "Teuk Chhou"],
  Kandal: ["Ta Khmau", "Angk Snuol", "Kien Svay", "Khsach Kandal", "Leuk Dek", "Ponhea Leu"],
  "Koh Kong": ["Khemarak Phoumin", "Botum Sakor", "Mondul Seima", "Srae Ambel", "Thma Bang"],
  Kratié: ["Kratié", "Chhloung", "Prek Prasab", "Snuol", "Chetr Borei"],
  Mondulkiri: ["Sen Monorom", "Kaoh Nheaek", "Ou Reang", "Pech Chreada"],
  "Oddar Meanchey": ["Samraong", "Anlong Veng", "Banteay Ampil", "Chong Kal", "Trapeang Prasat"],
  Pailin: ["Pailin", "Sala Krau"],
  "Preah Sihanouk": [
    "Sihanoukville",
    "Prey Nob",
    "Stung Hav",
    "Kampong Seila",
    "Kaoh Rung",
  ],
  "Preah Vihear": ["Tbeng Meanchey", "Chey Saen", "Choam Khsant", "Kuleaen", "Rovieng"],
  Pursat: ["Pursat", "Bakan", "Krakor", "Phnum Kravanh", "Veal Veng"],
  "Prey Veng": ["Prey Veng", "Ba Phnum", "Kampong Trabaek", "Me Sang", "Peam Chor", "Peam Ro"],
  Ratanakiri: ["Banlung", "Andoung Meas", "Lumphat", "Ou Chum", "Ou Ya Dav", "Ta Veaeng"],
  "Siem Reap": [
    "Siem Reap",
    "Angkor Chum",
    "Angkor Thom",
    "Banteay Srei",
    "Chi Kraeng",
    "Puok",
    "Svay Leu",
    "Varin",
  ],
  "Stung Treng": ["Stung Treng", "Sesan", "Siem Bouk", "Siem Pang", "Thala Barivat"],
  "Svay Rieng": ["Svay Rieng", "Bavet", "Chantrea", "Romeas Haek", "Rumduol"],
  Takéo: ["Doun Kaev", "Angkor Borei", "Bati", "Don Keo", "Kiri Vong", "Tram Kak"],
  "Tboung Khmum": ["Suong", "Dambae", "Memot", "Ou Reang Ov", "Ponhea Kraek"],
};

export const CAMBODIA_PROVINCES = [
  "Phnom Penh",
  ...Object.keys(CAMBODIA_PROVINCE_CITIES)
    .filter((p) => p !== "Phnom Penh")
    .sort((a, b) => a.localeCompare(b)),
];

export function citiesForProvince(province: string): readonly string[] {
  return CAMBODIA_PROVINCE_CITIES[province] ?? [];
}

/** Persisted string for DB (profile + listings). */
export function formatKhLocation(province: string, city: string): string | null {
  const p = province.trim();
  const c = city.trim();
  if (!p || !c) return null;
  return `${c}, ${p}, Cambodia`;
}

export function parseKhLocation(stored: string | null | undefined): {
  province: string;
  city: string;
} | null {
  const t = typeof stored === "string" ? stored.trim() : "";
  if (!t) return null;
  const lower = t.toLowerCase();
  if (!lower.endsWith(", cambodia")) return null;
  const inner = t.slice(0, -", Cambodia".length).trim();
  const segments = inner
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.length === 1) {
    const place = segments[0];
    if (CAMBODIA_PROVINCE_CITIES[place]) return { province: place, city: place };
    return null;
  }
  const province = segments[segments.length - 1];
  const city = segments.slice(0, -1).join(", ");
  if (!province || !city) return null;
  if (!CAMBODIA_PROVINCE_CITIES[province]) return null;
  return { province, city };
}

/** Buyer-facing line (avoids "Phnom Penh, Phnom Penh, Cambodia"). */
export function displayKhLocation(stored: string | null | undefined): string {
  const t = typeof stored === "string" ? stored.trim() : "";
  if (!t) return "";
  const parsed = parseKhLocation(t);
  if (!parsed) return t;
  if (parsed.city === parsed.province) return `${parsed.city}, Cambodia`;
  return `${parsed.city}, ${parsed.province}, Cambodia`;
}
