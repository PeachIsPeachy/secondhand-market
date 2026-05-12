import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold tracking-[0.14em] text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you’re looking for doesn’t exist or was removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
      >
        Back to marketplace
      </Link>
    </div>
  );
}
