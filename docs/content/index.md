---
title: nuxt-unleash
navigation: false
---

::u-page-hero
---
title: nuxt-unleash
description: Edge-first Unleash feature flags for Nuxt
links:
  - label: Get Started
    to: /docs/getting-started/installation
    icon: i-lucide-arrow-right
    size: lg
  - label: GitHub
    to: https://github.com/adamkasper/nuxt-unleash
    icon: i-simple-icons-github
    size: lg
    variant: subtle
---
::

::card-group
  ::card{title="Edge-First" icon="i-lucide-zap"}
  Works on Cloudflare Workers, Vercel, and Node.js. No persistent process needed.
  ::

  ::card{title="NuxtHub Native" icon="i-lucide-database"}
  First-class NuxtHub KV integration. One line of config.
  ::

  ::card{title="Zero Dependencies" icon="i-lucide-package"}
  No `unleash-client` SDK. Just `@nuxt/kit` and `defu`. Lightweight fetch client.
  ::

  ::card{title="Type Safe" icon="i-lucide-shield-check"}
  Generated types for `$fetch`, `useFetch`, composables, and server utils.
  ::

  ::card{title="Stale-While-Revalidate" icon="i-lucide-refresh-cw"}
  Lazy refresh on request. No polling on server. Instant responses from cache.
  ::

  ::card{title="SSR + SPA" icon="i-lucide-monitor"}
  Server-side hydration with no flicker. Optional client polling with tab visibility pause.
  ::
::
