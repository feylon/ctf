<script setup lang="ts">
import type { AdminChallenge, AdminGroup, FileItem } from '~/types/api'

// Vazifa (challenge) yaratish va tahrirlash oynasi
const props = defineProps<{
  challenge: AdminChallenge | null
  groups: AdminGroup[]
  categories: string[]
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()

const api = useApi()
const notify = useNotify()

const emptyForm = () => ({
  title: '',
  category: '',
  groupId: '',
  description: '',
  flag: '',
  points: 100,
  decrementStep: 10,
  minPoints: 50,
  startTime: '',
  endTime: '',
  allowedIpRange: '*',
  attachmentPath: '',
})

const form = reactive(emptyForm())
const saving = ref(false)
const pickerOpen = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  const c = props.challenge
  Object.assign(form, emptyForm(), c
    ? {
        title: c.title,
        category: c.category,
        groupId: c.group?.id ?? '',
        description: c.description,
        points: c.initialPoints,
        decrementStep: c.decrementStep,
        minPoints: c.minPoints,
        startTime: toLocalInput(c.startTime),
        endTime: toLocalInput(c.endTime),
        allowedIpRange: c.allowedIpRange || '*',
        attachmentPath: c.attachmentPath ?? '',
      }
    : { groupId: props.groups[0]?.id ?? '' })
})

const isEdit = computed(() => !!props.challenge)
const groupItems = computed(() => props.groups.map(g => ({ label: g.name, value: g.id })))
const canSave = computed(() =>
  form.title.trim() && form.category.trim() && form.groupId && form.description.trim() && (isEdit.value || form.flag.trim()),
)

async function save() {
  if (!canSave.value) return
  saving.value = true
  const body: Record<string, unknown> = {
    title: form.title.trim(),
    category: form.category.trim(),
    groupId: form.groupId,
    description: form.description,
    decrementStep: Number(form.decrementStep),
    minPoints: Number(form.minPoints),
    startTime: fromLocalInput(form.startTime),
    endTime: fromLocalInput(form.endTime),
    allowedIpRange: form.allowedIpRange.trim() || '*',
    attachmentPath: form.attachmentPath.trim() || null,
  }
  // Tahrirlashda ball faqat o'zgargan bo'lsa yuboriladi (aks holda joriy dinamik ball qayta tiklanib qoladi)
  if (!isEdit.value || Number(form.points) !== props.challenge?.initialPoints) body.points = Number(form.points)
  if (form.flag.trim()) body.flag = form.flag.trim()

  try {
    if (isEdit.value) {
      await api.patch(`/admin/challenges/${props.challenge!.id}`, body)
      notify.success('Vazifa yangilandi')
    }
    else {
      await api.post('/admin/challenges', body)
      notify.success('Vazifa yaratildi')
    }
    open.value = false
    emit('saved')
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
  <UModal v-model:open="open" :title="isEdit ? 'Vazifani tahrirlash' : 'Yangi vazifa'" :ui="{ content: 'sm:max-w-3xl' }">
    <template #body>
      <form id="challenge-form" class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <UFormField label="Nomi" required class="sm:col-span-2">
          <UInput v-model="form.title" placeholder="SQL Injection Basics" class="w-full" />
        </UFormField>

        <UFormField label="Kategoriya" required>
          <UInput v-model="form.category" placeholder="Web, Crypto, Pwn..." class="w-full" />
          <div v-if="categories.length" class="mt-2 flex flex-wrap gap-1">
            <UButton
              v-for="cat in categories"
              :key="cat"
              size="xs"
              :color="form.category === cat ? 'primary' : 'neutral'"
              variant="soft"
              :label="cat"
              @click="form.category = cat"
            />
          </div>
        </UFormField>

        <UFormField label="Guruh" required>
          <USelect v-model="form.groupId" :items="groupItems" placeholder="Guruhni tanlang" class="w-full" />
        </UFormField>

        <UFormField label="Tavsif (Markdown)" required class="sm:col-span-2">
          <AdminMarkdownEditor v-model="form.description" placeholder="Vazifa sharti..." />
        </UFormField>

        <UFormField
          label="Flag"
          :required="!isEdit"
          :help="isEdit ? 'O‘zgartirmaslik uchun bo‘sh qoldiring' : 'Bazada hashlangan holda saqlanadi'"
          class="sm:col-span-2"
        >
          <UInput v-model="form.flag" placeholder="CTF{...}" class="w-full font-mono" autocomplete="off" />
        </UFormField>

        <div class="grid gap-4 sm:col-span-2 sm:grid-cols-3">
          <UFormField label="Boshlang‘ich ball" required :help="isEdit && challenge ? `Joriy: ${challenge.points}` : undefined">
            <UInputNumber v-model="form.points" :min="1" class="w-full" />
          </UFormField>
          <UFormField label="Har yechimda kamayish">
            <UInputNumber v-model="form.decrementStep" :min="0" class="w-full" />
          </UFormField>
          <UFormField label="Minimal ball">
            <UInputNumber v-model="form.minPoints" :min="1" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Boshlanish vaqti" help="Bo‘sh — darhol ochiq">
          <div class="flex gap-1">
            <UInput v-model="form.startTime" type="datetime-local" class="w-full" />
            <UButton v-if="form.startTime" icon="i-lucide-x" color="neutral" variant="ghost" @click="form.startTime = ''" />
          </div>
        </UFormField>

        <UFormField label="Tugash vaqti" help="Bo‘sh — cheklovsiz">
          <div class="flex gap-1">
            <UInput v-model="form.endTime" type="datetime-local" class="w-full" />
            <UButton v-if="form.endTime" icon="i-lucide-x" color="neutral" variant="ghost" @click="form.endTime = ''" />
          </div>
        </UFormField>

        <UFormField label="Ruxsat etilgan IP" help="* — hammaga; 10.0.0.0/8, 192.168.1.5 (vergul bilan)">
          <UInput v-model="form.allowedIpRange" class="w-full font-mono" />
        </UFormField>

        <UFormField label="Biriktirilgan fayl">
          <div class="flex gap-1">
            <UInput v-model="form.attachmentPath" placeholder="/uploads/..." class="w-full" />
            <UButton icon="i-lucide-folder-open" color="neutral" variant="outline" @click="pickerOpen = true" />
          </div>
        </UFormField>
      </form>

      <AdminFilePicker v-model:open="pickerOpen" @select="(file: FileItem) => (form.attachmentPath = file.url)" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="open = false" />
        <UButton type="submit" form="challenge-form" :loading="saving" :disabled="!canSave" :label="isEdit ? 'Saqlash' : 'Yaratish'" />
      </div>
    </template>
  </UModal>
</template>
