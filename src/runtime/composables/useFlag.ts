import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags } from '#unleash/types'

export function useFlag(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.enabled ?? false)
}
