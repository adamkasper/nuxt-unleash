import type { UnleashContext } from '../types'
import { fetchFlags, useUnleashContextState, useUnleashState } from '../state'

/**
 * Update the Unleash evaluation context.
 *
 * When context changes (e.g. after user login), call `updateContext` to
 * re-evaluate all flags server-side with the new context. The context persists
 * across client-side polling cycles.
 *
 * @example
 * ```ts
 * const { context, updateContext } = useUnleashContext()
 *
 * // After login
 * await updateContext({ userId: user.id })
 *
 * // With custom properties
 * await updateContext({ userId: user.id, properties: { plan: 'pro' } })
 * ```
 */
export function useUnleashContext() {
  const flags = useUnleashState()
  const context = useUnleashContextState()

  async function updateContext(newContext: UnleashContext) {
    context.value = { ...context.value, ...newContext }

    try {
      flags.value = await fetchFlags(context.value)
    }
    catch (error) {
      console.error('[nuxt-unleash] Context update failed:', error)
    }
  }

  return { context, updateContext }
}
