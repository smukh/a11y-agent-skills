import { lookup } from "node:dns/promises";
import { readFile } from "node:fs/promises";
import ipaddr from "ipaddr.js";

const METADATA_HOSTS = new Set([
  "169.254.169.254",
  "100.100.100.200",
  "metadata.google.internal",
  "metadata.azure.internal"
]);

const BLOCKED_RANGES = new Set([
  "unspecified",
  "broadcast",
  "multicast",
  "linkLocal",
  "loopback",
  "private",
  "reserved",
  "carrierGradeNat",
  "uniqueLocal"
]);

export class UnsafeUrlError extends Error {
  override name = "UnsafeUrlError";
}

function addressIsPrivate(address: string): boolean {
  const parsed = ipaddr.parse(address);
  const ipv6 = parsed.kind() === "ipv6" ? (parsed as ipaddr.IPv6) : undefined;
  const normalized = ipv6?.isIPv4MappedAddress()
    ? ipv6.toIPv4Address()
    : parsed;
  return BLOCKED_RANGES.has(normalized.range());
}

export async function assertSafeUrl(
  rawUrl: string,
  allowPrivateNetwork = false
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("URL is not valid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError(
      `URL scheme ${url.protocol || "(missing)"} is not allowed.`
    );
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("Credentials in URLs are not allowed.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (METADATA_HOSTS.has(hostname)) {
    throw new UnsafeUrlError("Cloud metadata endpoints are always blocked.");
  }
  let addresses: string[];
  try {
    addresses = ipaddr.isValid(hostname)
      ? [hostname]
      : (await lookup(hostname, { all: true, verbatim: true })).map(
          (result) => result.address
        );
  } catch {
    throw new UnsafeUrlError("Host could not be resolved safely.");
  }
  if (!allowPrivateNetwork && addresses.some(addressIsPrivate)) {
    throw new UnsafeUrlError(
      "Private, loopback, link-local, and reserved network destinations are blocked."
    );
  }
  if (addresses.some((address) => METADATA_HOSTS.has(address))) {
    throw new UnsafeUrlError("Cloud metadata endpoints are always blocked.");
  }
  return url;
}

const AUTH_PATTERN =
  /\b(authorization|proxy-authorization)\b\s*[:=]\s*(?:(?:Bearer|Basic)\s+)?[^\s,;]+/gi;
const SECRET_PATTERN = /\b(cookie|set-cookie|x-api-key)\b\s*[:=]\s*[^\s,;]+/gi;
const BEARER_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+\/-]+=*/gi;
const SECRET_QUERY_PATTERN =
  /([?&](?:(?:x-amz-|x-goog-)?(?:access[_-]?token|api[_-]?key|key|token|secret|signature|sig|credential|password|passwd|session|jwt|code))=)[^&#\s"'<>]+/gi;
const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const KNOWN_TOKEN_PATTERN =
  /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g;
const SENSITIVE_HTML_ATTRIBUTE_PATTERN =
  /\s(value|nonce|data-[\w:.-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

export function redactSecrets(
  value: string,
  sensitiveValues: string[] = []
): string {
  const patternRedacted = value
    .replace(AUTH_PATTERN, "$1: [REDACTED]")
    .replace(SECRET_PATTERN, "$1: [REDACTED]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(SECRET_QUERY_PATTERN, "$1[REDACTED]")
    .replace(JWT_PATTERN, "[REDACTED TOKEN]")
    .replace(KNOWN_TOKEN_PATTERN, "[REDACTED TOKEN]");
  return [...new Set(sensitiveValues)]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)
    .reduce(
      (redacted, sensitive) => redacted.split(sensitive).join("[REDACTED]"),
      patternRedacted
    );
}

export function redactHtmlEvidence(
  value: string,
  sensitiveValues: string[] = []
): string {
  return redactSecrets(
    value.replace(SENSITIVE_HTML_ATTRIBUTE_PATTERN, ' $1="[REDACTED]"'),
    sensitiveValues
  );
}

interface SerializedStorageState {
  cookies?: Array<{ value?: unknown }>;
  origins?: Array<{ localStorage?: Array<{ value?: unknown }> }>;
}

function valuesFromStorageState(state: unknown): string[] {
  if (!state || typeof state !== "object") return [];
  const candidate = state as SerializedStorageState;
  return [
    ...(candidate.cookies ?? []).map((cookie) => cookie.value),
    ...(candidate.origins ?? []).flatMap((origin) =>
      (origin.localStorage ?? []).map((entry) => entry.value)
    )
  ].filter((value): value is string => typeof value === "string");
}

export async function authenticationSensitiveValues(
  headers: Record<string, string> | undefined,
  storageState: unknown
): Promise<string[]> {
  const headerValues = Object.values(headers ?? {});
  if (typeof storageState === "string") {
    try {
      const parsed = JSON.parse(
        await readFile(storageState, "utf8")
      ) as unknown;
      return [...headerValues, ...valuesFromStorageState(parsed)];
    } catch {
      return headerValues;
    }
  }
  return [...headerValues, ...valuesFromStorageState(storageState)];
}

export function authenticationMode(
  headers: Record<string, string> | undefined,
  storageState: unknown
): "none" | "headers" | "storage-state" | "headers-and-storage-state" {
  if (headers && Object.keys(headers).length > 0 && storageState)
    return "headers-and-storage-state";
  if (headers && Object.keys(headers).length > 0) return "headers";
  if (storageState) return "storage-state";
  return "none";
}
