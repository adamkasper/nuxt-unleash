import type { Variant } from 'unleash-client'
import { computed } from '#imports'
import { useUnleashState } from '../state'

const DISABLED_VARIANT: Variant = {
  name: 'disabled',
  enabled: false,
  featureEnabled: false,
}

/**
 * Get the variant of a feature flag.
 *
 * Returns a reactive computed ref with the variant object. Useful for A/B testing
 * and multivariate flags where you need the variant name or payload.
 *
 * @example
 * ```ts
 * const variant = useVariant('experiment')
 *
 * // variant.value.name    — variant name (e.g. 'control', 'treatment-a')
 * // variant.value.enabled — whether variant is active
 * // variant.value.payload — optional { type, value } payload
 * ```
 */
export function useVariant(name: string) {
  const flags = useUnleashState()
  return computed<Variant>(() => flags.value.flags[name]?.variant ?? DISABLED_VARIANT)
}
