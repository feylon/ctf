<script setup lang="ts">
const props = defineProps<{ target: string | Date | null, compact?: boolean }>()
const { parts, remaining } = useCountdown(() => props.target)

const pad = (n: number) => String(n).padStart(2, '0')
const segments = computed(() => [
  { value: parts.value.days, label: 'kun' },
  { value: parts.value.hours, label: 'soat' },
  { value: parts.value.minutes, label: 'daq' },
  { value: parts.value.seconds, label: 'son' },
])
</script>

<template>
  <span v-if="remaining !== null && compact" class="font-mono tabular-nums">
    <template v-if="parts.days">{{ parts.days }}k </template>{{ pad(parts.hours) }}:{{ pad(parts.minutes) }}:{{ pad(parts.seconds) }}
  </span>
  <div v-else-if="remaining !== null" class="flex gap-3">
    <div v-for="s in segments" :key="s.label" class="flex min-w-16 flex-col items-center rounded-lg bg-elevated px-3 py-2">
      <span class="font-mono text-2xl font-bold tabular-nums text-highlighted">{{ pad(s.value) }}</span>
      <span class="text-xs text-muted">{{ s.label }}</span>
    </div>
  </div>
</template>
