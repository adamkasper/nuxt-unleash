export interface Variant {
  name: string
  enabled: boolean
  payload?: { type: string; value: string }
}

export interface EvaluatedFlag {
  name: string
  enabled: boolean
  variant: Variant
}

export interface CachedFlags {
  toggles: Record<string, EvaluatedFlag>
  lastUpdated: number
}

export interface UnleashModuleOptions {
  url: string
  token: string
  appName: string
  environment?: string
  refreshInterval?: number
  clientRefreshInterval?: number
  storage?: 'nuxthub' | 'nitro' | 'memory'
  storageKey?: string
}
