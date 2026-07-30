<script setup lang="ts">
import type { FormError, TableColumn } from '@nuxt/ui'
import type { LoginHistoryItem, Paginated } from '~/types/api'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Profil — CTF Platforma' })

const api = useApi()
const notify = useNotify()
const { user, fetchMe, logout } = useAuth()

const roleMeta = computed(() => ROLE_META[user.value?.role ?? 'user'] ?? ROLE_META.user!)

// ==================== PROFILNI TAHRIRLASH ====================

const profileState = reactive({ fullName: user.value?.fullName ?? '' })
const savingProfile = ref(false)

watch(() => user.value?.fullName, (value) => {
  profileState.fullName = value ?? ''
})

function validateProfile(s: Partial<typeof profileState>): FormError[] {
  const name = s.fullName?.trim() ?? ''
  if (name.length < 2 || name.length > 100) return [{ name: 'fullName', message: 'Ism 2-100 belgidan iborat bo‘lishi kerak' }]
  return []
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await api.patch('/auth/me', { fullName: profileState.fullName.trim() })
    await fetchMe()
    notify.success('Profil yangilandi')
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    savingProfile.value = false
  }
}

// ==================== PAROLNI O'ZGARTIRISH ====================

const passwordState = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const savingPassword = ref(false)

function validatePassword(s: Partial<typeof passwordState>): FormError[] {
  const errors: FormError[] = []
  if (!s.oldPassword) errors.push({ name: 'oldPassword', message: 'Joriy parolni kiriting' })
  if (!s.newPassword || s.newPassword.length < 6) errors.push({ name: 'newPassword', message: 'Parol kamida 6 ta belgidan iborat' })
  else if (s.newPassword === s.oldPassword) errors.push({ name: 'newPassword', message: 'Yangi parol eskisidan farq qilishi kerak' })
  if (s.confirm !== s.newPassword) errors.push({ name: 'confirm', message: 'Parollar mos kelmadi' })
  return errors
}

async function changePassword() {
  savingPassword.value = true
  try {
    const res = await api.post<{ message: string }>('/auth/change-password', {
      oldPassword: passwordState.oldPassword,
      newPassword: passwordState.newPassword,
    })
    // Backend barcha sessiyalarni yopadi, shuning uchun qaytadan kirish kerak
    notify.success('Parol o‘zgartirildi', res.message)
    await logout()
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    savingPassword.value = false
  }
}

// ==================== LOGIN TARIXI ====================

const historyPage = ref(1)
const historyLimit = 10
const { data: history, status: historyStatus } = await useAsyncData(
  'profile:history',
  () => api.get<Paginated<LoginHistoryItem>>('/auth/history', { page: historyPage.value, limit: historyLimit }),
  { watch: [historyPage] },
)

const historyColumns: TableColumn<LoginHistoryItem>[] = [
  { accessorKey: 'createdAt', header: 'Vaqt' },
  { accessorKey: 'ipAddress', header: 'IP manzil' },
  { accessorKey: 'status', header: 'Holat' },
]
</script>

<template>
  <div>
    <PageHeading title="Profil" description="Shaxsiy ma‘lumotlar va xavfsizlik sozlamalari" icon="i-lucide-user" />

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Foydalanuvchi kartasi -->
      <UCard class="lg:row-span-2">
        <div class="flex flex-col items-center text-center">
          <UAvatar :text="user?.username?.[0]?.toUpperCase()" size="3xl" class="mb-3" />
          <h2 class="text-xl font-semibold text-highlighted">
            {{ user?.fullName || user?.username }}
          </h2>
          <p class="text-sm text-muted">
            @{{ user?.username }}
          </p>
          <UBadge :color="roleMeta.color" variant="subtle" :label="roleMeta.label" class="mt-2" />
        </div>

        <USeparator class="my-5" />

        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between gap-2">
            <dt class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-mail" /> Email
            </dt>
            <dd class="truncate text-highlighted">
              {{ user?.email }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-star" /> Masalalar balli
            </dt>
            <dd class="font-mono font-semibold text-primary">
              {{ user?.score ?? 0 }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-users" /> Jamoa
            </dt>
            <dd>
              <ULink v-if="user?.team" to="/team" class="font-medium text-primary">
                {{ user.team.name }} ({{ user.team.score }})
              </ULink>
              <ULink v-else to="/team" class="text-muted underline">
                Jamoa yo‘q
              </ULink>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <dt class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-calendar" /> Ro‘yxatdan o‘tgan
            </dt>
            <dd class="text-highlighted">
              {{ formatDate(user?.createdAt) }}
            </dd>
          </div>
        </dl>
      </UCard>

      <!-- Profilni tahrirlash -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Shaxsiy ma‘lumotlar
          </h3>
        </template>
        <UForm :state="profileState" :validate="validateProfile" class="space-y-4" @submit="saveProfile">
          <UFormField label="Username" description="Username o‘zgartirilmaydi">
            <UInput :model-value="user?.username" disabled class="w-full" />
          </UFormField>
          <UFormField label="To‘liq ism" name="fullName" required>
            <UInput v-model="profileState.fullName" class="w-full" />
          </UFormField>
          <UButton type="submit" label="Saqlash" icon="i-lucide-save" :loading="savingProfile" />
        </UForm>
      </UCard>

      <!-- Parolni o'zgartirish -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Parolni o‘zgartirish
          </h3>
        </template>
        <UForm :state="passwordState" :validate="validatePassword" class="space-y-4" @submit="changePassword">
          <UFormField label="Joriy parol" name="oldPassword" required>
            <UInput v-model="passwordState.oldPassword" type="password" autocomplete="current-password" class="w-full" />
          </UFormField>
          <UFormField label="Yangi parol" name="newPassword" required>
            <UInput v-model="passwordState.newPassword" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <UFormField label="Yangi parolni tasdiqlang" name="confirm" required>
            <UInput v-model="passwordState.confirm" type="password" autocomplete="new-password" class="w-full" />
          </UFormField>
          <p class="text-xs text-muted">
            Parol o‘zgargach barcha qurilmalardan chiqib ketasiz.
          </p>
          <UButton type="submit" color="warning" label="Parolni o‘zgartirish" icon="i-lucide-key-round" :loading="savingPassword" />
        </UForm>
      </UCard>

      <!-- Login tarixi -->
      <UCard class="lg:col-span-2">
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Kirishlar tarixi
          </h3>
        </template>
        <UTable :data="history?.data ?? []" :columns="historyColumns" :loading="historyStatus === 'pending'" empty="Hali kirishlar yo‘q">
          <template #createdAt-cell="{ row }">
            <span :title="formatDateTime(row.original.createdAt)">{{ timeAgo(row.original.createdAt) }}</span>
          </template>
          <template #ipAddress-cell="{ row }">
            <span class="font-mono text-sm">{{ row.original.ipAddress }}</span>
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'success' ? 'success' : 'error'"
              variant="subtle"
              :label="row.original.status === 'success' ? 'Muvaffaqiyatli' : 'Muvaffaqiyatsiz'"
            />
          </template>
        </UTable>
        <div v-if="(history?.meta.totalPages ?? 0) > 1" class="mt-4 flex justify-end">
          <UPagination v-model:page="historyPage" :total="history?.meta.total ?? 0" :items-per-page="historyLimit" />
        </div>
      </UCard>
    </div>
  </div>
</template>
