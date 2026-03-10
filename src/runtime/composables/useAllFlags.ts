import type { EvaluatedFlag } from '../types'
import { computed } from '#imports'
import { useUnleashState } from '../state'

/**
 * Get all evaluated feature flags as a reactive record.
 *
 * Useful for debugging, logging, or when you need to iterate over all flags.
 *
 * @example
 * ```ts
 * const allFlags = useAllFlags()
 *
 * // allFlags.value → { 'my-flag': { name, enabled, variant }, ... }
 * ```
 */
export function useAllFlags() {
  const flags = useUnleashState()
  return computed<Record<string, EvaluatedFlag>>(() => flags.value.flags)
}
