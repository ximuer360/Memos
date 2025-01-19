<template>
  <div class="login-container">
    <div class="login-box">
      <h2>管理员登录</h2>
      <div class="error" v-if="error">{{ error }}</div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username"
            v-model="username"
            required
            autocomplete="username"
          >
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password"
            v-model="password"
            required
            autocomplete="current-password"
          >
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(username.value, password.value)
    router.push('/admin')
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e.message || '用户名或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1890ff;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #ff4d4f;
  margin-bottom: 1rem;
  text-align: center;
}
</style> 