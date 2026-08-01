<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { AdminUser, Paginated, Role } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Foydalanuvchilar — Admin' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const { isAdmin, user: me } = useAuth()

const page = ref(1)
const limit = 15
const search = ref('')
const debouncedSearch = ref('')
const role = ref<Role | 'all'>('all')
const banned = ref<'all' | 'true' | 'false'>('all')
const includeDeleted = ref(false)

const result = ref<Paginated<AdminUser> | null>(null)
const loading = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (debouncedSearch.value = value.trim()), 400)
})

async function load() {
  loading.value = true
  try {
    result.value = await api.get<Paginated<AdminUser>>('/admin/users', {
      page: page.value,
      limit,
      search: debouncedSearch.value || undefined,
      role: role.value === 'all' ? undefined : role.value,
      isBanned: banned.value === 'all' ? undefined : banned.value,
      includeDeleted: includeDeleted.value || undefined,
    })
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}

watch([debouncedSearch, role, banned, includeDeleted], () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)

// Detal oynasi
const detailOpen = ref(false)
const detailId = ref<string | null>(null)
function openDetail(id: string) {
  detailId.value = id
  detailOpen.value = true
}

async function run(action: () => Promise<{ message?: string }>) {
  try {
    const res = await action()
    notify.success(res.message ?? 'Bajarildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

async function changeRole(u: AdminUser, newRole: Role) {
  if (u.role === newRole) return
  if (!await confirm({ title: 'Rolni o‘zgartirish', description: `"${u.username}" roli "${ROLE_META[newRole]?.label}" ga o‘zgartirilsinmi?`, confirmLabel: 'O‘zgartirish', color: 'primary' })) return
  await run(() => api.patch(`/admin/users/${u.id}/role`, { role: newRole }))
}

async function toggleBan(u: AdminUser) {
  if (!u.isBanned && !await confirm({ title: 'Bloklash', description: `"${u.username}" bloklansinmi? U tizimga kira olmaydi.`, confirmLabel: 'Bloklash' })) return
  await run(() => api.patch(`/admin/users/${u.id}/ban`))
}

async function toggleActive(u: AdminUser) {
  await run(() => api.patch(`/admin/users/${u.id}/status`, { isActive: !u.isActive }))
}

async function remove(u: AdminUser) {
  if (!await confirm({ title: 'Foydalanuvchini o‘chirish', description: `"${u.username}" o‘chirilsinmi? Keyinchalik qayta tiklash mumkin.`, confirmLabel: 'O‘chirish' })) return
  await run(() => api.del(`/admin/users/${u.id}`))
}

async function restore(u: AdminUser) {
  await run(() => api.patch(`/admin/users/${u.id}/restore`))
}

function rowActions(u: AdminUser): DropdownMenuItem[][] {
  const isSelf = u.id === me.value?.id
  const groups: DropdownMenuItem[][] = [[{ label: 'Batafsil', icon: 'i-lucide-eye', onSelect: () => openDetail(u.id) }]]
  if (isSelf) return groups

  const moderation: DropdownMenuItem[] = [
    { label: u.isBanned ? 'Blokdan chiqarish' : 'Bloklash', icon: u.isBanned ? 'i-lucide-lock-open' : 'i-lucide-ban', onSelect: () => toggleBan(u) },
  ]
  if (isAdmin.value) {
    moderation.push({ label: u.isActive ? 'Faolsizlantirish' : 'Faollashtirish', icon: u.isActive ? 'i-lucide-user-x' : 'i-lucide-user-check', onSelect: () => toggleActive(u) })
    groups.push(moderation)
    groups.push([{
      label: 'Rolni o‘zgartirish',
      icon: 'i-lucide-user-cog',
      children: (['user', 'moderator', 'admin'] as Role[]).map(r => ({
        label: ROLE_META[r]?.label,
        icon: u.role === r ? 'i-lucide-check' : undefined,
        onSelect: () => changeRole(u, r),
      })),
    }])
    groups.push([u.isDelete
      ? { label: 'Qayta tiklash', icon: 'i-lucide-rotate-ccw', onSelect: () => restore(u) }
      : { label: 'O‘chirish', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => remove(u) }])
  }
  else {
    groups.push(moderation)
  }
  return groups
}

const columns: TableColumn<AdminUser>[] = [
  {
    accessorKey: 'username',
    header: 'Foydalanuvchi',
    cell: ({ row }) => h('div', { class: 'min-w-0' }, [
      h('button', { class: 'font-medium text-highlighted hover:text-primary', onClick: () => openDetail(row.original.id) }, row.original.username),
      h('p', { class: 'text-xs text-muted truncate' }, row.original.fullName || row.original.email),
    ]),
  },
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.email) },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => h(UBadge, { color: ROLE_META[row.original.role]?.color, variant: 'subtle', label: ROLE_META[row.original.role]?.label }),
  },
  { id: 'team', header: 'Jamoa', cell: ({ row }) => row.original.team?.name ?? '—' },
  { accessorKey: 'score', header: 'Ball', cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.score) },
  {
    id: 'status',
    header: 'Holat',
    cell: ({ row }) => {
      const u = row.original
      const badges = []
      if (u.isDelete) badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', label: 'O‘chirilgan' }))
      if (u.isBanned) badges.push(h(UBadge, { color: 'error', variant: 'subtle', label: 'Bloklangan' }))
      if (!u.isActive && !u.isDelete) badges.push(h(UBadge, { color: 'warning', variant: 'subtle', label: 'Faol emas' }))
      if (!badges.length) badges.push(h(UBadge, { color: 'success', variant: 'subtle', label: 'Faol' }))
      return h('div', { class: 'flex flex-wrap gap-1' }, badges)
    },
  },
  { accessorKey: 'createdAt', header: 'Ro‘yxatdan o‘tgan', cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, formatDate(row.original.createdAt)) },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu, { items: rowActions(row.original), content: { align: 'end' } }, () =>
      h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' }))),
  },
]

const roleItems = [
  { label: 'Barcha rollar', value: 'all' },
  { label: 'Foydalanuvchi', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' },
]
const banItems = [
  { label: 'Barchasi', value: 'all' },
  { label: 'Bloklanganlar', value: 'true' },
  { label: 'Bloklanmaganlar', value: 'false' },
]
</script>

<template>
  <AdminPanel title="Foydalanuvchilar" icon="i-lucide-users">
    <template #toolbar>
      <div class="flex w-full flex-wrap items-center gap-2 py-1">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Ism, email yoki username..." class="w-full sm:w-72" />
        <USelect v-model="role" :items="roleItems" class="w-40" />
        <USelect v-model="banned" :items="banItems" class="w-44" />
        <UCheckbox v-model="includeDeleted" label="O‘chirilganlarni ko‘rsatish" />
        <span class="ml-auto text-sm text-muted">Jami: {{ result?.meta.total ?? 0 }}</span>
      </div>
    </template>

    <UTable :data="result?.data ?? []" :columns="columns" :loading="loading" empty="Foydalanuvchilar topilmadi" class="flex-1" />

    <div v-if="(result?.meta.totalPages ?? 0) > 1" class="flex justify-center border-t border-default pt-4">
      <UPagination v-model:page="page" :total="result?.meta.total ?? 0" :items-per-page="limit" />
    </div>

    <AdminUserDetail v-model:open="detailOpen" :user-id="detailId" />
  </AdminPanel>
</template>
