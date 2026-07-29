<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--ui-color-primary-500)/12%,transparent_60%)]" />
    <div class="relative mb-8">
      <AppLogo />
    </div>
    <UCard class="relative w-full max-w-md">
      <slot />
    </UCard>
    <UButton to="/" variant="link" color="neutral" icon="i-lucide-arrow-left" label="Bosh sahifaga qaytish" class="relative mt-6" />
  </div>
</template>
