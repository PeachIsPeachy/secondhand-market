"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATEGORIES, CONDITIONS, SORT_OPTIONS, type SortValue } from "@/lib/constants";

function buildQuery(
  base: URLSearchParams,
  updates: Record<string, string | undefined | null>
) {
  const next = new URLSearchParams(base.toString());
  Object.entries(updates).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") {
      next.delete(k);
    } else {
      next.set(k, v);
    }
  });
  return next.toString();
}

export function FiltersPanel({ basePath = "/" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function navigate(updates: Record<string, string | undefined | null>) {
    const q = buildQuery(params, updates);
    const path = `${basePath}${q ? `?${q}` : ""}`;
    startTransition(() => {
      router.push(path);
    });
  }

  const qVal = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const condition = params.get("condition") ?? "";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const sort = (params.get("sort") as SortValue | null) ?? "newest";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Search & filters</h2>
        {pending && (
          <span className="text-xs text-muted" aria-live="polite">
            Updating…
          </span>
        )}
      </div>

      <label className="block text-xs font-medium text-muted">
        Keywords
        <input
          key={qVal}
          defaultValue={qVal}
          name="q"
          placeholder="Search title or description"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value;
              navigate({ q: v || null });
            }
          }}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>('input[name="q"]');
          navigate({ q: input?.value || null });
        }}
        className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
      >
        Search
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Category
          <select
            value={category}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            onChange={(e) => navigate({ category: e.target.value || null })}
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-muted">
          Condition
          <select
            value={condition}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            onChange={(e) => navigate({ condition: e.target.value || null })}
          >
            <option value="">Any</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-medium text-muted">
          Min price
          <input
            key={`min-${minPrice}`}
            type="number"
            min={0}
            step="0.01"
            defaultValue={minPrice}
            onBlur={(e) => navigate({ min: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="0"
          />
        </label>

        <label className="block text-xs font-medium text-muted">
          Max price
          <input
            key={`max-${maxPrice}`}
            type="number"
            min={0}
            step="0.01"
            defaultValue={maxPrice}
            onBlur={(e) => navigate({ max: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Any"
          />
        </label>
        <p className="text-[11px] leading-snug text-muted sm:col-span-2">
          Price filters use USD (stored currency). Card prices reflect your display currency in
          the header.
        </p>
      </div>

      <label className="block text-xs font-medium text-muted">
        Sort
        <select
          value={sort}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          onChange={(e) => navigate({ sort: e.target.value })}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="w-full rounded-lg border border-border bg-surface py-2 text-sm font-medium text-muted transition-colors hover:border-primary/30 hover:bg-primary-subtle/50 hover:text-foreground"
        onClick={() =>
          navigate({
            q: null,
            category: null,
            condition: null,
            min: null,
            max: null,
            sort: "newest",
          })
        }
      >
        Clear filters
      </button>
    </div>
  );
}
