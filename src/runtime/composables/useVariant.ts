import type { CachedFlags, Variant } from '#unleash/types'
import { useState } from '#app'
import { computed } from 'vue'

const DISABLED_VARIANT: Readonly<Variant> = Object.freeze({ name: 'disabled', enabled: false })

export function useVariant(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.variant ?? DISABLED_VARIANT)
}
