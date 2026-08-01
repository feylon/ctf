<script setup lang="ts">
import type { FileItem, FolderContents } from '~/types/api'

// Fayl menejeridan fayl tanlash oynasi: tanlangan faylning URL manzilini qaytaradi
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [file: FileItem] }>()

const api = useApi()
const notify = useNotify()
const parentId = ref<string | undefined>()
const contents = ref<FolderContents | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    contents.value = await api.get<FolderContents>('/admin/file-manager', { parentId: parentId.value })
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) load()
})
watch(parentId, load)

function choose(file: FileItem) {
  emit('select', file)
  open.value = false
}

const crumbs = computed(() => [
  { label: 'Fayllar', icon: 'i-lucide-hard-drive', onClick: () => { parentId.value = undefined } },
  ...(contents.value?.breadcrumbs ?? []).map(b => ({ label: b.name, onClick: () => { parentId.value = b.id } })),
])
</script>

<template>
  <UModal v-model:open="open" title="Fayl tanlash" description="Vazifaga biriktiriladigan faylni tanlang" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <UBreadcrumb :items="crumbs" class="mb-4" />

      <div v-if="loading" class="flex flex-col gap-2">
        <USkeleton v-for="i in 4" :key="i" class="h-10" />
      </div>

      <div v-else-if="contents" class="flex flex-col gap-1">
        <button
          v-for="folder in contents.folders"
          :key="folder.id"
          type="button"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-elevated"
          @click="parentId = folder.id"
        >
          <UIcon name="i-lucide-folder" class="size-5 text-warning" />
          <span class="flex-1 truncate">{{ folder.name }}</span>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-muted" />
        </button>

        <button
          v-for="file in contents.files"
          :key="file.id"
          type="button"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-elevated disabled:opacity-50"
          :disabled="!file.existsOnDisk"
          @click="choose(file)"
        >
          <UIcon name="i-lucide-file" class="size-5 text-muted" />
          <span class="flex-1 truncate">{{ file.originalName }}</span>
          <span class="text-xs text-muted">{{ formatBytes(file.size) }}</span>
        </button>

        <p v-if="!contents.folders.length && !contents.files.length" class="py-6 text-center text-sm text-muted">
          Bu papka bo‘sh. Fayllarni “Fayllar” bo‘limida yuklang.
        </p>
      </div>
    </template>
  </UModal>
</template>
