<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { FileItem, FolderContents, FolderItem } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'staff' })
useHead({ title: 'Fayllar — Admin' })

const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')
const UTooltip = resolveComponent('UTooltip')

const MAX_SIZE = 10 * 1024 * 1024

const api = useApi()
const notify = useNotify()
const confirm = useConfirm()
const route = useRoute()
const router = useRouter()

// Joriy papka URL query'da saqlanadi (sahifa yangilanganda yo'qolmasligi uchun)
const parentId = computed(() => (route.query.folder as string | undefined) || undefined)
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
watch(parentId, load)
onMounted(load)

function openFolder(id?: string) {
  router.push({ query: id ? { folder: id } : {} })
}

const crumbs = computed(() => [
  { label: 'Fayllar', icon: 'i-lucide-hard-drive', to: { query: {} } },
  ...(contents.value?.breadcrumbs ?? []).map(b => ({ label: b.name, to: { query: { folder: b.id } } })),
])

// Papka yaratish / nomini o'zgartirish
const folderModal = ref(false)
const editingFolder = ref<FolderItem | null>(null)
const folderName = ref('')
const folderSaving = ref(false)

function openCreateFolder() {
  editingFolder.value = null
  folderName.value = ''
  folderModal.value = true
}

function openRenameFolder(folder: FolderItem) {
  editingFolder.value = folder
  folderName.value = folder.name
  folderModal.value = true
}

async function saveFolder() {
  const name = folderName.value.trim()
  if (!name) return
  folderSaving.value = true
  try {
    if (editingFolder.value) {
      await api.patch(`/admin/file-manager/folders/${editingFolder.value.id}`, { name })
      notify.success('Papka nomi o‘zgartirildi')
    }
    else {
      await api.post('/admin/file-manager/folders', { name, parentId: parentId.value })
      notify.success('Papka yaratildi')
    }
    folderModal.value = false
    await load()
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    folderSaving.value = false
  }
}

async function removeFolder(folder: FolderItem) {
  if (!await confirm({ title: 'Papkani o‘chirish', description: `"${folder.name}" papkasi ichidagi barcha papka va fayllar bilan birga o‘chiriladi.`, confirmLabel: 'O‘chirish' })) return
  try {
    const res = await api.del<{ message: string }>(`/admin/file-manager/folders/${folder.id}`)
    notify.success(res.message)
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

function folderActions(folder: FolderItem): DropdownMenuItem[][] {
  return [
    [{ label: 'Ochish', icon: 'i-lucide-folder-open', onSelect: () => openFolder(folder.id) }],
    [{ label: 'Nomini o‘zgartirish', icon: 'i-lucide-pencil', onSelect: () => openRenameFolder(folder) }],
    [{ label: 'O‘chirish', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => removeFolder(folder) }],
  ]
}

// Fayl yuklash
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  uploading.value = true
  let uploaded = 0
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      notify.error(null, `"${file.name}" hajmi 10 MB dan katta`)
      continue
    }
    const formData = new FormData()
    formData.append('file', file)
    if (parentId.value) formData.append('folderId', parentId.value)
    try {
      await api.post('/admin/file-manager/upload', formData)
      uploaded++
    }
    catch (e) {
      notify.error(e, `"${file.name}" yuklanmadi`)
    }
  }
  uploading.value = false
  if (uploaded) notify.success(`${uploaded} ta fayl yuklandi`)
  await load()
}

async function copyLink(file: FileItem) {
  await navigator.clipboard.writeText(fileUrl(file.url))
  notify.success('Havola nusxalandi', file.url)
}

async function removeFile(file: FileItem) {
  if (!await confirm({ title: 'Faylni o‘chirish', description: `"${file.originalName}" bazadan va diskdan o‘chirilsinmi?`, confirmLabel: 'O‘chirish' })) return
  try {
    await api.del(`/admin/file-manager/files/${file.id}`)
    notify.success('Fayl o‘chirildi')
    await load()
  }
  catch (e) {
    notify.error(e)
  }
}

function fileIcon(mimetype: string) {
  if (mimetype.startsWith('image/')) return 'i-lucide-file-image'
  if (mimetype.includes('zip') || mimetype.includes('compressed') || mimetype.includes('tar')) return 'i-lucide-file-archive'
  if (mimetype.startsWith('text/') || mimetype.includes('json')) return 'i-lucide-file-text'
  if (mimetype === 'application/pdf') return 'i-lucide-file-type'
  return 'i-lucide-file'
}

const columns: TableColumn<FileItem>[] = [
  {
    accessorKey: 'originalName',
    header: 'Nomi',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2 min-w-0' }, [
      h(UIcon, { name: fileIcon(row.original.mimetype), class: 'size-5 shrink-0 text-muted' }),
      h('span', { class: 'truncate font-medium text-highlighted' }, row.original.originalName),
      !row.original.existsOnDisk
        ? h(UTooltip, { text: row.original.warning ?? 'Diskda topilmadi' }, () => h(UIcon, { name: 'i-lucide-triangle-alert', class: 'size-4 text-warning' }))
        : null,
    ]),
  },
  { accessorKey: 'size', header: 'Hajmi', cell: ({ row }) => h('span', { class: 'tabular-nums text-sm' }, formatBytes(row.original.size)) },
  { accessorKey: 'mimetype', header: 'Turi', cell: ({ row }) => h('span', { class: 'text-xs text-muted' }, row.original.mimetype) },
  { accessorKey: 'createdAt', header: 'Yuklangan', cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, formatDateTime(row.original.createdAt)) },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, { icon: 'i-lucide-link', color: 'neutral', variant: 'ghost', size: 'sm', title: 'Havolani nusxalash', onClick: () => copyLink(row.original) }),
      h(UButton, { icon: 'i-lucide-external-link', color: 'neutral', variant: 'ghost', size: 'sm', to: fileUrl(row.original.url), target: '_blank' }),
      h(UButton, { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'sm', onClick: () => removeFile(row.original) }),
    ]),
  },
]
</script>

<template>
  <AdminPanel title="Fayllar" icon="i-lucide-hard-drive">
    <template #actions>
      <UButton icon="i-lucide-folder-plus" label="Papka" color="neutral" variant="outline" @click="openCreateFolder" />
      <UButton icon="i-lucide-upload" label="Yuklash" :loading="uploading" @click="fileInput?.click()" />
      <input ref="fileInput" type="file" multiple class="hidden" @change="onFilesSelected">
    </template>

    <template #toolbar>
      <div class="flex w-full items-center gap-2 py-1">
        <UBreadcrumb :items="crumbs" />
        <span class="ml-auto text-xs text-muted">Maksimal hajm: 10 MB</span>
      </div>
    </template>

    <div v-if="loading && !contents" class="flex flex-col gap-2">
      <USkeleton v-for="i in 5" :key="i" class="h-10" />
    </div>

    <template v-else-if="contents">
      <UEmpty
        v-if="!contents.folders.length && !contents.files.length"
        icon="i-lucide-folder-open"
        title="Papka bo‘sh"
        description="Fayl yuklang yoki yangi papka yarating"
        :actions="[
          { label: 'Fayl yuklash', icon: 'i-lucide-upload', onClick: () => fileInput?.click() },
          { label: 'Papka yaratish', icon: 'i-lucide-folder-plus', color: 'neutral', variant: 'outline', onClick: openCreateFolder },
        ]"
      />

      <template v-else>
        <div v-if="contents.folders.length" class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="folder in contents.folders"
            :key="folder.id"
            class="group flex items-center gap-3 rounded-lg border border-default p-3 transition hover:border-primary/50 hover:bg-elevated/50"
          >
            <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="openFolder(folder.id)">
              <UIcon name="i-lucide-folder" class="size-6 shrink-0 text-warning" />
              <span class="truncate font-medium">{{ folder.name }}</span>
            </button>
            <UDropdownMenu :items="folderActions(folder)" :content="{ align: 'end' }">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="sm" />
            </UDropdownMenu>
          </div>
        </div>

        <UTable v-if="contents.files.length" :data="contents.files" :columns="columns" :loading="loading" />
      </template>
    </template>

    <UModal v-model:open="folderModal" :title="editingFolder ? 'Papka nomini o‘zgartirish' : 'Yangi papka'">
      <template #body>
        <form id="folder-form" @submit.prevent="saveFolder">
          <UFormField label="Papka nomi" required help="/ va \ belgilari ishlatilmaydi">
            <UInput v-model="folderName" autofocus class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Bekor qilish" @click="folderModal = false" />
          <UButton type="submit" form="folder-form" :loading="folderSaving" :disabled="!folderName.trim()" label="Saqlash" />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
