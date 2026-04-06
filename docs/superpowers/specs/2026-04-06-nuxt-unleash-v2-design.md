# nuxt-unleash v2 — Edge-First Redesign

## Motivace

Stávající modul (`@adamkasper/nuxt-unleash` v0.0.2-beta) používá `unleash-client` (Node.js SDK) s in-memory storage. To funguje na tradičním Node.js serveru, ale selhává na edge runtimech (Cloudflare Workers, Vercel Edge) kde:

- Worker žije jen několik sekund, pak zemře i s pamětí
- `unleash-client` závisí na Node.js API (`http`, `net`, proxy agenti)
- `globalThis.__instance__` nepřežije mezi requesty

Cílem je přepsat modul jako edge-first s podporou NuxtHub, Cloudflare Workers, Vercel a klasického Node.js.

## Rozhodnutí

| Aspekt | Rozhodnutí |
|---|---|
| SDK | Vlastní lightweight fetch klient (žádný `unleash-client`) |
| API | Unleash Proxy Frontend API (předvyhodnocené flagy) |
| Caching | Stale-while-revalidate přes unstorage |
| Storage režimy | `nuxthub` (preferovaný) / `nitro` / `memory` (default) |
| Server refresh | Lazy — refreshuje se jen když přijde request a data jsou stale |
| Client refresh | Polling přes interní API route `/_unleash/flags` |
| Flagy | Globální (jedna cache entry pro všechny uživatele) |
| Typy | Generované do `.nuxt/types/` přes `addTypeTemplate` |

## Konfigurace

Tři režimy storage — uživatel si volí explicitně:

### NuxtHub (preferovaný)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxthub/core', '@adamkasper/nuxt-unleash'],

  hub: {
    kv: true,
  },

  unleash: {
    url: 'https://unleash-proxy.example.com/api/frontend',
    token: 'frontend-token',
    appName: 'my-app',
    storage: 'nuxthub',
    refreshInterval: 15_000,
  },
})
```

### Vlastní Nitro storage driver

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adamkasper/nuxt-unleash'],

  unleash: {
    url: 'https://unleash-proxy.example.com/api/frontend',
    token: 'frontend-token',
    appName: 'my-app',
    storage: 'nitro',
    refreshInterval: 15_000,
  },

  nitro: {
    storage: {
      unleash: {
        driver: 'cloudflare-kv-binding',
        binding: 'UNLEASH_CACHE',
      }
    },
    devStorage: {
      unleash: { driver: 'memory' }
    }
  },
})
```

### Memory-only (dev / Node.js)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@adamkasper/nuxt-unleash'],

  unleash: {
    url: 'https://unleash-proxy.example.com/api/frontend',
    token: 'frontend-token',
    appName: 'my-app',
    // storage default = 'memory'
  },
})
```

### Module options

```ts
interface UnleashModuleOptions {
  url: string                      // Unleash Proxy Frontend API URL
  token: string                    // Frontend API token
  appName: string                  // Název aplikace
  environment?: string             // default: 'default'
  refreshInterval?: number         // ms, stale-while-revalidate TTL (default: 15_000)
  clientRefreshInterval?: number   // ms, client polling (default: 30_000, 0 = off)
  storage?: 'nuxthub' | 'nitro' | 'memory'  // default: 'memory'
  storageKey?: string              // unstorage key prefix (default: 'unleash:flags')
}
```

### Runtime config

```ts
// Private (server-only)
runtimeConfig.unleash = { url, token, appName, environment, refreshInterval, storageKey }

// Public (client + server)
runtimeConfig.public.unleash = { appName, environment, clientRefreshInterval }
```

Token zůstává server-only. Client nikdy nekomunikuje s Unleash Proxy přímo.

## Architektura

### High-level tok dat

```
┌─────────────────────────────────────────────────────┐
│  nuxt.config.ts                                      │
│  unleash: { url, token, appName, storage }           │
└──────────────┬──────────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Nuxt Module Setup  │  registruje pluginy, composables, API route
    └──────────┬──────────┘
               │
   ┌───────────┼────────────────┐
   │           │                │
   ▼           ▼                ▼
┌────────┐ ┌──────────┐ ┌──────────────┐
│ Nitro  │ │ Server   │ │ Client       │
│ Plugin │ │ Plugin   │ │ Plugin       │
│        │ │ (.server)│ │ (.client)    │
└───┬────┘ └────┬─────┘ └──────┬───────┘
    │           │               │
    │  ┌────────▼────────┐      │
    │  │ #unleash/storage│      │
    │  │ (unstorage)     │      │
    │  └────────┬────────┘      │
    │           │               │
    ▼           ▼               ▼
┌────────────────────┐   ┌──────────────┐
│ Unleash Proxy      │   │ useState()   │
│ Frontend API       │   │ (hydrated    │
│ (fetch + cache)    │   │  from SSR)   │
└────────────────────┘   └──────────────┘
```

### Nitro plugin (startup)

```
Server start
  └─ fetchFlags() z Unleash Proxy Frontend API
  └─ uložit do storage: { toggles: {...}, lastUpdated: timestamp }
  └─ pokud fetch selže → warning log, flags = {} (graceful start)
```

### Server plugin (.server) — per-request flow

```
Request přijde
  │
  ├─ storage.getFlags()
  │
  ├─ Cache HIT + fresh (lastUpdated < refreshInterval)
  │   └─ useState('unleash-flags', flags) → SSR hydration
  │
  ├─ Cache HIT + stale (lastUpdated >= refreshInterval)
  │   ├─ useState('unleash-flags', flags) → vrátí stale data IHNED
  │   └─ background: fetchFlags() + storage.setFlags() → refresh async
  │
  └─ Cache MISS (první request, prázdný KV)
      └─ sync fetchFlags() + storage.setFlags() + useState()
```

### Background refresh — deduplikace

Aby N současných requestů netriggrovalo N fetchů:

```
storage key: 'unleash:refreshing' = timestamp
  → pokud existuje a je < 5s starý → skip refresh
  → jinak nastav lock, fetch, ulož flags, smaž lock
```

Žádný `setInterval`, žádný polling na serveru. Refreshuje se lazy — jen když přijde request a data jsou stale.

### Fetch z Frontend API

```
GET {url}
Headers:
  Authorization: {token}
  Content-Type: application/json

Response: { toggles: [{ name, enabled, variant, impressionData }] }

→ transformovat na: Record<string, EvaluatedFlag>
→ uložit jako JSON do storage s timestamp
```

### Client plugin (.client)

```
Hydration
  └─ useState('unleash-flags') → okamžitě dostupné z SSR
  └─ žádný flicker, žádný loading state

Polling (volitelný)
  └─ setInterval(clientRefreshInterval)
  └─ GET /api/_unleash/flags → interní API route
  └─ aktualizuje useState()
  └─ pauzuje když tab neaktivní (visibilitychange)
  └─ clientRefreshInterval: 0 → polling vypnutý
```

### API route `/_unleash/flags`

Tenký endpoint — čte z unstorage, aplikuje stale-while-revalidate, vrátí flagy. Client nikdy nekomunikuje s Unleash Proxy přímo.

```
GET /api/_unleash/flags
  └─ storage.getFlags()
  └─ stale? → background refresh
  └─ return { toggles, ready: true, lastUpdated }
```

### SSR → Client tok

```
Server                          Client
  │                               │
  ├─ storage.getFlags()           │
  ├─ useState('unleash', flags)   │
  │         ─── hydration ───►    │
  │                               ├─ useState('unleash') → hotové
  │                               ├─ composables reactive
  │                               └─ polling starts (optional)
```

## Composables

| Composable | Vrací | Popis |
|---|---|---|
| `useFlag(name)` | `ComputedRef<boolean>` | Je flag zapnutý? |
| `useVariant(name)` | `ComputedRef<Variant>` | Varianta flagu |
| `useAllFlags()` | `ComputedRef<Record<string, EvaluatedFlag>>` | Všechny flagy |
| `useFlagsStatus()` | `{ ready: ComputedRef<boolean>, flagCount: ComputedRef<number> }` | Stav inicializace |

`useUnleashContext()` odstraněno — s Frontend API a globálními flagy není potřeba měnit kontext per-user.

## Storage abstrakce

### Rozhraní `#unleash/storage`

```ts
interface UnleashStorage {
  getFlags(): Promise<CachedFlags | null>
  setFlags(flags: CachedFlags): Promise<void>
  isRefreshing(): Promise<boolean>
  setRefreshing(value: boolean): Promise<void>
}
```

### Implementace per režim

Generované build-time přes `addTemplate`:

- **`nuxthub`** → `kv.get()` / `kv.set()` z `@nuxthub/kv`
- **`nitro`** → `useStorage('unleash').getItem()` / `.setItem()` z Nitro
- **`memory`** → `Map<string, any>` ve scope modulu

### Storage keys

```
unleash:flags        → CachedFlags JSON
unleash:refreshing   → timestamp (deduplikace refresh)
```

### TTL handling

- NuxtHub KV: nativní TTL (`{ ttl: refreshInterval * 3 }`) jako safety net
- Nitro storage: závisí na driveru, fallback na `lastUpdated` check
- Memory: vždy `lastUpdated` check

## Typový systém

Všechny type augmentace přes `addTypeTemplate()` — generují se do `.nuxt/types/`.

### Generované soubory

```
.nuxt/types/
├── unleash-storage.d.ts          # virtual module #unleash/storage
├── unleash-types.d.ts            # sdílené typy (EvaluatedFlag, Variant, CachedFlags)
├── unleash-nitro.d.ts            # InternalApi augmentace
└── unleash-h3.d.ts               # H3EventContext augmentace
```

### `unleash-types.d.ts`

Kontext: `{ nuxt: true, nitro: true, node: true }`

```ts
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
```

### `unleash-storage.d.ts`

Kontext: `{ nitro: true, node: true }`

```ts
declare module '#unleash/storage' {
  import type { CachedFlags } from '#unleash/types'

  export function getFlags(): Promise<CachedFlags | null>
  export function setFlags(flags: CachedFlags): Promise<void>
  export function isRefreshing(): Promise<boolean>
  export function setRefreshing(value: boolean): Promise<void>
}
```

### `unleash-nitro.d.ts`

Kontext: `{ nitro: true, node: true }`

```ts
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
```

### `unleash-h3.d.ts`

Kontext: `{ nitro: true, node: true }`

```ts
import type { EvaluatedFlag } from '#unleash/types'

declare module 'h3' {
  interface H3EventContext {
    unleashFlags?: Record<string, EvaluatedFlag>
  }
}
```

### Build-time validace

```ts
const hasNuxtHub = hasNuxtModule('@nuxthub/core', nuxt)
const hubConfig = hasNuxtHub ? (nuxt.options as any).hub : undefined
const hasHubKV = hasNuxtHub && !!hubConfig?.kv

if (options.storage === 'nuxthub') {
  if (!hasNuxtHub)
    throw new Error('[nuxt-unleash] storage: "nuxthub" requires @nuxthub/core')
  if (!hasHubKV)
    throw new Error('[nuxt-unleash] storage: "nuxthub" requires hub.kv: true')
  if (!nuxt.options.alias['hub:kv'])
    throw new Error('[nuxt-unleash] @nuxthub/core must be listed before nuxt-unleash')
}

if (options.storage === 'nitro') {
  const hasUnleashStorage = !!nuxt.options.nitro?.storage?.unleash
  if (!hasUnleashStorage) {
    console.warn('[nuxt-unleash] storage: "nitro" requires nitro.storage.unleash config. Falling back to memory driver.')
  }
}
```
```

### Runtime config augmentace

```ts
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
```

### Server auto-imports

Registrované přes `addServerImportsDir`:

- `useUnleashFlags()` — čte flagy ze storage (server composable)
- `refreshUnleashFlags()` — force refresh z proxy (server composable)

## Struktura souborů

```
src/
├── module.ts                          # setup, validace, registrace
├── type-templates.ts                  # addTypeTemplate registrace
├── runtime/
│   ├── types.ts                       # EvaluatedFlag, Variant, CachedFlags
│   ├── composables/
│   │   ├── useFlag.ts                 # ComputedRef<boolean>
│   │   ├── useVariant.ts             # ComputedRef<Variant>
│   │   ├── useAllFlags.ts            # ComputedRef<Record<...>>
│   │   └── useFlagsStatus.ts         # { ready, flagCount }
│   ├── plugins/
│   │   ├── unleash.server.ts         # SSR: storage → useState
│   │   └── unleash.client.ts         # Hydration + polling
│   ├── server/
│   │   ├── nitro-plugin.ts           # Startup: první fetch
│   │   ├── api/_unleash/flags.get.ts # Interní API route
│   │   └── utils/
│   │       ├── useUnleashFlags.ts    # Server composable
│   │       └── refreshUnleashFlags.ts
│   └── templates/
│       ├── storage-nuxthub.ts        # addTemplate pro NuxtHub KV
│       ├── storage-nitro.ts          # addTemplate pro Nitro useStorage
│       └── storage-memory.ts         # addTemplate pro in-memory
```

## Odlišnosti od v1

| v1 (současný) | v2 (nový) |
|---|---|
| `unleash-client` (Node SDK) | Vlastní lightweight fetch klient |
| `InMemStorageProvider` | unstorage (driver-agnostický) |
| `globalThis.__instance__` | Žádný global state |
| Jen Node.js | Edge-first (CF Workers, Vercel, Node) |
| Backend API token | Frontend API token (bezpečnější) |
| `useUnleashContext()` | Odstraněno (globální flagy) |
| Ruční Nitro storage config | NuxtHub first-class integrace |
| Typy inline v module.ts | Generované `.nuxt/types/` přes `addTypeTemplate` |
| `unleash-client` typy | Vlastní typy bez externích závislostí |

## Závislosti

### Produkční

- `@nuxt/kit` — Nuxt module toolkit
- `defu` — object defaults

### Peer (volitelné)

- `@nuxthub/core` — pouze pro `storage: 'nuxthub'`

### Odstraněné

- `unleash-client` — nahrazeno vlastním fetch klientem
