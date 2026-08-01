<script setup lang="ts">
import type { AdminGroup } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Guruhlar — Admin' })

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const { isAdmin } = useAuth()

const groups = ref<AdminGroup[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    groups.value = await api.get<AdminGroup[]>('/admin/groups')
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}
onMounted(load)

// Yaratish / nomini o'zgartirish oynasi
const modalOpen = ref(false)
const editing = ref<AdminGroup | null>(null)
const name = ref('')
const saving = ref(false)

function openCreate() {
  editing.value = null
  name.value = ''
  modalOpen.value = true
}

function openEdit(group: AdminGroup) {
  editing.value = group
  name.value = group.name
  modalOpen.value = true
}

async function save() {
  if (!name.value.trim()) return
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/admin/groups/${editing.value.id}`, { name: name.value.trim() })
      notify.success('Guruh nomi yangilandi')
    }
    else {
      await api.post('/admin/groups', { name: name.value.trim() })
      notify.success('Guruh yaratildi')
    }
    modalOpen.value = false
    await load()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    saving.value = false
  }
}

async function remove(group: AdminGroup) {
  if (!await confirm({ title: 'Guruhni o‘chirish', description: `"${group.name}" guruhi o‘chirilsinmi? Ichida vazifalar bo‘lsa o‘chirib bo‘lmaydi.`, confirmLabel: 'O‘chirish' })) return
  try {
    await api.del(`/admin/groups/${group.id}`)
    notify.success('Guruh o‘chirildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}
</script>

<template>
  <AdminPanel title="Challenge guruhlari" icon="i-lucide-folder-kanban">
    <template #actions>
      <UButton v-if="isAdmin" icon="i-lucide-plus" label="Yangi guruh" @click="openCreate" />
    </template>

    <div v-if="loading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="i in 3" :key="i" class="h-40" />
    </div>

    <UEmpty
      v-else-if="!groups.length"
      icon="i-lucide-folder-kanban"
      title="Guruhlar yo‘q"
      description="Vazifalar guruhlarga biriktiriladi. Jamoalar guruhga qo‘shilgach vazifalarni yecha oladi."
      :actions="isAdmin ? [{ label: 'Guruh yaratish', icon: 'i-lucide-plus', onClick: openCreate }] : []"
    />

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard v-for="group in groups" :key="group.id">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h3 class="truncate font-semibold text-highlighted">
              {{ group.name }}
            </h3>
            <div v-if="isAdmin" class="flex shrink-0 gap-1">
              <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(group)" />
              <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="remove(group)" />
            </div>
          </div>
        </template>

        <div class="flex gap-6 text-sm">
          <div>
            <p class="text-2xl font-bold tabular-nums text-highlighted">
              {{ group.challenges.length }}
            </p>
            <p class="text-muted">
              vazifa
            </p>
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-highlighted">
              {{ group.teamCount }}
            </p>
            <p class="text-muted">
              jamoa
            </p>
          </div>
        </div>

        <div v-if="group.challenges.length" class="mt-4 flex flex-wrap gap-1.5">
          <UBadge
            v-for="c in group.challenges.slice(0, 8)"
            :key="c.id"
            :color="categoryColor(c.category)"
            variant="subtle"
            :label="`${c.title} · ${c.points}`"
          />
          <UBadge v-if="group.challenges.length > 8" color="neutral" variant="outline" :label="`+${group.challenges.length - 8}`" />
        </div>
      </UCard>
    </div>

    <UModal v-model:open="modalOpen" :title="editing ? 'Guruh nomini o‘zgartirish' : 'Yangi guruh'">
      <template #body>
        <form id="group-form" @submit.prevent="save">
          <UFormField label="Guruh nomi" required>
            <UInput v-model="name" placeholder="Masalan: Web Security 2026" autofocus class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="modalOpen = false" />
          <UButton type="submit" form="group-form" :loading="saving" :disabled="!name.trim()" label="Saqlash" />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
