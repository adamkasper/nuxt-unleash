import type { CachedFlags } from '#unleash/types'
import { useState } from '#app'
import { computed } from 'vue'

export function useFlagsStatus() {
  const state = useState<CachedFlags>('unleash-flags')

  return {
    ready: computed(() => (state.value?.lastUpdated ?? 0) > 0),
    flagCount: computed(() => Object.keys(state.value?.toggles ?? {}).length),
  }
}
