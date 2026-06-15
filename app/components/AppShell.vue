<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <section :class="containerClass">
      <nav class="mb-10 flex items-center justify-between gap-4">
        <div>
          <NuxtLink :to="eyebrowLink" class="inline-block text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            {{ eyebrow }}
          </NuxtLink>
          <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {{ title }}
          </h1>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="navLinkClass(item.to)"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <slot />
    </section>
  </main>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  eyebrow?: string
  eyebrowLink?: string
}>(), {
  eyebrow: 'Sprite Forge',
  eyebrowLink: '/',
})

const route = useRoute()
const navItems = [
  { label: 'Workspace', to: '/' },
  { label: 'Editor', to: '/editor' },
  { label: 'History', to: '/jobs' },
  { label: 'Settings', to: '/settings' },
]

const containerClass = 'mx-auto w-full max-w-6xl px-6 py-10 sm:py-16'

function isActive(path: string) {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

function navLinkClass(path: string) {
  return [
    'rounded-full border px-4 py-2 text-sm transition',
    isActive(path)
      ? 'border-cyan-500 bg-cyan-950/70 text-cyan-100'
      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-slate-100',
  ]
}
</script>
