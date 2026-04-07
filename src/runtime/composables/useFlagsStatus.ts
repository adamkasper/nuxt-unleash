import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags } from '#unleash/types'

export function useFlagsStatus() {
  const state = useState<CachedFlags>('unleash-flags')

  return {
    ready: computed(() => (state.value?.lastUpdated ?? 0) > 0),
    flagCount: computed(() => Object.keys(state.value?.toggles ?? {}).length),
  }
}
