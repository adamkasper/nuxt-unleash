import type { EvaluatedFlags, UnleashContext } from './types'
import { useState } from '#imports'

const EVALUATE_ROUTE = '/api/_unleash/evaluate'

export function useUnleashState() {
  return useState<EvaluatedFlags>('unleash-flags', () => ({ flags: {}, ready: false }))
}

export function useUnleashContextState() {
  return useState<UnleashContext>('unleash-context', () => ({}))
}

export function fetchFlags(context: UnleashContext) {
  return $fetch<EvaluatedFlags>(EVALUATE_ROUTE, {
    query: {
      userId: context.userId,
      sessionId: context.sessionId,
      properties: context.properties
        ? JSON.stringify(context.properties)
        : undefined,
    },
  })
}
