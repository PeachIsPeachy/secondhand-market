"use client";

import {
  CAMBODIA_PROVINCES,
  citiesForProvince,
} from "@/lib/data/cambodia-locations";

export function CambodiaLocationSelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
  provinceId = "kh-province",
  cityId = "kh-city",
}: {
  province: string;
  city: string;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  provinceId?: string;
  cityId?: string;
}) {
  const cities = province ? [...citiesForProvince(province)] : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={provinceId} className="block text-xs font-medium text-muted">
          Province
        </label>
        <select
          id={provinceId}
          value={province}
          onChange={(e) => {
            const next = e.target.value;
            onProvinceChange(next);
            if (!next) {
              onCityChange("");
              return;
            }
            const opts = citiesForProvince(next);
            if (opts.includes(city)) return;
            onCityChange(opts[0] ?? "");
          }}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <option value="">Select province</option>
          {CAMBODIA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={cityId} className="block text-xs font-medium text-muted">
          City / district
        </label>
        <select
          id={cityId}
          value={city}
          disabled={!province}
          onChange={(e) => onCityChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">{province ? "Select city or district" : "Choose province first"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
