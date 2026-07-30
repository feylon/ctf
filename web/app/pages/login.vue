<script setup lang="ts">
import type { FormError } from '@nuxt/ui'

definePageMeta({ layout: 'auth', middleware: 'guest' })
useHead({ title: 'Kirish — CTF Platforma' })

const route = useRoute()
const { login } = useAuth()
const notify = useNotify()

const state = reactive({ username: '', password: '' })
const loading = ref(false)
const errorText = ref('')

function validate(s: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (!s.username?.trim()) errors.push({ name: 'username', message: 'Username yoki emailni kiriting' })
  if (!s.password) errors.push({ name: 'password', message: 'Parolni kiriting' })
  else if (s.password.length < 6) errors.push({ name: 'password', message: 'Parol kamida 6 ta belgidan iborat' })
  return errors
}

async function onSubmit() {
  loading.value = true
  errorText.value = ''
  try {
    const user = await login(state.username.trim(), state.password)
    notify.success(`Xush kelibsiz, ${user.username}!`)
    // Faqat ichki manzillarga qaytaramiz (open redirect'dan himoya)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/'
    await navigateTo(redirect)
  }
  catch (error) {
    errorText.value = apiErrorMessage(error, 'Kirishda xatolik yuz berdi')
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
        Tizimga kirish
      </h1>
      <p class="mt-1 text-sm text-muted">
        Hisobingizga kiring va musobaqani davom ettiring
      </p>
    </div>

    <UAlert v-if="errorText" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="errorText" />

    <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
      <UFormField label="Username yoki email" name="username" required>
        <UInput v-model="state.username" icon="i-lucide-user" placeholder="ali_valiyev" autocomplete="username" class="w-full" autofocus />
      </UFormField>

      <UFormField label="Parol" name="password" required>
        <template #hint>
          <ULink to="/forgot-password" class="text-sm text-primary">
            Parolni unutdingizmi?
          </ULink>
        </template>
        <UInput v-model="state.password" type="password" icon="i-lucide-lock" placeholder="••••••••" autocomplete="current-password" class="w-full" />
      </UFormField>

      <UButton type="submit" label="Kirish" icon="i-lucide-log-in" block :loading="loading" />
    </UForm>

    <p class="text-center text-sm text-muted">
      Hisobingiz yo‘qmi?
      <ULink to="/register" class="font-medium text-primary">
        Ro‘yxatdan o‘ting
      </ULink>
    </p>
  </div>
</template>
