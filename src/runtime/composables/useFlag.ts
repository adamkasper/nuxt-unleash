import { computed } from '#imports'
import { useUnleashState } from '../state'

/**
 * Check if a feature flag is enabled.
 *
 * Returns a reactive computed ref that updates when flags are refreshed.
 * During SSR, flags are evaluated server-side so the value is immediately available
 * (unlike client-only SDKs that return `undefined` during SSR).
 *
 * @example
 * ```ts
 * const isEnabled = useFlag('my-feature')
 *
 * // In template: <div v-if="isEnabled">New feature!</div>
 * ```
 */
export function useFlag(name: string) {
  const flags = useUnleashState()
  return computed(() => flags.value.flags[name]?.enabled ?? false)
}
