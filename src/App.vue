<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style>
:root {
  --primary-color: #1890ff;
  --error-color: #ff4d4f;
  --text-color: #333;
  --border-color: #d9d9d9;
  --bg-color: #f5f5f5;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--primary-color) 80%, black);
}

.error-text {
  color: var(--error-color);
}

.app {
  min-height: 100vh;
}

.header {
  background: white;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.header h1 {
  max-width: 800px;
  margin: 0 auto;
  font-size: 24px;
}

main {
  padding: 0 16px;
}
</style> 