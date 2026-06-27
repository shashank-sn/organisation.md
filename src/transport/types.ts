export const TRANSPORT_MODES = ["stdio", "sse"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export interface SseOptions {
  port: number;
}

/**
 * Parse the TRANSPORT env var into a TransportMode.
 * Defaults to "stdio" when unset or invalid.
 */
export function parseTransportMode(env?: string): TransportMode {
  if (env && TRANSPORT_MODES.includes(env as TransportMode)) {
    return env as TransportMode;
  }
  return "stdio";
}

/**
 * Parse the PORT env var into a number.
 * Defaults to 3000 when unset or invalid.
 */
export function parsePort(env?: string): number {
  if (env) {
    const parsed = parseInt(env, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
  }
  return 3000;
}
