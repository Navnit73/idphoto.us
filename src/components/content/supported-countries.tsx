import { flagEmoji, PHOTO_COUNTRIES } from "@/lib/photo/countries";

/** Every spec the editor supports, read from the same list as the country picker so it can't drift. */
export function SupportedCountries() {
  return (
    <section aria-labelledby="countries-heading" className="flex flex-col gap-4">
      <h2 id="countries-heading" className="font-display text-2xl font-semibold tracking-tight">
        Supported countries
      </h2>
      <p className="text-muted-foreground">
        {PHOTO_COUNTRIES.length} photo specs. The size shown is the pixel size of the finished photo.
      </p>
      <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-3">
        {PHOTO_COUNTRIES.map((country) => (
          <li key={country.code} className="flex items-center gap-3 rounded-lg border bg-surface-raised px-3 py-2">
            <span aria-hidden="true" className="text-xl leading-none">
              {flagEmoji(country.code)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{country.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {country.width} × {country.height}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
