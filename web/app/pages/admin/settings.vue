<script setup lang="ts">
import type { TournamentSettings } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Musobaqa sozlamalari — Admin' })

const api = useApi()
const notify = useNotify()
const { isAdmin } = useAuth()
const tournament = useTournament()

const settings = ref<TournamentSettings | null>(null)
const form = reactive({ isLive: true, globalStartTime: '', globalEndTime: '' })
const loading = ref(true)
const saving = ref(false)

function fill(s: TournamentSettings) {
  settings.value = s
  form.isLive = s.isLive
  form.globalStartTime = toLocalInput(s.globalStartTime)
  form.globalEndTime = toLocalInput(s.globalEndTime)
}

async function load() {
  loading.value = true
  try {
    fill(await api.get<TournamentSettings>('/admin/settings'))
    await tournament.refresh()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

const rangeError = computed(() =>
  form.globalStartTime && form.globalEndTime && new Date(form.globalStartTime) >= new Date(form.globalEndTime)
    ? 'Tugash vaqti boshlanish vaqtidan keyin bo‘lishi kerak'
    : '',
)

async function save() {
  if (rangeError.value) return
  saving.value = true
  try {
    const res = await api.patch<{ message: string, settings: TournamentSettings }>('/admin/settings', {
      isLive: form.isLive,
      globalStartTime: fromLocalInput(form.globalStartTime),
      globalEndTime: fromLocalInput(form.globalEndTime),
    })
    fill(res.settings)
    await tournament.refresh()
    notify.success(res.message)
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminPanel title="Musobaqa sozlamalari" icon="i-lucide-settings">
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <UAlert
        v-if="tournament.meta.value"
        :color="tournament.meta.value.color"
        variant="subtle"
        :icon="tournament.meta.value.icon"
        :title="tournament.meta.value.label"
      >
        <template v-if="tournament.countdownTarget.value" #description>
          {{ tournament.status.value?.state === 'not_started' ? 'Boshlanishiga' : 'Tugashiga' }}:
          <CountdownTimer :target="tournament.countdownTarget.value" compact />
        </template>
      </UAlert>

      <UAlert
        v-if="!isAdmin"
        color="info"
        variant="subtle"
        icon="i-lucide-lock"
        title="Faqat ko‘rish rejimi"
        description="Sozlamalarni faqat administrator o‘zgartira oladi"
      />

      <USkeleton v-if="loading" class="h-72" />

      <UCard v-else>
        <form class="flex flex-col gap-6" @submit.prevent="save">
          <USwitch
            v-model="form.isLive"
            :disabled="!isAdmin"
            label="Musobaqa faol"
            description="O‘chirilsa, barcha flag yuborishlar vaqtincha to‘xtatiladi"
          />

          <USeparator />

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Boshlanish vaqti" help="Bo‘sh — cheklovsiz">
              <div class="flex gap-1">
                <UInput v-model="form.globalStartTime" type="datetime-local" :disabled="!isAdmin" class="w-full" />
                <UButton v-if="isAdmin && form.globalStartTime" icon="i-lucide-x" color="neutral" variant="ghost" @click="form.globalStartTime = ''" />
              </div>
            </UFormField>
            <UFormField label="Tugash vaqti" help="Bo‘sh — cheklovsiz" :error="rangeError || undefined">
              <div class="flex gap-1">
                <UInput v-model="form.globalEndTime" type="datetime-local" :disabled="!isAdmin" class="w-full" />
                <UButton v-if="isAdmin && form.globalEndTime" icon="i-lucide-x" color="neutral" variant="ghost" @click="form.globalEndTime = ''" />
              </div>
            </UFormField>
          </div>

          <p v-if="settings" class="text-xs text-muted">
            Oxirgi o‘zgarish: {{ formatDateTime(settings.updatedAt) }}
          </p>

          <div v-if="isAdmin" class="flex justify-end">
            <UButton type="submit" icon="i-lucide-save" label="Saqlash" :loading="saving" :disabled="!!rangeError" />
          </div>
        </form>
      </UCard>
    </div>
  </AdminPanel>
</template>
