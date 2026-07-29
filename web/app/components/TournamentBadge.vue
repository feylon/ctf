<script setup lang="ts">
// Header'da musobaqa holati va qolgan vaqtni ko'rsatadi
const { status, meta, countdownTarget } = useTournament()
</script>

<template>
  <UTooltip v-if="status && meta" :text="meta.label">
    <UBadge :color="meta.color" variant="subtle" :icon="meta.icon" class="hidden whitespace-nowrap lg:inline-flex">
      <CountdownTimer v-if="countdownTarget" :target="countdownTarget" compact />
      <span v-else>{{ meta.label }}</span>
    </UBadge>
  </UTooltip>
</template>
