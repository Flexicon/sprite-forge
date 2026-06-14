<script setup lang="ts">
defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const options = [1, 2, 3] as const
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm font-semibold text-slate-100">Number of variants</label>
    <div class="flex gap-2">
      <button
        v-for="count in options"
        :key="count"
        type="button"
        class="rounded-xl border px-4 py-2 text-sm font-semibold transition"
        :class="modelValue === count
          ? 'border-cyan-500 bg-cyan-950 text-cyan-100'
          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'"
        @click="emit('update:modelValue', count)"
      >
        {{ count }}
      </button>
    </div>
  </div>
</template>
