<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Paginated, ProblemCategory, ProblemListItem } from '~/types/api'

useHead({ title: 'Masalalar — CTF Platforma' })

const api = useApi()
const notify = useNotify()
const route = useRoute()
const router = useRouter()
const { loggedIn } = useAuth()

// Filtrlar URL query bilan sinxron (sahifani yangilaganda saqlanadi)
const search = ref((route.query.search as string) ?? '')
const category = ref<string>((route.query.category as string) ?? 'all')
const sort = ref<string>((route.query.sort as string) ?? 'code:ASC')
const page = ref(Number(route.query.page) || 1)
const limit = 20

const result = ref<Paginated<ProblemListItem> | null>(null)
const categories = ref<ProblemCategory[]>([])
const loading = ref(true)

const sortOptions = [
  { label: 'Kod bo‘yicha', value: 'code:ASC' },
  { label: 'Avval osonlari', value: 'difficulty:ASC' },
  { label: 'Avval qiyinlari', value: 'difficulty:DESC' },
  { label: 'Ko‘p ball', value: 'points:DESC' },
  { label: 'Ko‘p yechilgan', value: 'solved:DESC' },
]

const categoryOptions = computed(() => [
  { label: 'Barcha toifalar', value: 'all' },
  ...categories.value.map(c => ({ label: `${c.category} (${c.count})`, value: c.category })),
])

async function load() {
  loading.value = true
  const [sortField, order] = sort.value.split(':')
  try {
    result.value = await api.get<Paginated<ProblemListItem>>('/problems', {
      page: page.value,
      limit,
      search: search.value.trim() || undefined,
      category: category.value === 'all' ? undefined : category.value,
      sort: sortField,
      order,
    })
  }
  catch (e) {
    notify.error(e)
  }
  finally {
    loading.value = false
  }
  router.replace({
    query: {
      search: search.value || undefined,
      category: category.value === 'all' ? undefined : category.value,
      sort: sort.value === 'code:ASC' ? undefined : sort.value,
      page: page.value > 1 ? page.value : undefined,
    },
  })
}

onMounted(async () => {
  load()
  try {
    categories.value = await api.get<ProblemCategory[]>('/problems/categories', undefined, { auth: false })
  }
  catch {
    // Toifalar olinmasa filtr bo'sh qoladi
  }
})

// Qidiruv kiritilganda biroz kutib so'rov yuboriladi
let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
})
watch([category, sort], () => {
  page.value = 1
  load()
})
watch(page, load)

const UIcon = resolveComponent('UIcon')
const UBadge = resolveComponent('UBadge')
const ULink = resolveComponent('NuxtLink')

const columns: TableColumn<ProblemListItem>[] = [
  {
    id: 'status',
    header: '',
    cell: ({ row }) => {
      if (row.original.isSolved) return h(UIcon, { name: 'i-lucide-circle-check', class: 'size-5 text-success' })
      if (row.original.isAttempted) return h(UIcon, { name: 'i-lucide-circle-dot', class: 'size-5 text-warning' })
      return h(UIcon, { name: 'i-lucide-circle', class: 'size-5 text-dimmed' })
    },
  },
  {
    accessorKey: 'code',
    header: 'Kod',
    cell: ({ row }) => h('span', { class: 'font-mono text-muted' }, row.original.code),
  },
  {
    accessorKey: 'title',
    header: 'Nomi',
    cell: ({ row }) => h(ULink, {
      to: `/problems/${row.original.id}`,
      class: 'font-medium text-highlighted hover:text-primary',
    }, () => row.original.title),
  },
  {
    accessorKey: 'category',
    header: 'Toifa',
    cell: ({ row }) => h(UBadge, { color: categoryColor(row.original.category), variant: 'subtle', label: row.original.category }),
  },
  {
    accessorKey: 'difficulty',
    header: 'Qiyinlik',
    cell: ({ row }) => {
      const d = difficultyMeta(row.original.difficulty)
      return h(UBadge, { color: d.color, variant: 'outline', label: `${d.label} · ${row.original.difficulty}` })
    },
  },
  {
    accessorKey: 'points',
    header: 'Ball',
    cell: ({ row }) => h('span', { class: 'font-mono font-semibold text-primary' }, String(row.original.points)),
  },
  {
    accessorKey: 'solvedCount',
    header: 'Yechganlar',
    cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.solvedCount)),
  },
  {
    accessorKey: 'successRate',
    header: 'Muvaffaqiyat',
    cell: ({ row }) => h('span', { class: 'font-mono text-muted' }, `${row.original.successRate}%`),
  },
]
</script>

<template>
  <div>
    <PageHeading title="Masalalar" description="Algoritmik masalalarni yeching va shaxsiy reytingingizni oshiring" icon="i-lucide-code-xml" />

    <UAlert
      v-if="!loggedIn"
      class="mb-6"
      color="info"
      variant="subtle"
      icon="i-lucide-info"
      title="Javob yuborish uchun tizimga kiring"
      :actions="[{ label: 'Kirish', to: '/login', color: 'info', variant: 'solid' }]"
    />

    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Nomi yoki kodi bo‘yicha qidirish…" class="flex-1" />
      <USelect v-model="category" :items="categoryOptions" class="sm:w-56" />
      <USelect v-model="sort" :items="sortOptions" class="sm:w-48" />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable :data="result?.data ?? []" :columns="columns" :loading="loading" empty="Masalalar topilmadi" />
    </UCard>

    <div class="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p class="text-sm text-muted">
        Jami: {{ result?.meta.total ?? 0 }} ta masala
      </p>
      <UPagination
        v-if="(result?.meta.totalPages ?? 0) > 1"
        v-model:page="page"
        :total="result?.meta.total ?? 0"
        :items-per-page="limit"
      />
    </div>
  </div>
</template>
