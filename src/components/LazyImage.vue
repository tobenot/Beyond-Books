<template>
  <div class="lazy-image-container">
    <img 
      :src="isLoaded ? src : ''" 
      :alt="alt"
      class="lazy-image"
      :class="{ 'is-loaded': isLoaded }"
      @load="onLoad"
      @error="onError"
    >
    <div v-if="!isLoaded" class="image-placeholder">
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { defineProps } from 'vue'  // 添加这行
import { imageLoader } from '@/utils/imageLoader'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  }
})

const isLoaded = ref(imageLoader.isImageLoaded(props.src))

onMounted(async () => {
  if (!isLoaded.value) {
    try {
      await imageLoader.preloadImage(props.src)
      isLoaded.value = true
    } catch (error) {
      console.error('图片加载失败:', error)
    }
  }
})

const onLoad = () => isLoaded.value = true
const onError = () => console.error('Image load error:', props.src)
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  min-height: 100px;
}

.lazy-image {
  width: 100%;
  height: auto;
  opacity: 0;
  transition: opacity 0.3s;
}

.lazy-image.is-loaded {
  opacity: 1;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  width: 100%;
  height: 100%;
  min-height: 100px;
}
</style>
