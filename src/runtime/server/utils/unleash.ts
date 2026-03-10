import type { Unleash } from 'unleash-client'
import type { EvaluatedFlags, UnleashContext } from '../../types'

const KEY = '__nuxt_unleash_instance__'

export function setUnleashInstance(instance: Unleash) {
  ;(globalThis as Record<string, unknown>)[KEY] = instance
}

export function getUnleashInstance(): Unleash | null {
  return ((globalThis as Record<string, unknown>)[KEY] as Unleash) || null
}

export function evaluateAllFlags(instance: Unleash, context: UnleashContext): EvaluatedFlags {
  const toggles = instance.getFeatureToggleDefinitions()
  const flags: EvaluatedFlags = { flags: {}, ready: true }

  for (const toggle of toggles) {
    flags.flags[toggle.name] = {
      name: toggle.name,
      enabled: instance.isEnabled(toggle.name, context),
      variant: instance.getVariant(toggle.name, context),
    }
  }

  return flags
}
