# nuxt-unleash v2 Edge-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite nuxt-unleash as an edge-first module using unstorage instead of the Node.js Unleash SDK, with NuxtHub first-class support.

**Architecture:** Lightweight fetch client talks to Unleash Proxy Frontend API, caches flags in unstorage (NuxtHub KV / Nitro storage / memory). Stale-while-revalidate per-request on server, polling on client. Generated type templates for full type safety.

**Tech Stack:** Nuxt 4+, @nuxt/kit, unstorage (via Nitro), @nuxthub/kv (optional), defu, vitest, @nuxt/test-utils

**Spec:** `docs/superpowers/specs/2026-04-06-nuxt-unleash-v2-design.md`

---

## File Structure

### Files to delete

- `src/runtime/server/utils/unleash.ts` (old SDK wrapper)
- `src/runtime/server/api/evaluate.get.ts` (old evaluate endpoint)
- `src/runtime/composables/useUnleashContext.ts` (removed in v2)
- `src/runtime/state.ts` (replaced by useState in plugins)

### Files to create

- `src/runtime/types.ts` — shared types (EvaluatedFlag, Variant, CachedFlags)
- `src/type-templates.ts` — addTypeTemplate registrations
- `src/runtime/server/utils/useUnleashFlags.ts` — server composable: read flags
- `src/runtime/server/utils/refreshUnleashFlags.ts` — server composable: force refresh
- `src/runtime/server/api/_unleash/flags.get.ts` — internal API route
- `src/runtime/templates/storage-nuxthub.ts` — NuxtHub KV storage template content
- `src/runtime/templates/storage-nitro.ts` — Nitro useStorage template content
- `src/runtime/templates/storage-memory.ts` — in-memory storage template content
- `test/fixtures/basic/nuxt.config.ts` — update existing fixture

### Files to rewrite

- `src/module.ts` — full rewrite with new options, storage detection, type templates
- `src/runtime/plugins/unleash.server.ts` — stale-while-revalidate from storage
- `src/runtime/plugins/unleash.client.ts` — hydration + polling
- `src/runtime/server/nitro-plugin.ts` — startup fetch (no SDK)
- `src/runtime/composables/useFlag.ts` — simplified (no SDK dependency)
- `src/runtime/composables/useVariant.ts` — simplified
- `src/runtime/composables/useAllFlags.ts` — simplified
- `src/runtime/composables/useFlagsStatus.ts` — simplified

---

## Task 1: Clean up old dependencies and files

**Files:**
- Modify: `package.json`
- Delete: `src/runtime/server/utils/unleash.ts`
- Delete: `src/runtime/server/api/evaluate.get.ts`
- Delete: `src/runtime/composables/useUnleashContext.ts`
- Delete: `src/runtime/state.ts`

- [ ] **Step 1: Remove unleash-client dependency**

```bash
pnpm remove unleash-client
```

- [ ] **Step 2: Delete old files**

```bash
rm src/runtime/server/utils/unleash.ts
rm src/runtime/server/api/evaluate.get.ts
rm src/runtime/composables/useUnleashContext.ts
rm src/runtime/state.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unleash-client SDK and old files"
```

---

## Task 2: Shared types

**Files:**
- Create: `src/runtime/types.ts`

- [ ] **Step 1: Write types file**

Create `src/runtime/types.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/runtime/types.ts
git commit -m "feat: add shared types for v2"
```

---

## Task 3: Storage templates

**Files:**
- Create: `src/runtime/templates/storage-memory.ts`
- Create: `src/runtime/templates/storage-nitro.ts`
- Create: `src/runtime/templates/storage-nuxthub.ts`

Each template exports a `getContents()` function that returns the generated TypeScript code as a string. The generated code implements the `#unleash/storage` interface.

- [ ] **Step 1: Create memory storage template**

Create `src/runtime/templates/storage-memory.ts`:

```ts
export function getContents(): string {
  return `
import type { CachedFlags } from '#unleash/types'

const store = new Map<string, any>()

export async function getFlags(): Promise<CachedFlags | null> {
  return store.get('flags') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  store.set('flags', flags)
}

export async function isRefreshing(): Promise<boolean> {
  const ts = store.get('refreshing') as number | undefined
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    store.set('refreshing', Date.now())
  } else {
    store.delete('refreshing')
  }
}
`
}
```

- [ ] **Step 2: Create Nitro storage template**

Create `src/runtime/templates/storage-nitro.ts`:

```ts
export function getContents(storageKey: string): string {
  return `
import type { CachedFlags } from '#unleash/types'
import { useStorage } from 'nitro/storage'

function storage() {
  return useStorage('unleash')
}

export async function getFlags(): Promise<CachedFlags | null> {
  return await storage().getItem<CachedFlags>('${storageKey}') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await storage().setItem('${storageKey}', flags)
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await storage().getItem<number>('${storageKey}:refreshing')
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await storage().setItem('${storageKey}:refreshing', Date.now())
  } else {
    await storage().removeItem('${storageKey}:refreshing')
  }
}
`
}
```

- [ ] **Step 3: Create NuxtHub KV storage template**

Create `src/runtime/templates/storage-nuxthub.ts`:

```ts
export function getContents(storageKey: string, refreshInterval: number): string {
  const ttl = Math.ceil((refreshInterval * 3) / 1000)
  return `
import type { CachedFlags } from '#unleash/types'
import { kv } from '@nuxthub/kv'

export async function getFlags(): Promise<CachedFlags | null> {
  return await kv.get('${storageKey}') ?? null
}

export async function setFlags(flags: CachedFlags): Promise<void> {
  await kv.set('${storageKey}', flags, { ttl: ${ttl} })
}

export async function isRefreshing(): Promise<boolean> {
  const ts = await kv.get<number>('${storageKey}:refreshing')
  if (!ts) return false
  return Date.now() - ts < 5000
}

export async function setRefreshing(value: boolean): Promise<void> {
  if (value) {
    await kv.set('${storageKey}:refreshing', Date.now(), { ttl: 10 })
  } else {
    await kv.del('${storageKey}:refreshing')
  }
}
`
}
```

- [ ] **Step 4: Commit**

```bash
git add src/runtime/templates/
git commit -m "feat: add storage templates (memory, nitro, nuxthub)"
```

---

## Task 4: Type templates

**Files:**
- Create: `src/type-templates.ts`

- [ ] **Step 1: Write type templates file**

Create `src/type-templates.ts`:

```ts
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
    '/_unleash/flags': {
      get: CachedFlags & { ready: boolean }
    }
  }
}
declare module 'nitropack/types' {
  interface InternalApi {
    '/_unleash/flags': {
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
```

- [ ] **Step 2: Commit**

```bash
git add src/type-templates.ts
git commit -m "feat: add type templates for generated .nuxt/types/"
```

---

## Task 5: Module setup (module.ts rewrite)

**Files:**
- Rewrite: `src/module.ts`

- [ ] **Step 1: Rewrite module.ts**

Replace the entire content of `src/module.ts`:

```ts
import { defineNuxtModule, addPlugin, addServerPlugin, createResolver, addImportsDir, addServerImportsDir, addTemplate, hasNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import type { UnleashModuleOptions } from './runtime/types'
import { registerTypeTemplates } from './type-templates'
import { getContents as memoryContents } from './runtime/templates/storage-memory'
import { getContents as nitroContents } from './runtime/templates/storage-nitro'
import { getContents as nuxthubContents } from './runtime/templates/storage-nuxthub'

export type { UnleashModuleOptions }

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    unleash: {
      appName: string
      environment: string
      clientRefreshInterval: number
    }
  }
  interface RuntimeConfig {
    unleash: {
      url: string
      token: string
      appName: string
      environment: string
      refreshInterval: number
      storageKey: string
    }
  }
}

export default defineNuxtModule<UnleashModuleOptions>({
  meta: {
    name: 'nuxt-unleash',
    configKey: 'unleash',
  },
  defaults: {
    url: '',
    token: '',
    appName: '',
    environment: 'default',
    refreshInterval: 15_000,
    clientRefreshInterval: 30_000,
    storage: 'memory',
    storageKey: 'flags',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (!options.url || !options.token || !options.appName) {
      console.warn('[nuxt-unleash] Missing required config (url, token, appName). Module disabled.')
      return
    }

    // Storage validation
    if (options.storage === 'nuxthub') {
      const hasNuxtHub = hasNuxtModule('@nuxthub/core', nuxt)
      if (!hasNuxtHub) {
        throw new Error('[nuxt-unleash] storage: "nuxthub" requires @nuxthub/core module. Install it and add it to modules before nuxt-unleash.')
      }
      const hubConfig = (nuxt.options as any).hub
      if (!hubConfig?.kv) {
        throw new Error('[nuxt-unleash] storage: "nuxthub" requires hub.kv: true in your nuxt.config.')
      }
    }

    if (options.storage === 'nitro') {
      const hasUnleashStorage = !!(nuxt.options.nitro as any)?.storage?.unleash
      if (!hasUnleashStorage) {
        console.warn('[nuxt-unleash] storage: "nitro" but nitro.storage.unleash is not configured. Falling back to memory.')
        options.storage = 'memory'
      }
    }

    // Runtime config
    nuxt.options.runtimeConfig.unleash = defu(
      nuxt.options.runtimeConfig.unleash,
      {
        url: options.url,
        token: options.token,
        appName: options.appName,
        environment: options.environment!,
        refreshInterval: options.refreshInterval!,
        storageKey: options.storageKey!,
      },
    )

    nuxt.options.runtimeConfig.public.unleash = defu(
      nuxt.options.runtimeConfig.public.unleash as any,
      {
        appName: options.appName,
        environment: options.environment!,
        clientRefreshInterval: options.clientRefreshInterval!,
      },
    )

    // Storage template
    const storageTemplate = addTemplate({
      filename: 'unleash/storage.ts',
      write: true,
      getContents: () => {
        switch (options.storage) {
          case 'nuxthub':
            return nuxthubContents(options.storageKey!, options.refreshInterval!)
          case 'nitro':
            return nitroContents(options.storageKey!)
          default:
            return memoryContents()
        }
      },
    })
    nuxt.options.alias['#unleash/storage'] = storageTemplate.dst

    // Type templates
    registerTypeTemplates()

    // Plugins
    addServerPlugin(resolver.resolve('./runtime/server/nitro-plugin'))
    addPlugin(resolver.resolve('./runtime/plugins/unleash.server'))
    addPlugin(resolver.resolve('./runtime/plugins/unleash.client'))

    // Auto-imports
    addImportsDir(resolver.resolve('./runtime/composables'))
    addServerImportsDir(resolver.resolve('./runtime/server/utils'))

    // API route
    nuxt.options.nitro = defu(nuxt.options.nitro, {
      handlers: [{
        route: '/api/_unleash/flags',
        method: 'get',
        handler: resolver.resolve('./runtime/server/api/_unleash/flags.get'),
      }],
    })
  },
})
```

- [ ] **Step 2: Verify build compiles**

```bash
pnpm dev:prepare
```

Expected: No errors. The build should complete successfully even though runtime files aren't updated yet.

- [ ] **Step 3: Commit**

```bash
git add src/module.ts
git commit -m "feat: rewrite module.ts with storage modes and type templates"
```

---

## Task 6: Server utilities

**Files:**
- Create: `src/runtime/server/utils/useUnleashFlags.ts`
- Create: `src/runtime/server/utils/refreshUnleashFlags.ts`
- Delete: `src/runtime/server/tsconfig.json` (if stale, re-evaluate)

- [ ] **Step 1: Create refreshUnleashFlags utility**

This is the core fetch + store logic used by both the Nitro plugin and the API route.

Create `src/runtime/server/utils/refreshUnleashFlags.ts`:

```ts
import { useRuntimeConfig } from 'nitropack/runtime'
import { getFlags, setFlags, isRefreshing, setRefreshing } from '#unleash/storage'
import type { CachedFlags, EvaluatedFlag } from '#unleash/types'

interface FrontendToggle {
  name: string
  enabled: boolean
  variant: {
    name: string
    enabled: boolean
    featureEnabled?: boolean
    payload?: { type: string; value: string }
  }
  impressionData?: boolean
}

export async function refreshUnleashFlags(options?: { force?: boolean }): Promise<CachedFlags | null> {
  const config = useRuntimeConfig().unleash

  if (!options?.force) {
    const refreshing = await isRefreshing()
    if (refreshing) {
      return await getFlags()
    }
  }

  await setRefreshing(true)

  try {
    const response = await $fetch<{ toggles: FrontendToggle[] }>(config.url, {
      headers: {
        'Authorization': config.token,
        'Accept': 'application/json',
      },
      timeout: 5000,
    })

    const toggles: Record<string, EvaluatedFlag> = {}
    for (const toggle of response.toggles) {
      toggles[toggle.name] = {
        name: toggle.name,
        enabled: toggle.enabled,
        variant: {
          name: toggle.variant.name,
          enabled: toggle.variant.enabled,
          payload: toggle.variant.payload,
        },
      }
    }

    const cached: CachedFlags = {
      toggles,
      lastUpdated: Date.now(),
    }

    await setFlags(cached)
    return cached
  }
  catch (error) {
    console.warn('[nuxt-unleash] Failed to fetch flags from proxy:', (error as Error).message)
    return await getFlags()
  }
  finally {
    await setRefreshing(false)
  }
}
```

- [ ] **Step 2: Create useUnleashFlags utility**

Create `src/runtime/server/utils/useUnleashFlags.ts`:

```ts
import { useRuntimeConfig } from 'nitropack/runtime'
import { getFlags } from '#unleash/storage'
import type { CachedFlags } from '#unleash/types'
import { refreshUnleashFlags } from './refreshUnleashFlags'

export async function useUnleashFlags(): Promise<CachedFlags> {
  const config = useRuntimeConfig().unleash
  const cached = await getFlags()

  if (!cached) {
    const fresh = await refreshUnleashFlags({ force: true })
    return fresh ?? { toggles: {}, lastUpdated: 0 }
  }

  const age = Date.now() - cached.lastUpdated
  if (age > config.refreshInterval) {
    refreshUnleashFlags().catch(() => {})
  }

  return cached
}
```

- [ ] **Step 3: Commit**

```bash
git add src/runtime/server/utils/
git commit -m "feat: add server utils (useUnleashFlags, refreshUnleashFlags)"
```

---

## Task 7: Nitro plugin (startup fetch)

**Files:**
- Rewrite: `src/runtime/server/nitro-plugin.ts`

- [ ] **Step 1: Rewrite nitro-plugin.ts**

Replace the entire content of `src/runtime/server/nitro-plugin.ts`:

```ts
import { defineNitroPlugin } from 'nitropack/runtime'
import { refreshUnleashFlags } from './utils/refreshUnleashFlags'

export default defineNitroPlugin(async () => {
  try {
    await refreshUnleashFlags({ force: true })
    console.log('[nuxt-unleash] Flags loaded on startup')
  }
  catch (error) {
    console.warn('[nuxt-unleash] Failed to load flags on startup:', (error as Error).message)
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/runtime/server/nitro-plugin.ts
git commit -m "feat: rewrite nitro plugin for edge-first startup fetch"
```

---

## Task 8: API route

**Files:**
- Create: `src/runtime/server/api/_unleash/flags.get.ts`

- [ ] **Step 1: Create the API route directory**

```bash
mkdir -p src/runtime/server/api/_unleash
```

- [ ] **Step 2: Write the flags endpoint**

Create `src/runtime/server/api/_unleash/flags.get.ts`:

```ts
import { defineEventHandler } from 'h3'
import { useUnleashFlags } from '../../utils/useUnleashFlags'

export default defineEventHandler(async () => {
  const cached = await useUnleashFlags()
  return {
    toggles: cached.toggles,
    lastUpdated: cached.lastUpdated,
    ready: cached.lastUpdated > 0,
  }
})
```

- [ ] **Step 3: Commit**

```bash
git add src/runtime/server/api/
git commit -m "feat: add /_unleash/flags API route"
```

---

## Task 9: Server plugin (SSR hydration)

**Files:**
- Rewrite: `src/runtime/plugins/unleash.server.ts`

- [ ] **Step 1: Rewrite server plugin**

Replace the entire content of `src/runtime/plugins/unleash.server.ts`:

```ts
import { defineNuxtPlugin, useState } from '#app'
import { useUnleashFlags } from '../server/utils/useUnleashFlags'
import type { CachedFlags } from '#unleash/types'

export default defineNuxtPlugin({
  name: 'unleash-server',
  async setup() {
    const cached = await useUnleashFlags()

    useState<CachedFlags>('unleash-flags', () => cached)
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/runtime/plugins/unleash.server.ts
git commit -m "feat: rewrite server plugin for SSR hydration from storage"
```

---

## Task 10: Client plugin (hydration + polling)

**Files:**
- Rewrite: `src/runtime/plugins/unleash.client.ts`

- [ ] **Step 1: Rewrite client plugin**

Replace the entire content of `src/runtime/plugins/unleash.client.ts`:

```ts
import { defineNuxtPlugin, useState, useRuntimeConfig } from '#app'
import type { CachedFlags } from '#unleash/types'

export default defineNuxtPlugin({
  name: 'unleash-client',
  setup() {
    const config = useRuntimeConfig().public.unleash
    const state = useState<CachedFlags>('unleash-flags')

    if (!config.clientRefreshInterval || config.clientRefreshInterval <= 0) {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (intervalId) return
      intervalId = setInterval(async () => {
        try {
          const data = await $fetch('/api/_unleash/flags')
          if (data && data.toggles) {
            state.value = {
              toggles: data.toggles,
              lastUpdated: data.lastUpdated,
            }
          }
        }
        catch {
          // Silently ignore polling errors — flags stay at current value
        }
      }, config.clientRefreshInterval)
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Pause polling when tab is hidden
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopPolling()
        }
        else {
          startPolling()
        }
      })
    }

    startPolling()
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/runtime/plugins/unleash.client.ts
git commit -m "feat: rewrite client plugin with polling and visibility pause"
```

---

## Task 11: Composables

**Files:**
- Rewrite: `src/runtime/composables/useFlag.ts`
- Rewrite: `src/runtime/composables/useVariant.ts`
- Rewrite: `src/runtime/composables/useAllFlags.ts`
- Rewrite: `src/runtime/composables/useFlagsStatus.ts`

- [ ] **Step 1: Rewrite useFlag.ts**

Replace the entire content of `src/runtime/composables/useFlag.ts`:

```ts
import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags } from '#unleash/types'

export function useFlag(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.enabled ?? false)
}
```

- [ ] **Step 2: Rewrite useVariant.ts**

Replace the entire content of `src/runtime/composables/useVariant.ts`:

```ts
import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags, Variant } from '#unleash/types'

const DISABLED_VARIANT: Variant = { name: 'disabled', enabled: false }

export function useVariant(name: string) {
  const state = useState<CachedFlags>('unleash-flags')
  return computed(() => state.value?.toggles?.[name]?.variant ?? DISABLED_VARIANT)
}
```

- [ ] **Step 3: Rewrite useAllFlags.ts**

Replace the entire content of `src/runtime/composables/useAllFlags.ts`:

```ts
import { computed } from 'vue'
import { useState } from '#app'
import type { CachedFlags, EvaluatedFlag } from '#unleash/types'

export function useAllFlags() {
  const state = useState<CachedFlags>('unleash-flags')
  return computed<Record<string, EvaluatedFlag>>(() => state.value?.toggles ?? {})
}
```

- [ ] **Step 4: Rewrite useFlagsStatus.ts**

Replace the entire content of `src/runtime/composables/useFlagsStatus.ts`:

```ts
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
```

- [ ] **Step 5: Commit**

```bash
git add src/runtime/composables/
git commit -m "feat: rewrite composables for v2 (no SDK dependency)"
```

---

## Task 12: Update test fixture and tests

**Files:**
- Modify: `test/fixtures/basic/nuxt.config.ts`
- Rewrite: `test/basic.test.ts`

- [ ] **Step 1: Read existing test fixture config**

```bash
cat test/fixtures/basic/nuxt.config.ts
```

Understand what the current fixture looks like before modifying.

- [ ] **Step 2: Update test fixture nuxt.config.ts**

Replace the content of `test/fixtures/basic/nuxt.config.ts`. The URL points to a port that's not running — this tests graceful fallback when the proxy is unreachable:

```ts
export default defineNuxtConfig({
  modules: ['../../../src/module'],

  unleash: {
    url: 'http://localhost:3737/api/frontend',
    token: 'test-token',
    appName: 'test-app',
    storage: 'memory',
    refreshInterval: 60_000,
    clientRefreshInterval: 0,
  },
})
```

- [ ] **Step 3: Rewrite tests**

Replace the entire content of `test/basic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('nuxt-unleash', async () => {
  await setup({
    rootDir: './test/fixtures/basic',
  })

  it('renders the index page', async () => {
    const html = await $fetch('/')
    expect(html).toBeTruthy()
  })

  it('serves flags via API route', async () => {
    const data = await $fetch('/api/_unleash/flags')
    expect(data).toHaveProperty('toggles')
    expect(data).toHaveProperty('ready')
    expect(data).toHaveProperty('lastUpdated')
  })

  it('returns empty flags when proxy is unreachable', async () => {
    const data = await $fetch('/api/_unleash/flags')
    expect(data.toggles).toBeDefined()
    expect(typeof data.ready).toBe('boolean')
  })
})
```

- [ ] **Step 4: Ensure fixture has an index page**

Check if `test/fixtures/basic/app.vue` or `test/fixtures/basic/pages/index.vue` exists. If not, create `test/fixtures/basic/app.vue`:

```vue
<template>
  <div>
    <h1>Unleash Test</h1>
  </div>
</template>
```

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

Expected: Tests should pass. The module starts gracefully even when the Unleash proxy is unreachable (flags = empty, ready = false).

- [ ] **Step 6: Commit**

```bash
git add test/
git commit -m "test: update tests for v2 architecture"
```

---

## Task 13: Update playground

**Files:**
- Modify: `playground/nuxt.config.ts`
- Modify: `playground/app.vue`

- [ ] **Step 1: Read existing playground files**

```bash
cat playground/nuxt.config.ts
cat playground/app.vue
```

- [ ] **Step 2: Update playground nuxt.config.ts**

Replace the content of `playground/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['../src/module'],

  unleash: {
    url: 'https://your-proxy.example.com/api/frontend',
    token: 'your-frontend-token',
    appName: 'playground',
    storage: 'memory',
    refreshInterval: 15_000,
    clientRefreshInterval: 30_000,
  },

  devtools: { enabled: true },
})
```

- [ ] **Step 3: Update playground app.vue**

Replace the content of `playground/app.vue`:

```vue
<template>
  <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
    <h1>nuxt-unleash v2 playground</h1>

    <section>
      <h2>Status</h2>
      <p>Ready: {{ ready }}</p>
      <p>Flag count: {{ flagCount }}</p>
    </section>

    <section>
      <h2>All flags</h2>
      <pre>{{ JSON.stringify(allFlags, null, 2) }}</pre>
    </section>

    <section>
      <h2>Test flag</h2>
      <p>my-feature: {{ myFeature }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
const myFeature = useFlag('my-feature')
const allFlags = useAllFlags()
const { ready, flagCount } = useFlagsStatus()
</script>
```

- [ ] **Step 4: Commit**

```bash
git add playground/
git commit -m "chore: update playground for v2"
```

---

## Task 14: Update package.json and final cleanup

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify package.json has correct exports and peer dependencies**

Read current `package.json` and ensure:
- `unleash-client` is removed from dependencies
- `@nuxthub/core` is listed as optional peerDependency
- Exports include types

Add to `package.json` if not present:

```json
{
  "peerDependencies": {
    "@nuxthub/core": ">=0.8.0"
  },
  "peerDependenciesMeta": {
    "@nuxthub/core": {
      "optional": true
    }
  }
}
```

- [ ] **Step 2: Run full build**

```bash
pnpm prepack
```

Expected: Build completes without errors.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 4: Run type check**

```bash
pnpm test:types
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: update package.json for v2 (peer deps, remove unleash-client)"
```

---

## Task 15: Final integration verification

- [ ] **Step 1: Clean install and full pipeline**

```bash
rm -rf node_modules .nuxt dist
pnpm install
pnpm dev:prepare
pnpm prepack
pnpm test
```

Expected: All steps complete without errors.

- [ ] **Step 2: Verify generated types exist**

```bash
ls playground/.nuxt/types/unleash-*
```

Expected: Should list `unleash-types.d.ts`, `unleash-storage.d.ts`, `unleash-nitro.d.ts`, `unleash-h3.d.ts`.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: final v2 integration fixes"
```
