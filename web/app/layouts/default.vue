<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { user, loggedIn, isStaff, logout } = useAuth()

const navItems = computed<NavigationMenuItem[]>(() => [
  { label: 'Vazifalar', icon: 'i-lucide-flag', to: '/challenges', active: route.path.startsWith('/challenges') },
  { label: 'Masalalar', icon: 'i-lucide-code-xml', to: '/problems', active: route.path.startsWith('/problems') },
  { label: 'Reyting', icon: 'i-lucide-trophy', to: '/scoreboard' },
  { label: 'Yangiliklar', icon: 'i-lucide-newspaper', to: '/news', active: route.path.startsWith('/news') },
])

const userMenu = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.username ?? '', avatar: { text: user.value?.username?.[0]?.toUpperCase() }, type: 'label' }],
  [
    { label: 'Profil', icon: 'i-lucide-user', to: '/profile' },
    { label: 'Mening jamoam', icon: 'i-lucide-users', to: '/team' },
    ...(isStaff.value ? [{ label: 'Admin panel', icon: 'i-lucide-shield', to: '/admin' }] : []),
  ],
  [{ label: 'Chiqish', icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => logout() }],
])
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <UHeader>
      <template #left>
        <AppLogo />
      </template>

      <UNavigationMenu :items="navItems" variant="link" />

      <template #right>
        <TournamentBadge />
        <UColorModeButton />
        <template v-if="loggedIn">
          <UDropdownMenu :items="userMenu" :content="{ align: 'end' }">
            <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down">
              <UAvatar :text="user?.username?.[0]?.toUpperCase()" size="xs" />
              <span class="hidden max-w-32 truncate sm:inline">{{ user?.username }}</span>
            </UButton>
          </UDropdownMenu>
        </template>
        <template v-else>
          <UButton to="/login" color="neutral" variant="ghost" label="Kirish" class="hidden sm:inline-flex" />
          <UButton to="/register" label="Ro‘yxatdan o‘tish" />
        </template>
      </template>

      <template #body>
        <UNavigationMenu :items="navItems" orientation="vertical" class="-mx-2.5" />
        <USeparator class="my-4" />
        <div v-if="loggedIn" class="flex flex-col gap-1">
          <UButton to="/profile" icon="i-lucide-user" label="Profil" color="neutral" variant="ghost" />
          <UButton to="/team" icon="i-lucide-users" label="Mening jamoam" color="neutral" variant="ghost" />
          <UButton v-if="isStaff" to="/admin" icon="i-lucide-shield" label="Admin panel" color="neutral" variant="ghost" />
          <UButton icon="i-lucide-log-out" label="Chiqish" color="error" variant="ghost" @click="logout()" />
        </div>
        <div v-else class="flex flex-col gap-2">
          <UButton to="/login" label="Kirish" color="neutral" variant="outline" block />
          <UButton to="/register" label="Ro‘yxatdan o‘tish" block />
        </div>
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} CTF.uz — Capture The Flag platformasi
        </p>
      </template>
      <template #right>
        <UButton to="/news" variant="link" color="neutral" label="Yangiliklar" />
        <UButton to="/scoreboard" variant="link" color="neutral" label="Reyting" />
      </template>
    </UFooter>
  </div>
</template>
