<template>
  <div v-if="visible" class="image-viewer" @click="close">
    <img :src="imageUrl" :alt="imageUrl" @click.stop>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const imageUrl = ref('')

const show = (url: string) => {
  imageUrl.value = url
  visible.value = true
}

const close = () => {
  visible.value = false
}

defineExpose({
  show,
  close
})
</script>

<style scoped>
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: zoom-out;
}

.image-viewer img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  cursor: default;
}
</style> 