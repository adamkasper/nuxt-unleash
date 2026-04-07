---
seo:
  title: Edge-first Unleash feature flags for Nuxt
  description: Feature flags that work on Cloudflare Workers, Vercel, and Node.js. No unleash-client SDK, stale-while-revalidate caching, zero flicker SSR.
---

::u-page-hero
#title
Feature flags for the edge.

#description
Unleash feature flags for Nuxt that work everywhere — Cloudflare Workers, Vercel, Node.js. :br No SDK, no flicker, no Node.js-only dependencies.

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
  Star on GitHub
  :::
::

::u-page-section
  :::u-page-grid
    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Edge-First]{.text-primary}
    #description
    No `unleash-client` SDK, no Node.js-only APIs. Runs on Cloudflare Workers, Vercel, Deno, or plain Node.js — anywhere Nitro runs.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Zero Flicker]{.text-primary} SSR
    #description
    Flags are resolved server-side during rendering and hydrated to the client. No `undefined` state, no layout shift.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [NuxtHub]{.text-primary} Native
    #description
    First-class NuxtHub KV integration. One config line gives you persistent, edge-local flag storage on Cloudflare.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    Reactive [Composables]{.text-primary}
    #description
    Auto-imported `useFlag`, `useVariant`, `useAllFlags`, and `useFlagsStatus` — all reactive, all type-safe.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Stale-While-Revalidate]{.text-primary}
    #description
    Instant responses from cache, background refresh when stale. No polling on the server — just lazy, per-request revalidation.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Pluggable Storage]{.text-primary}
    #description
    NuxtHub KV, any Nitro/unstorage driver (Redis, Cloudflare KV, filesystem), or simple in-memory.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Zero Dependencies]{.text-primary}
    #description
    No `unleash-client` SDK. Just `@nuxt/kit` and `defu`. Lightweight, auditable, no supply chain bloat.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    class: col-span-2 lg:col-span-1
    ---
    #title
    [Type Safe]{.text-primary}
    #description
    Generated type declarations for composables, server utils, `$fetch`, and `useFetch`. Full autocompletion in your IDE.
    ::::
  :::
::
