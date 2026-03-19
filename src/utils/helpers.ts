import { translator } from "./Translator";

/**
 * Laravel-style translation helper
 * Usage: __('messages.welcome', { name: 'Dayle' })
 */
export function __(
  key: string,
  replacements: Record<string, string> = {},
): string {
  return translator.translate(key, replacements);
}
