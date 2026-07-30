<script setup lang="ts">
import type { FormError } from '@nuxt/ui'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Ro‘yxatdan o‘tish — CTF Platforma' })

const api = useApi()
const { login } = useAuth()
const notify = useNotify()

const step = ref<1 | 2>(1)
const loading = ref(false)
const errorText = ref('')

const emailState = reactive({ email: '' })
const state = reactive({
  otp: [] as string[],
  username: '',
  fullName: '',
  password: '',
  confirm: '',
})

// ==================== QAYTA YUBORISH TAYMERI ====================

const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | undefined

function startCooldown() {
  cooldown.value = 60
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(cooldownTimer))

// ==================== 1-QADAM: EMAIL ====================

function validateEmail(s: Partial<typeof emailState>): FormError[] {
  if (!s.email?.trim()) return [{ name: 'email', message: 'Email manzilini kiriting' }]
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) return [{ name: 'email', message: 'Email manzili noto‘g‘ri' }]
  return []
}

async function sendOtp() {
  loading.value = true
  errorText.value = ''
  try {
    await api.post('/auth/send-otp', { email: emailState.email.trim().toLowerCase() }, { auth: false })
    notify.success('Tasdiqlash kodi yuborildi', `${emailState.email} manzilini tekshiring`)
    step.value = 2
    startCooldown()
  }
  catch (error) {
    errorText.value = apiErrorMessage(error, 'Kodni yuborib bo‘lmadi')
  }
  finally {
    loading.value = false
  }
}

async function resendOtp() {
  if (cooldown.value > 0) return
  await sendOtp()
}

// ==================== USERNAME TEKSHIRUVI ====================

const usernameStatus = ref<{ available: boolean, message: string } | null>(null)
const checkingUsername = ref(false)
let usernameTimer: ReturnType<typeof setTimeout> | undefined

watch(() => state.username, (value) => {
  usernameStatus.value = null
  clearTimeout(usernameTimer)
  const username = value.trim()
  if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) return

  usernameTimer = setTimeout(async () => {
    checkingUsername.value = true
    try {
      usernameStatus.value = await api.post<{ available: boolean, message: string }>('/auth/check-username', { username }, { auth: false })
    }
    catch {
      usernameStatus.value = null
    }
    finally {
      checkingUsername.value = false
    }
  }, 400)
})

// ==================== 2-QADAM: MA'LUMOTLAR ====================

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if ((s.otp ?? []).join('').length !== 6) errors.push({ name: 'otp', message: '6 xonali kodni kiriting' })

  const username = s.username?.trim() ?? ''
  if (username.length < 3 || username.length > 32) errors.push({ name: 'username', message: 'Username 3-32 belgidan iborat bo‘lishi kerak' })
  else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) errors.push({ name: 'username', message: 'Faqat harf, raqam va _ . - belgilari' })
  else if (usernameStatus.value && !usernameStatus.value.available) errors.push({ name: 'username', message: usernameStatus.value.message })

  if (!s.fullName?.trim()) errors.push({ name: 'fullName', message: 'To‘liq ismingizni kiriting' })
  if (!s.password || s.password.length < 6) errors.push({ name: 'password', message: 'Parol kamida 6 ta belgidan iborat' })
  if (s.confirm !== s.password) errors.push({ name: 'confirm', message: 'Parollar mos kelmadi' })
  return errors
}

async function onRegister() {
  loading.value = true
  errorText.value = ''
  try {
    await api.post('/auth/register', {
      email: emailState.email.trim().toLowerCase(),
      otp: state.otp.join(''),
      username: state.username.trim(),
      fullName: state.fullName.trim(),
      password: state.password,
    }, { auth: false })

    await login(state.username.trim(), state.password)
    notify.success('Ro‘yxatdan o‘tdingiz!', 'Endi jamoa tuzing yoki mavjud jamoaga qo‘shiling')
    await navigateTo('/team')
  }
  catch (error) {
    errorText.value = apiErrorMessage(error, 'Ro‘yxatdan o‘tishda xatolik')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-highlighted">
        Ro‘yxatdan o‘tish
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ step === 1 ? 'Email manzilingizga tasdiqlash kodi yuboramiz' : `Kod ${emailState.email} manziliga yuborildi` }}
      </p>
    </div>

    <UStepper
      :model-value="step - 1"
      :items="[{ title: 'Email', icon: 'i-lucide-mail' }, { title: 'Ma‘lumotlar', icon: 'i-lucide-user-plus' }]"
      size="sm"
      disabled
      class="w-full"
    />

    <UAlert v-if="errorText" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="errorText" />

    <UForm v-if="step === 1" :state="emailState" :validate="validateEmail" class="space-y-4" @submit="sendOtp">
      <UFormField label="Email" name="email" required>
        <UInput v-model="emailState.email" type="email" icon="i-lucide-mail" placeholder="ali@example.com" autocomplete="email" class="w-full" autofocus />
      </UFormField>
      <UButton type="submit" label="Kod yuborish" trailing-icon="i-lucide-arrow-right" block :loading="loading" />
    </UForm>

    <UForm v-else :state="state" :validate="validate" class="space-y-4" @submit="onRegister">
      <UFormField label="Tasdiqlash kodi" name="otp" required>
        <div class="flex flex-col items-center gap-2">
          <UPinInput v-model="state.otp" :length="6" otp placeholder="○" size="lg" />
          <div class="flex w-full items-center justify-between text-sm">
            <UButton variant="link" color="neutral" size="xs" icon="i-lucide-pencil" label="Emailni o‘zgartirish" @click="step = 1" />
            <UButton
              variant="link"
              size="xs"
              :disabled="cooldown > 0 || loading"
              :label="cooldown > 0 ? `Qayta yuborish (${cooldown}s)` : 'Kodni qayta yuborish'"
              @click="resendOtp"
            />
          </div>
        </div>
      </UFormField>

      <UFormField label="Username" name="username" required>
        <UInput v-model="state.username" icon="i-lucide-at-sign" placeholder="ali_valiyev" autocomplete="username" class="w-full" :loading="checkingUsername">
          <template v-if="usernameStatus" #trailing>
            <UIcon
              :name="usernameStatus.available ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
              :class="usernameStatus.available ? 'text-success' : 'text-error'"
            />
          </template>
        </UInput>
        <template v-if="usernameStatus" #help>
          <span :class="usernameStatus.available ? 'text-success' : 'text-error'">{{ usernameStatus.message }}</span>
        </template>
      </UFormField>

      <UFormField label="To‘liq ism" name="fullName" required>
        <UInput v-model="state.fullName" icon="i-lucide-user" placeholder="Ali Valiyev" autocomplete="name" class="w-full" />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Parol" name="password" required>
          <UInput v-model="state.password" type="password" placeholder="••••••••" autocomplete="new-password" class="w-full" />
        </UFormField>
        <UFormField label="Parolni tasdiqlang" name="confirm" required>
          <UInput v-model="state.confirm" type="password" placeholder="••••••••" autocomplete="new-password" class="w-full" />
        </UFormField>
      </div>

      <UButton type="submit" label="Ro‘yxatdan o‘tish" icon="i-lucide-user-plus" block :loading="loading" />
    </UForm>

    <p class="text-center text-sm text-muted">
      Hisobingiz bormi?
      <ULink to="/login" class="font-medium text-primary">
        Kirish
      </ULink>
    </p>
  </div>
</template>
