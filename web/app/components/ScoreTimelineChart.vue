<script setup lang="ts">
import type { TimelineSeries } from '~/types/api'

// Top jamoalarning ball o'sishi: zinapoyali (step) chiziqli grafik, kutubxonasiz SVG.
// Ranglar tekshirilgan kategorial palitradan qat'iy tartibda olinadi (8 tadan oshmaydi).
const props = withDefaults(defineProps<{
  series: TimelineSeries[]
  highlightId?: string | null
  height?: number
}>(), { highlightId: null, height: 300 })

const MAX_SERIES = 8
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

const container = ref<HTMLElement | null>(null)
const width = ref(640)
let observer: ResizeObserver | undefined

onMounted(() => {
  if (!container.value) return
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = Math.max(280, Math.floor(entry.contentRect.width))
  })
  observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

// Rang jamoaga bog'lanadi (reytingdagi o'rniga emas): seriya tartibi API dan keladi
const visibleSeries = computed(() =>
  props.series.slice(0, MAX_SERIES).map((s, i) => ({
    ...s,
    slot: i + 1,
    pts: s.points.map(p => ({ t: new Date(p.at).getTime(), v: p.score })),
  })),
)

const domain = computed(() => {
  const times = visibleSeries.value.flatMap(s => s.pts.map(p => p.t))
  const now = Date.now()
  const minT = times.length ? Math.min(...times) : now - 3600_000
  const maxT = Math.max(now, ...(times.length ? times : [now]))
  // Boshlanish nuqtasi birinchi yechimdan biroz oldin
  const span = Math.max(maxT - minT, 60_000)
  const maxV = Math.max(10, ...visibleSeries.value.flatMap(s => s.pts.map(p => p.v)))
  return { t0: minT - span * 0.03, t1: maxT, maxV: niceMax(maxV) }
})

function niceMax(v: number) {
  const exp = 10 ** Math.floor(Math.log10(v))
  const n = v / exp
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return nice * exp
}

const innerW = computed(() => width.value - PAD.left - PAD.right)
const innerH = computed(() => props.height - PAD.top - PAD.bottom)

const x = (t: number) => PAD.left + ((t - domain.value.t0) / (domain.value.t1 - domain.value.t0)) * innerW.value
const y = (v: number) => PAD.top + innerH.value - (v / domain.value.maxV) * innerH.value

// Zinapoyali yo'l: ball faqat yechim paytida o'zgaradi
const paths = computed(() =>
  visibleSeries.value.map((s) => {
    let d = `M${x(domain.value.t0)},${y(0)}`
    let prev = 0
    for (const p of s.pts) {
      d += ` H${x(p.t)} V${y(p.v)}`
      prev = p.v
    }
    d += ` H${x(domain.value.t1)}`
    return { id: s.id, slot: s.slot, d, last: prev }
  }),
)

const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(domain.value.maxV * f)))

const xTicks = computed(() => {
  const count = width.value < 500 ? 3 : 5
  return Array.from({ length: count }, (_, i) => domain.value.t0 + ((domain.value.t1 - domain.value.t0) * i) / (count - 1))
})

function formatTick(t: number) {
  const d = new Date(t)
  const sameDay = new Date(domain.value.t0).toDateString() === new Date(domain.value.t1).toDateString()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return sameDay ? hm : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${hm}`
}

// Hover: vertikal kursor chizig'i va barcha seriyalar qiymati
const hoverT = ref<number | null>(null)

function onMove(e: PointerEvent) {
  const svg = e.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * width.value
  if (px < PAD.left || px > width.value - PAD.right) {
    hoverT.value = null
    return
  }
  hoverT.value = domain.value.t0 + ((px - PAD.left) / innerW.value) * (domain.value.t1 - domain.value.t0)
}

function valueAt(pts: { t: number, v: number }[], t: number) {
  let v = 0
  for (const p of pts) {
    if (p.t <= t) v = p.v
    else break
  }
  return v
}

const tooltipRows = computed(() => {
  if (hoverT.value === null) return []
  return visibleSeries.value
    .map(s => ({ id: s.id, name: s.name, slot: s.slot, value: valueAt(s.pts, hoverT.value!) }))
    .sort((a, b) => b.value - a.value)
})

const tooltipLeft = computed(() => {
  if (hoverT.value === null) return 0
  const px = x(hoverT.value)
  return px > width.value * 0.6 ? px - 12 : px + 12
})
const tooltipAlignRight = computed(() => hoverT.value !== null && x(hoverT.value) > width.value * 0.6)
</script>

<template>
  <div class="viz-root">
    <!-- Legenda: 2 va undan ortiq seriya bo'lsa doim ko'rsatiladi -->
    <ul v-if="visibleSeries.length > 1" class="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <li v-for="s in visibleSeries" :key="s.id" class="flex items-center gap-2" :class="highlightId && highlightId !== s.id ? 'text-muted' : 'text-default'">
        <span class="inline-block h-0.5 w-4 rounded-full" :style="{ background: `var(--series-${s.slot})` }" />
        <span :class="{ 'font-semibold text-highlighted': s.id === highlightId }">{{ s.name }}</span>
      </li>
    </ul>

    <div ref="container" class="relative w-full">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        class="block touch-none select-none"
        role="img"
        aria-label="Jamoalar ballining vaqt bo‘yicha o‘zgarishi"
        @pointermove="onMove"
        @pointerleave="hoverT = null"
      >
        <!-- Gorizontal panjara (yengil) -->
        <g>
          <template v-for="v in yTicks" :key="v">
            <line :x1="PAD.left" :x2="width - PAD.right" :y1="y(v)" :y2="y(v)" class="grid-line" />
            <text :x="PAD.left - 8" :y="y(v)" text-anchor="end" dominant-baseline="middle" class="axis-text">{{ v }}</text>
          </template>
          <text v-for="t in xTicks" :key="t" :x="x(t)" :y="height - 8" text-anchor="middle" class="axis-text">{{ formatTick(t) }}</text>
        </g>

        <!-- Seriyalar: ajratilgan jamoa ustida chiziladi -->
        <g fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
          <path
            v-for="p in [...paths].sort((a, b) => (a.id === highlightId ? 1 : 0) - (b.id === highlightId ? 1 : 0))"
            :key="p.id"
            :d="p.d"
            :stroke="`var(--series-${p.slot})`"
            :stroke-width="p.id === highlightId ? 3 : 2"
            :opacity="highlightId && p.id !== highlightId ? 0.55 : 1"
          />
        </g>

        <!-- Kursor chizig'i va nuqtalar -->
        <g v-if="hoverT !== null">
          <line :x1="x(hoverT)" :x2="x(hoverT)" :y1="PAD.top" :y2="PAD.top + innerH" class="crosshair" />
          <circle
            v-for="r in tooltipRows"
            :key="r.id"
            :cx="x(hoverT)"
            :cy="y(r.value)"
            r="4"
            :fill="`var(--series-${r.slot})`"
            class="marker"
          />
        </g>
      </svg>

      <div
        v-if="hoverT !== null && tooltipRows.length"
        class="pointer-events-none absolute top-2 z-10 min-w-40 rounded-md border border-default bg-default/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
        :style="tooltipAlignRight ? { right: `${width - tooltipLeft}px` } : { left: `${tooltipLeft}px` }"
      >
        <p class="mb-1 text-muted">
          {{ formatDateTime(new Date(hoverT)) }}
        </p>
        <div v-for="r in tooltipRows" :key="r.id" class="flex items-center gap-2 py-0.5">
          <span class="inline-block h-0.5 w-3 shrink-0 rounded-full" :style="{ background: `var(--series-${r.slot})` }" />
          <span class="font-mono font-semibold text-highlighted">{{ r.value }}</span>
          <span class="truncate text-muted">{{ r.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Kategorial palitra (yorug' rejim) — validatsiyadan o'tgan tartib */
.viz-root {
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;
  --series-5: #e87ba4;
  --series-6: #008300;
  --series-7: #4a3aa7;
  --series-8: #e34948;
}

/* Qorong'i rejim uchun alohida tanlangan pog'onalar */
:global(.dark) .viz-root {
  --series-1: #3987e5;
  --series-2: #d95926;
  --series-3: #199e70;
  --series-4: #c98500;
  --series-5: #d55181;
  --series-6: #008300;
  --series-7: #9085e9;
  --series-8: #e66767;
}

.grid-line {
  stroke: var(--ui-border);
  stroke-width: 1;
}

.axis-text {
  fill: var(--ui-text-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.crosshair {
  stroke: var(--ui-text-muted);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.marker {
  stroke: var(--ui-bg);
  stroke-width: 2;
}
</style>
