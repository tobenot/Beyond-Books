<template>
  <div class="lazy-image-container">
    <img 
      v-if="isLoaded"
      :src="src" 
      :alt="alt"
      class="lazy-image"
      @load="onLoad"
      @error="onError"
    >
    <div v-else class="image-placeholder">
      <span>加载中...</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { imageLoader } from '@/utils/imageLoader'

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const isLoaded = ref(imageLoader.isImageLoaded(props.src))

    onMounted(async () => {
      if (!isLoaded.value) {
        try {
          await imageLoader.preloadImage(props.src)
          isLoaded.value = true
        } catch (error) {
          console.error('Failed to load image:', error)
        }
      }
    })

    return {
      isLoaded,
      onLoad: () => isLoaded.value = true,
      onError: () => console.error('Image load error:', props.src)
    }
  }
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  min-height: 100px;
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

.lazy-image {
  width: 100%;
  height: auto;
}
</style>
