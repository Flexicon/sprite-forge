<template>
  <AppShell title="Settings">

      <div v-if="pending" class="max-w-3xl text-sm text-slate-500">Loading settings...</div>
      <div v-else-if="error" class="max-w-3xl rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm text-red-200">
        Failed to load settings.
      </div>
      <div v-else-if="settings" class="max-w-3xl space-y-6">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">OpenRouter</h2>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">API key configured</span>
              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="settings.apiKeyConfigured ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'"
              >
                {{ settings.apiKeyConfigured ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Default model</span>
              <span class="text-slate-200">{{ settings.model }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Storage</h2>
          <div class="mt-4 space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Storage directory</span>
              <span class="text-slate-200">{{ settings.storageDir }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Database</span>
              <span class="text-slate-200">{{ settings.database.ok ? 'OK' : 'Error' }} — {{ settings.database.path }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Filesystem</span>
              <span class="text-slate-200">{{ settings.storage.ok ? 'OK' : 'Error' }} — {{ settings.storage.path }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Supported sizes</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="size in settings.supportedSizes"
              :key="size"
              class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-300"
            >
              {{ size }}x{{ size }}
            </span>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 class="text-lg font-bold text-slate-100">Style presets</h2>
          <div class="mt-4 space-y-3">
            <div
              v-for="preset in settings.stylePresets"
              :key="preset.id"
              class="rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <p class="text-sm font-semibold text-slate-100">{{ preset.name }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ preset.prompt }}</p>
            </div>
          </div>
        </div>
      </div>
  </AppShell>
</template>

<script setup lang="ts">
import type { SettingsResponse } from '~/types'

const { data: settings, pending, error } = await useFetch<SettingsResponse>('/api/settings')
</script>
