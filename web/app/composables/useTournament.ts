import type { TournamentState, TournamentStatus } from '~/types/api'

export const TOURNAMENT_STATE_META: Record<TournamentState, { label: string, color: 'success' | 'warning' | 'info' | 'neutral', icon: string }> = {
  running: { label: 'Musobaqa davom etmoqda', color: 'success', icon: 'i-lucide-radio' },
  paused: { label: 'Musobaqa to‘xtatilgan', color: 'warning', icon: 'i-lucide-pause-circle' },
  not_started: { label: 'Musobaqa hali boshlanmagan', color: 'info', icon: 'i-lucide-clock' },
  finished: { label: 'Musobaqa yakunlangan', color: 'neutral', icon: 'i-lucide-flag-triangle-right' },
}

// Musobaqa holati barcha sahifalar uchun umumiy (bir marta yuklanadi)
export function useTournament() {
  const api = useApi()
  const status = useState<TournamentStatus | null>('tournament:status', () => null)

  async function refresh() {
    try {
      status.value = await api.get<TournamentStatus>('/tournament/status', undefined, { auth: false })
    }
    catch {
      // Holat olinmasa sahifa ishlashda davom etadi
    }
    return status.value
  }

  const meta = computed(() => (status.value ? TOURNAMENT_STATE_META[status.value.state] : null))

  // Keyingi muhim vaqt: boshlanishgacha yoki tugashgacha
  const countdownTarget = computed(() => {
    if (!status.value) return null
    if (status.value.state === 'not_started') return status.value.globalStartTime
    if (status.value.state === 'running') return status.value.globalEndTime
    return null
  })

  return { status, meta, countdownTarget, refresh }
}

export function useCountdown(target: MaybeRefOrGetter<string | Date | null | undefined>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => (now.value = Date.now()), 1000)
  })
  onBeforeUnmount(() => clearInterval(timer))

  const remaining = computed(() => {
    const value = toValue(target)
    if (!value) return null
    return Math.max(0, new Date(value).getTime() - now.value)
  })

  const parts = computed(() => {
    const ms = remaining.value ?? 0
    const total = Math.floor(ms / 1000)
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    }
  })

  return { remaining, parts }
}
