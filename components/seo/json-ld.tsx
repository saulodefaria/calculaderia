type JsonLdProps = {
  /**
   * JSON-LD object (will be stringified).
   * Keep this data server-generated when possible to avoid hydration issues.
   */
  data: unknown;
  /**
   * Optional id attribute for dedup/debugging.
   */
  id?: string;
};

function safeJsonLdStringify(data: unknown): string {
  // Prevent `</script>` injection by escaping "<" characters.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      {...(id ? { id } : {})}
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}
