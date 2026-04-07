import { addTypeTemplate } from '@nuxt/kit'

export function registerTypeTemplates(): void {
  addTypeTemplate({
    filename: 'types/unleash-types.d.ts',
    getContents: () => `
declare module '#unleash/types' {
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
}
`,
  }, { nuxt: true, nitro: true, node: true })

  addTypeTemplate({
    filename: 'types/unleash-storage.d.ts',
    getContents: () => `
declare module '#unleash/storage' {
  import type { CachedFlags } from '#unleash/types'

  export function getFlags(): Promise<CachedFlags | null>
  export function setFlags(flags: CachedFlags): Promise<void>
  export function isRefreshing(): Promise<boolean>
  export function setRefreshing(value: boolean): Promise<void>
}
`,
  }, { nitro: true, node: true })

  addTypeTemplate({
    filename: 'types/unleash-nitro.d.ts',
    getContents: () => `
import type { CachedFlags } from '#unleash/types'

declare module 'nitropack' {
  interface InternalApi {
    '/api/_unleash/flags': {
      get: CachedFlags & { ready: boolean }
    }
  }
}
declare module 'nitropack/types' {
  interface InternalApi {
    '/api/_unleash/flags': {
      get: CachedFlags & { ready: boolean }
    }
  }
}
`,
  }, { nitro: true, node: true })

  addTypeTemplate({
    filename: 'types/unleash-h3.d.ts',
    getContents: () => `
import type { EvaluatedFlag } from '#unleash/types'

declare module 'h3' {
  interface H3EventContext {
    unleashFlags?: Record<string, EvaluatedFlag>
  }
}
`,
  }, { nitro: true, node: true })
}
