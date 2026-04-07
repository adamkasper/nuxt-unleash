import type { CachedFlags, EvaluatedFlag } from '#unleash/types'
import { useState } from '#app'
import { computed } from 'vue'

export function useAllFlags() {
  const state = useState<CachedFlags>('unleash-flags')
  return computed<Record<string, EvaluatedFlag>>(() => state.value?.toggles ?? {})
}
