import { createHash } from "node:crypto";

const VOLATILE_QUERY_KEYS = new Set([
  "_",
  "cache",
  "cacheBust",
  "cb",
  "timestamp"
]);
const GENERATED_ID =
  /^(?:[a-f0-9]{8,}|[0-9]{3,}|[a-z_-]*(?:react|radix|headless|mui|chakra)[a-z_-]*[0-9:_-]+|[0-9a-f]{8}-[0-9a-f-]{27,})$/i;

export function normalizeRoute(value: string): string {
  try {
    const url = new URL(value, "http://a11y-agent.invalid");
    const entries = [...url.searchParams.entries()]
      .filter(
        ([key]) =>
          !key.toLowerCase().startsWith("utm_") && !VOLATILE_QUERY_KEYS.has(key)
      )
      .sort(
        ([aKey, aValue], [bKey, bValue]) =>
          aKey.localeCompare(bKey) || aValue.localeCompare(bValue)
      );
    const query = new URLSearchParams(entries).toString();
    const path = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
    return query ? `${path}?${query}` : path;
  } catch {
    return value.trim() || "/";
  }
}

export function normalizeTargetPath(target: string): string {
  return target
    .trim()
    .replace(/\s+/g, " ")
    .replace(/#([A-Za-z0-9_:.-]+)/g, (match, id: string) =>
      GENERATED_ID.test(id) ? "[id]" : match
    )
    .replace(
      /\[id=(?:"([^"]+)"|'([^']+)')\]/g,
      (
        match,
        doubleQuoted: string | undefined,
        singleQuoted: string | undefined
      ) => {
        const id = doubleQuoted ?? singleQuoted ?? "";
        return GENERATED_ID.test(id) ? "[id]" : match;
      }
    );
}

export function createFindingFingerprint(input: {
  route: string;
  stateLabel: string;
  ruleId: string;
  target: string;
}): string {
  const material = [
    normalizeRoute(input.route),
    input.stateLabel.trim().toLowerCase(),
    input.ruleId.trim().toLowerCase(),
    normalizeTargetPath(input.target)
  ].join("\0");
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}
