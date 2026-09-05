import { describe, expect, it } from "vitest";
import {
  assertSafeUrl,
  authenticationSensitiveValues,
  redactHtmlEvidence,
  redactSecrets
} from "../../packages/core/src/index.js";

describe("URL and secret policy", () => {
  it("rejects dangerous schemes and cloud metadata even when private access is enabled", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toThrow("scheme");
    await expect(
      assertSafeUrl("http://169.254.169.254/latest/meta-data", true)
    ).rejects.toThrow("metadata");
  });

  it("makes private access explicit", async () => {
    await expect(assertSafeUrl("http://127.0.0.1:4173")).rejects.toThrow(
      "Private"
    );
    await expect(
      assertSafeUrl("http://127.0.0.1:4173", true)
    ).resolves.toBeInstanceOf(URL);
  });

  it("redacts credential-shaped output", () => {
    expect(
      redactSecrets("Authorization: Bearer abc.def Cookie=session-secret")
    ).toBe("Authorization: [REDACTED] Cookie: [REDACTED]");
    expect(redactSecrets("reflected custom-value", ["custom-value"])).toBe(
      "reflected [REDACTED]"
    );
  });

  it("redacts signed URL parameters, JWTs, and common token formats", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123";
    const value = `https://example.test/file?X-Amz-Signature=top-secret&token=second-secret ${jwt} ghp_abcdefghijklmnopqrstuvwxyz123456`;
    const redacted = redactSecrets(value);
    expect(redacted).not.toContain("top-secret");
    expect(redacted).not.toContain("second-secret");
    expect(redacted).not.toContain(jwt);
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
  });

  it("removes form values and data attributes from DOM evidence", () => {
    const redacted = redactHtmlEvidence(
      '<input value="private@example.test" data-session="abc" aria-label="Email">'
    );
    expect(redacted).not.toContain("private@example.test");
    expect(redacted).not.toContain('data-session="abc"');
    expect(redacted).toContain('aria-label="Email"');
  });

  it("extracts exact header and storage-state values for report redaction", async () => {
    await expect(
      authenticationSensitiveValues(
        { "x-preview-key": "header-secret" },
        {
          cookies: [{ name: "session", value: "cookie-secret" }],
          origins: [
            {
              origin: "https://example.test",
              localStorage: [{ name: "token", value: "storage-secret" }]
            }
          ]
        }
      )
    ).resolves.toEqual(["header-secret", "cookie-secret", "storage-secret"]);
  });
});
