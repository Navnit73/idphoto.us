import Link from "next/link";

/** Clear limits on what this site can promise about official photo acceptance. */
export function Disclaimer() {
  return (
    <aside aria-label="Important notice" className="rounded-lg border border-warning/40 bg-warning-subtle p-5 text-sm sm:p-6">
      <p className="font-semibold text-foreground">Not an official source</p>
      <p className="mt-2 text-muted-foreground">
        idphoto.us is independent and isn&apos;t affiliated with the U.S. Department of State, USCIS, or any government agency.
        Requirements change, and the agency that receives your application makes the final decision on whether a photo is
        accepted. Always confirm the current rules on the official source linked on this page before you apply. See our{" "}
        <Link href="/content-methodology" className="font-medium text-primary underline underline-offset-4">
          content methodology
        </Link>
        .
      </p>
    </aside>
  );
}
