# @adamkasper/nuxt-unleash

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Edge-first [Unleash](https://docs.getunleash.io/) feature flags for Nuxt. Fetches pre-evaluated flags from the Unleash Proxy Frontend API, caches them with stale-while-revalidate, and hydrates to the client with zero flicker. No `unleash-client` SDK — works on Cloudflare Workers, Vercel, and Node.js.

## Features

- **Edge-first** — no Node.js-only dependencies, runs on Cloudflare Workers, Vercel, any runtime
- **Zero flicker** — flags evaluated server-side during SSR, hydrated to client
- **Stale-while-revalidate** — instant responses from cache, background refresh when stale
- **Pluggable storage** — NuxtHub KV, Nitro/unstorage drivers, or in-memory
- **Auto-refresh** — client polls for updates via internal API route, pauses when tab is hidden
- **Zero dependencies** — just `@nuxt/kit` and `defu`
- **Type safe** — generated types for composables, server utils, and `$fetch`

## Setup

```bash
npx nuxt module add @adamkasper/nuxt-unleash
```

Configure in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@adamkasper/nuxt-unleash'],
  unleash: {
    url: 'https://your-unleash-proxy.example.com/api/frontend',
    token: 'your-frontend-api-token',
    appName: 'my-app',
  },
})
```

All composables and server utils are auto-imported.

## Usage

### Check if a flag is enabled

```vue
<script setup>
const showBanner = useFlag('new-banner')
</script>

<template>
  <div v-if="showBanner">
    Welcome to the new experience!
  </div>
</template>
```

### Get a variant (A/B testing)

```vue
<script setup>
const variant = useVariant('checkout-experiment')
</script>

<template>
  <CheckoutA v-if="variant.name === 'treatment-a'" />
  <CheckoutB v-else-if="variant.name === 'treatment-b'" />
  <CheckoutDefault v-else />
</template>
```

### Check loading status

```vue
<script setup>
const { ready, flagCount } = useFlagsStatus()
</script>

<template>
  <div v-if="!ready">
    Loading flags...
  </div>

  <div v-else>
    {{ flagCount }} flags loaded
  </div>
</template>
```

### Debug all flags

```ts
const allFlags = useAllFlags()
console.log(allFlags.value)
// { 'my-flag': { name, enabled, variant }, ... }
```

### Server-side flag checks

```ts
// server/api/my-route.ts
export default defineEventHandler(async () => {
  const { toggles } = await useUnleashFlags()

  if (toggles['premium-api']?.enabled) {
    return { tier: 'premium' }
  }
  return { tier: 'free' }
})
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | **required** | Unleash Proxy Frontend API URL |
| `token` | `string` | **required** | Frontend API token (server-only, never exposed to client) |
| `appName` | `string` | **required** | Application name sent to the proxy |
| `environment` | `string` | `'default'` | Environment name |
| `refreshInterval` | `number` | `15000` | Stale-while-revalidate TTL in ms |
| `clientRefreshInterval` | `number` | `30000` | Client polling interval in ms (`0` to disable) |
| `storage` | `'nuxthub' \| 'nitro' \| 'memory'` | `'memory'` | Storage backend for caching flags |
| `storageKey` | `string` | `'unleash:flags'` | Key prefix used in storage |

All options support `NUXT_UNLEASH_*` environment variable overrides:

```bash
NUXT_UNLEASH_TOKEN=prod:production.secret-token node .output/server/index.mjs
```

## How it works

```
Server startup
  └─ Nitro plugin fetches flags from Unleash Proxy, stores in cache

SSR request
  └─ Server plugin reads flags from cache (stale-while-revalidate)
  └─ If stale, triggers background refresh
  └─ Stores flags in useState() → hydrates to client

Client
  └─ Reads hydrated flags immediately (zero flicker)
  └─ Polls GET /api/_unleash/flags for updates (pauses when tab hidden)
```

## Composables

| Composable | Returns | Description |
|---|---|---|
| `useFlag(name)` | `ComputedRef<boolean>` | Whether a flag is enabled |
| `useVariant(name)` | `ComputedRef<Variant>` | Variant details for A/B testing |
| `useFlagsStatus()` | `{ ready, flagCount }` | Flag loading status |
| `useAllFlags()` | `ComputedRef<Record<string, EvaluatedFlag>>` | All evaluated flags |

## Server Utils

Auto-imported in the `server/` directory:

| Utility | Returns | Description |
|---|---|---|
| `useUnleashFlags()` | `Promise<CachedFlags>` | Read flags with stale-while-revalidate |
| `refreshUnleashFlags(opts?)` | `Promise<CachedFlags \| null>` | Force refresh from proxy |

## Documentation

Full documentation: [nuxt-unleash docs](https://github.com/adamkasper/nuxt-unleash/tree/main/docs)

## Development

```bash
pnpm install
pnpm dev:prepare
pnpm dev           # Start playground
pnpm test          # Run tests
pnpm lint          # Lint
```

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@adamkasper/nuxt-unleash/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@adamkasper/nuxt-unleash

[npm-downloads-src]: https://img.shields.io/npm/dm/@adamkasper/nuxt-unleash.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@adamkasper/nuxt-unleash

[license-src]: https://img.shields.io/npm/l/@adamkasper/nuxt-unleash.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@adamkasper/nuxt-unleash

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
