import type { CachedFlags } from '#unleash/types'
import { useState } from '#app'
import { computed } from 'vue'

export function useFlag(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.enabled ?? false)
}
