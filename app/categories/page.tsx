import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Categories</h1>
      <p className="mt-2 text-sm text-muted">
        Jump into a category to browse curated second-hand listings.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.value}>
            <Link
              href={`/?category=${encodeURIComponent(c.value)}`}
              className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-px hover:border-primary/30 hover:shadow-md"
            >
              <span className="text-base font-semibold text-foreground">{c.label}</span>
              <span className="mt-1 text-xs font-medium text-primary">View listings →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
