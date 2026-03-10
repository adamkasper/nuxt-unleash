# @adamkasper/nuxt-unleash

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

[Unleash](https://docs.getunleash.io/) feature flags for Nuxt with full SSR support. Flags are evaluated server-side during rendering — no flicker, no client-side SDK, one API token.

## Features

- **SSR-first** — flags evaluated during server rendering, hydrated to client
- **Zero flicker** — no `undefined` state, no layout shift on hydration
- **Single token** — server-side API token only, never exposed to the client
- **Auto-refresh** — client polls for flag updates, pauses when tab is hidden
- **Reactive composables** — `useFlag`, `useVariant`, `useFlagsStatus`, `useUnleashContext`
- **Context-aware** — update user context on the fly (login, A/B segments)

## Setup

```bash
npx nuxt module add @adamkasper/nuxt-unleash
```

Configure in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@adamkasper/nuxt-unleash'],
  unleash: {
    url: 'https://unleash.example.com/api',
    token: 'default:development.your-token-here',
    appName: 'my-app',
  },
})
```

That's it. All composables are auto-imported.

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
// variant.value.name    → 'control' | 'treatment-a' | 'treatment-b'
// variant.value.enabled → boolean
// variant.value.payload → { type: string, value: string } | undefined
</script>

<template>
  <CheckoutA v-if="variant.name === 'treatment-a'" />
  <CheckoutB v-else-if="variant.name === 'treatment-b'" />
  <CheckoutDefault v-else />
</template>
```

### Update context (after login, etc.)

```vue
<script setup>
const { updateContext } = useUnleashContext()

async function onLogin(user) {
  await updateContext({
    userId: user.id,
    properties: { plan: user.plan },
  })
  // All flags are now re-evaluated with the new context
}
</script>
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

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | **required** | Unleash API URL |
| `token` | `string` | **required** | Server-side API token |
| `appName` | `string` | **required** | Application name |
| `environment` | `string` | `'default'` | Environment name |
| `refreshInterval` | `number` | `15000` | Server SDK polling interval (ms) |
| `clientRefreshInterval` | `number` | `30000` | Client polling interval (ms), `0` to disable |
| `disableMetrics` | `boolean` | `false` | Disable usage metrics |

All options support `NUXT_UNLEASH_*` environment variable overrides:

```bash
NUXT_UNLEASH_TOKEN=prod:production.secret-token node .output/server/index.mjs
```

## How it works

```
Server startup
  └─ Nitro plugin initializes unleash-client SDK (non-blocking)

SSR request
  └─ Server plugin reads context from cookies (unleash-userId, unleash-sessionId)
  └─ Evaluates all flags via Node SDK (local, no HTTP roundtrip)
  └─ Stores result in useState() → hydrates to client

Client
  └─ Reads hydrated flags immediately (zero flicker)
  └─ Polls /api/_unleash/evaluate for updates (pauses when tab hidden)
  └─ useUnleashContext().updateContext() triggers immediate re-evaluation
```

## Composables

| Composable | Returns | Description |
|---|---|---|
| `useFlag(name)` | `ComputedRef<boolean>` | Whether a flag is enabled |
| `useVariant(name)` | `ComputedRef<Variant>` | Variant details for A/B testing |
| `useFlagsStatus()` | `{ ready, flagCount }` | SDK initialization status |
| `useUnleashContext()` | `{ context, updateContext }` | Read/update evaluation context |
| `useAllFlags()` | `ComputedRef<Record<string, EvaluatedFlag>>` | All evaluated flags |

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
