<script setup lang="ts">
defineProps<{
  sizes: number[]
  modelValue: number
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', Number(target.value))
}
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm font-semibold text-slate-100">{{ label }}</label>
    <select
      :value="modelValue"
      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
      @change="onChange"
    >
      <option
        v-for="size in sizes"
        :key="size"
        :value="size"
      >
        {{ size }} x {{ size }} px
      </option>
    </select>
  </div>
</template>
