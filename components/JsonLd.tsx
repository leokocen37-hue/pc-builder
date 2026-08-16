// → put this at: components/JsonLd.tsx
// One place for the dangerouslySetInnerHTML + XSS-safe escaping, instead of
// repeating it at every call site that emits structured data.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
