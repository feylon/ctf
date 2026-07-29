<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user, isAdmin, logout } = useAuth()
const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => [
  [
    { label: 'Boshqaruv paneli', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
    { label: 'Foydalanuvchilar', icon: 'i-lucide-users', to: '/admin/users' },
    { label: 'Jamoalar', icon: 'i-lucide-shield-half', to: '/admin/teams' },
    { label: 'Guruhlar', icon: 'i-lucide-folder-kanban', to: '/admin/groups' },
    { label: 'Vazifalar (CTF)', icon: 'i-lucide-flag', to: '/admin/challenges' },
    { label: 'Yechimlar', icon: 'i-lucide-list-checks', to: '/admin/submissions' },
    { label: 'Masalalar', icon: 'i-lucide-code-xml', to: '/admin/problems' },
    { label: 'Yangiliklar', icon: 'i-lucide-newspaper', to: '/admin/news' },
    { label: 'Fayllar', icon: 'i-lucide-hard-drive', to: '/admin/files' },
    ...(isAdmin.value ? [{ label: 'Musobaqa sozlamalari', icon: 'i-lucide-settings', to: '/admin/settings' }] : []),
  ],
  [
    { label: 'Saytga qaytish', icon: 'i-lucide-arrow-left', to: '/' },
  ],
])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar v-model:open="open" collapsible resizable class="bg-elevated/25" :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <AppLogo v-if="!collapsed" />
        <UIcon v-else name="i-lucide-flag" class="mx-auto size-5 text-primary" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :items="links[0]" orientation="vertical" tooltip popover />
        <UNavigationMenu :collapsed="collapsed" :items="links[1]" orientation="vertical" tooltip class="mt-auto" />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu
          :items="[[{ label: 'Profil', icon: 'i-lucide-user', to: '/profile' }], [{ label: 'Chiqish', icon: 'i-lucide-log-out', color: 'error', onSelect: () => logout() }]]"
          :content="{ align: 'center', collisionPadding: 12 }"
        >
          <UButton
            :avatar="{ text: user?.username?.[0]?.toUpperCase() }"
            :label="collapsed ? undefined : user?.username"
            :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-elevated"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
