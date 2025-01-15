<template>
  <div class="app">
    <header class="header">
      <h1>Memos</h1>
    </header>
    <main>
      <HomeView />
    </main>
  </div>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f5f5;
  color: #333;
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