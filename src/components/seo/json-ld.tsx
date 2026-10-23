import type { Thing } from "schema-dts";

/** Renders structured data. `<` is escaped so content can't close the script tag. */
export function JsonLd({ data }: { data: Thing | Thing[] }) {
  const graph = Array.isArray(data) ? data : [data];
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
