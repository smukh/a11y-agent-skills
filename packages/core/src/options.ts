import type { BrowserContextOptions } from "playwright";
import type { AuditReport, KeyboardJourney } from "./schema.js";

export type BrowserName = "chromium" | "firefox" | "webkit";

export interface SharedBrowserOptions {
  browserName?: BrowserName;
  viewport?: { width: number; height: number };
  timeoutMs?: number;
  storageState?: BrowserContextOptions["storageState"];
  headers?: Record<string, string>;
  reducedMotion?: boolean;
  allowPrivateNetwork?: boolean;
  maxRedirects?: number;
  stateLabel?: string;
  readySelector?: string;
}

export interface ScanPageOptions extends SharedBrowserOptions {
  url: string;
  routeLabel?: string;
  wcagTags?: string[];
  include?: string[];
  exclude?: string[];
}

export interface ScanHtmlOptions {
  html: string;
  fileLabel?: string;
  stateLabel?: string;
  viewport?: { width: number; height: number };
  browserName?: BrowserName;
  wcagTags?: string[];
  include?: string[];
  exclude?: string[];
  timeoutMs?: number;
  reducedMotion?: boolean;
}

export interface VerifyRepairOptions extends Omit<
  ScanPageOptions,
  "stateLabel"
> {
  baseline: AuditReport;
  targetFingerprints?: string[];
  stateLabel?: string;
}

export interface RunKeyboardJourneyOptions extends SharedBrowserOptions {
  url: string;
  journey: KeyboardJourney;
}
