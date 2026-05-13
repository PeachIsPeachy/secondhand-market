/** Turns missing-column / stale-schema Supabase errors into actionable setup hints. */
export function humanizeSupabaseSchemaError(raw: string): string {
  const m = raw.trim();
  if (
    /does not exist/i.test(m) &&
    /\b(avatar_url|telegram|phone|profiles_\d+)\b/i.test(m)
  ) {
    return (
      "Your Supabase database is missing newer profile columns (for example avatar_url). " +
      "Open the SQL Editor and run the script in supabase/migration_profiles_avatar_contacts.sql once, then reload this page."
    );
  }
  if (
    /does not exist/i.test(m) &&
    /\blocation\b/i.test(m) &&
    /\bproducts\b/i.test(m)
  ) {
    return (
      "Your Supabase database is missing the listings location column. " +
      "Open the SQL Editor and run supabase/migration_products_location.sql once, then reload this page."
    );
  }
  return m;
}
