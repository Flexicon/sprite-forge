<script setup lang="ts">
type StylePreset = {
  id: string
  name: string
  prompt: string
}

defineProps<{
  presets: StylePreset[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm font-semibold text-slate-100">Style preset</label>
    <select
      :value="modelValue"
      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
      @change="onChange"
    >
      <option
        v-for="preset in presets"
        :key="preset.id"
        :value="preset.id"
      >
        {{ preset.name }}
      </option>
    </select>
    <p class="text-xs text-slate-500">
      {{ presets.find(p => p.id === modelValue)?.prompt ?? '' }}
    </p>
  </div>
</template>
