import { computed } from '#imports'
import { useUnleashState } from '../state'

/**
 * Get the status of the Unleash flag evaluation.
 *
 * @example
 * ```ts
 * const { ready, flagCount } = useFlagsStatus()
 *
 * // Show loading state until flags are evaluated
 * // <template v-if="ready">...</template>
 * ```
 */
export function useFlagsStatus() {
  const flags = useUnleashState()
  return {
    ready: computed(() => flags.value.ready),
    flagCount: computed(() => Object.keys(flags.value.flags).length),
  }
}
