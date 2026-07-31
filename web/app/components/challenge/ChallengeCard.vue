<script setup lang="ts">
import type { Challenge } from '~/types/api'

defineProps<{ challenge: Challenge }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <button
    type="button"
    class="group relative flex w-full flex-col gap-3 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"
    :class="challenge.solved
      ? 'border-success/50 bg-success/10 hover:border-success'
      : challenge.isClosed
        ? 'border-default bg-elevated/30 opacity-70 hover:border-accented'
        : 'border-default bg-elevated/40 hover:border-primary/60'"
    @click="$emit('open')"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-elevated" :class="categoryTextClass(challenge.category)">
        <UIcon :name="categoryIcon(challenge.category)" class="size-5" />
      </span>
      <UBadge v-if="challenge.solved" color="success" variant="subtle" icon="i-lucide-check" label="Yechilgan" size="sm" />
      <UBadge v-else-if="challenge.isClosed" color="neutral" variant="subtle" icon="i-lucide-lock" label="Yopilgan" size="sm" />
      <UBadge v-else-if="!challenge.groupJoined" color="warning" variant="subtle" icon="i-lucide-lock-keyhole" label="Guruh yopiq" size="sm" />
    </div>

    <p class="line-clamp-2 font-semibold text-highlighted">
      {{ challenge.title }}
    </p>

    <div class="mt-auto flex items-center justify-between text-sm">
      <span class="font-mono text-lg font-bold" :class="challenge.solved ? 'text-success' : 'text-primary'">
        {{ challenge.points }}
        <span class="text-xs font-normal text-muted">ball</span>
      </span>
      <span class="flex items-center gap-1 text-muted">
        <UIcon name="i-lucide-users" class="size-4" />
        {{ challenge.solveCount }}
      </span>
    </div>
  </button>
</template>
