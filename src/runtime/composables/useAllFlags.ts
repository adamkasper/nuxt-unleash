import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags, EvaluatedFlag } from '#unleash/types'

export function useAllFlags() {
  const state = useState<CachedFlags>('unleash-flags')
  return computed<Record<string, EvaluatedFlag>>(() => state.value?.toggles ?? {})
}
