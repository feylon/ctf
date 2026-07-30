<script setup lang="ts">
import type { FormError } from '@nuxt/ui'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Parolni tiklash — CTF Platforma' })

const api = useApi()
const notify = useNotify()

const step = ref<1 | 2>(1)
const loading = ref(false)
const errorText = ref('')

const emailState = reactive({ email: '' })
const state = reactive({ otp: [] as string[], newPassword: '', confirm: '' })

function validateEmail(s: Partial<typeof emailState>): FormError[] {
  if (!s.email?.trim()) return [{ name: 'email', message: 'Email manzilini kiriting' }]
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) return [{ name: 'email', message: 'Email manzili noto‘g‘ri' }]
  return []
}

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if ((s.otp ?? []).join('').length !== 6) errors.push({ name: 'otp', message: '6 xonali kodni kiriting' })
  if (!s.newPassword || s.newPassword.length < 6) errors.push({ name: 'newPassword', message: 'Parol kamida 6 ta belgidan iborat' })
  if (s.confirm !== s.newPassword) errors.push({ name: 'confirm', message: 'Parollar mos kelmadi' })
  return errors
}

async function requestCode() {
  loading.value = true
  errorText.value = ''
  try {
    const res = await api.post<{ message: string }>('/auth/forgot-password', { email: emailState.email.trim().toLowerCase() }, { auth: false })
    notify.info('Kod yuborildi', res.message)
    step.value = 2
  }
  catch (error) {
    errorText.value = apiErrorMessage(error, 'Kodni yuborib bo‘lmadi')
  }
  finally {
    loading.value = false
  }
}

async function resetPassword() {
  loading.value = true
  errorText.value = ''
  try {
    const res = await api.post<{ message: string }>('/auth/reset-password', {
      email: emailState.email.trim().toLowerCase(),
      otp: state.otp.join(''),
      newPassword: state.newPassword,
    }, { auth: false })
    notify.success('Parol yangilandi', res.message)
    await navigateTo('/login')
  }
  catch (error) {
    errorText.value = apiErrorMessage(error, 'Parolni tiklab bo‘lmadi')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <span class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UIcon name="i-lucide-key-round" class="size-6" />
      </span>
      <h1 class="text-2xl font-bold text-highlighted">
        Parolni tiklash
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ step === 1 ? 'Hisobingizga bog‘langan emailni kiriting' : 'Emailga kelgan kod va yangi parolni kiriting' }}
      </p>
    </div>

    <UAlert v-if="errorText" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="errorText" />

    <UForm v-if="step === 1" :state="emailState" :validate="validateEmail" class="space-y-4" @submit="requestCode">
      <UFormField label="Email" name="email" required>
        <UInput v-model="emailState.email" type="email" icon="i-lucide-mail" placeholder="ali@example.com" autocomplete="email" class="w-full" autofocus />
      </UFormField>
      <UButton type="submit" label="Kod yuborish" trailing-icon="i-lucide-arrow-right" block :loading="loading" />
    </UForm>

    <UForm v-else :state="state" :validate="validate" class="space-y-4" @submit="resetPassword">
      <UFormField label="Tiklash kodi" name="otp" required>
        <div class="flex justify-center">
          <UPinInput v-model="state.otp" :length="6" otp placeholder="○" size="lg" />
        </div>
      </UFormField>
      <UFormField label="Yangi parol" name="newPassword" required>
        <UInput v-model="state.newPassword" type="password" icon="i-lucide-lock" placeholder="••••••••" autocomplete="new-password" class="w-full" />
      </UFormField>
      <UFormField label="Yangi parolni tasdiqlang" name="confirm" required>
        <UInput v-model="state.confirm" type="password" icon="i-lucide-lock" placeholder="••••••••" autocomplete="new-password" class="w-full" />
      </UFormField>
      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-arrow-left" label="Orqaga" @click="step = 1" />
        <UButton type="submit" label="Parolni yangilash" icon="i-lucide-check" class="flex-1 justify-center" :loading="loading" />
      </div>
    </UForm>

    <p class="text-center text-sm text-muted">
      Parolingiz esingizga tushdimi?
      <ULink to="/login" class="font-medium text-primary">
        Kirish
      </ULink>
    </p>
  </div>
</template>
