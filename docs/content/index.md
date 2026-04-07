---
seo:
  title: nuxt-unleash
  description: Edge-first Unleash feature flags for Nuxt
---

::u-page-hero
#title
nuxt-unleash

#description
Edge-first Unleash feature flags for Nuxt. Works on Cloudflare Workers, Vercel, and Node.js.

#links
  :::u-button
  ---
  size: xl
  to: /docs/getting-started/installation
  trailing-icon: i-ph-arrow-right-duotone
  ---
  Get Started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-ph-github-logo-duotone
  size: xl
  to: https://github.com/adamkasper/nuxt-unleash
  variant: outline
  ---
  GitHub
  :::
::

::u-page-section
#title
Features

#features
  :::u-page-feature
  ---
  icon: i-ph-lightning-duotone
  ---
  #title
  Edge-First

  #description
  Works on Cloudflare Workers, Vercel, and Node.js. No persistent process needed.
  :::

  :::u-page-feature
  ---
  icon: i-ph-database-duotone
  ---
  #title
  NuxtHub Native

  #description
  First-class NuxtHub KV integration. One line of config.
  :::

  :::u-page-feature
  ---
  icon: i-ph-package-duotone
  ---
  #title
  Zero Dependencies

  #description
  No unleash-client SDK. Just @nuxt/kit and defu.
  :::

  :::u-page-feature
  ---
  icon: i-ph-shield-check-duotone
  ---
  #title
  Type Safe

  #description
  Generated types for $fetch, useFetch, composables, and server utils.
  :::

  :::u-page-feature
  ---
  icon: i-ph-arrows-clockwise-duotone
  ---
  #title
  Stale-While-Revalidate

  #description
  Lazy refresh on request. No polling on server. Instant responses from cache.
  :::

  :::u-page-feature
  ---
  icon: i-ph-monitor-duotone
  ---
  #title
  SSR + SPA

  #description
  Server-side hydration with no flicker. Optional client polling with tab visibility pause.
  :::
::
