import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags, Variant } from '#unleash/types'

const DISABLED_VARIANT: Variant = { name: 'disabled', enabled: false }

export function useVariant(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.variant ?? DISABLED_VARIANT)
}
