<script setup lang="ts">
import type { AdminProblem } from '~/types/api'

// Masala yaratish va tahrirlash oynasi
const props = defineProps<{ problem: AdminProblem | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()

const api = useApi()
const notify = useNotify()

const emptyForm = () => ({ code: '', title: '', category: '', difficulty: 10, points: 10, flag: '', description: '' })
const form = reactive(emptyForm())
const saving = ref(false)
const isEdit = computed(() => !!props.problem)

watch(open, (isOpen) => {
  if (!isOpen) return
  const p = props.problem
  Object.assign(form, emptyForm(), p
    ? { code: p.code, title: p.title, category: p.category, difficulty: p.difficulty, points: p.points, description: p.description }
    : {})
})

const canSave = computed(() =>
  form.code.trim() && form.title.trim() && form.category.trim() && form.description.trim() && (isEdit.value || form.flag.trim()),
)
const difficulty = computed(() => difficultyMeta(Number(form.difficulty)))

async function save() {
  if (!canSave.value) return
  saving.value = true
  const body: Record<string, unknown> = {
    code: form.code.trim(),
    title: form.title.trim(),
    category: form.category.trim(),
    difficulty: Number(form.difficulty),
    points: Number(form.points),
    description: form.description,
  }
  if (form.flag.trim()) body.flag = form.flag.trim()

  try {
    if (isEdit.value) {
      await api.patch(`/admin/problems/${props.problem!.id}`, body)
      notify.success('Masala yangilandi')
    }
    else {
      await api.post('/admin/problems', body)
      notify.success('Masala yaratildi')
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
  <UModal v-model:open="open" :title="isEdit ? 'Masalani tahrirlash' : 'Yangi masala'" :ui="{ content: 'sm:max-w-3xl' }">
    <template #body>
      <form id="problem-form" class="grid gap-4 sm:grid-cols-2" @submit.prevent="save">
        <UFormField label="Kod" required help="Masalan: A0001">
          <UInput v-model="form.code" class="w-full font-mono uppercase" />
        </UFormField>
        <UFormField label="Nomi" required>
          <UInput v-model="form.title" placeholder="A+B" class="w-full" />
        </UFormField>
        <UFormField label="Toifa" required>
          <UInput v-model="form.category" placeholder="Matematika, DP, Graflar..." class="w-full" />
        </UFormField>
        <UFormField label="Ball" required>
          <UInputNumber v-model="form.points" :min="0" class="w-full" />
        </UFormField>
        <UFormField :label="`Qiyinlik: ${form.difficulty}`" class="sm:col-span-2">
          <div class="flex items-center gap-4">
            <USlider v-model="form.difficulty" :min="0" :max="100" class="flex-1" />
            <UBadge :color="difficulty.color" variant="subtle" :label="difficulty.label" class="w-24 justify-center" />
          </div>
        </UFormField>
        <UFormField
          label="To‘g‘ri javob (flag)"
          :required="!isEdit"
          :help="isEdit ? 'O‘zgartirmaslik uchun bo‘sh qoldiring' : 'Bazada hashlangan holda saqlanadi'"
          class="sm:col-span-2"
        >
          <UInput v-model="form.flag" class="w-full font-mono" autocomplete="off" />
        </UFormField>
        <UFormField label="Masala sharti (Markdown)" required class="sm:col-span-2">
          <AdminMarkdownEditor v-model="form.description" :rows="10" placeholder="Masala sharti, kirish/chiqish formatlari, misollar..." />
        </UFormField>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="open = false" />
        <UButton type="submit" form="problem-form" :loading="saving" :disabled="!canSave" :label="isEdit ? 'Saqlash' : 'Yaratish'" />
      </div>
    </template>
  </UModal>
</template>
