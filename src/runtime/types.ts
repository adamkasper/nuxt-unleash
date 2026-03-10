import type { Variant } from 'unleash-client'

export type { Variant } from 'unleash-client'

export interface UnleashContext {
  userId?: string
  sessionId?: string
  remoteAddress?: string
  environment?: string
  appName?: string
  currentTime?: Date
  properties?: Record<string, string>
}

export interface EvaluatedFlag {
  name: string
  enabled: boolean
  variant: Variant
}

export interface EvaluatedFlags {
  flags: Record<string, EvaluatedFlag>
  ready: boolean
}
