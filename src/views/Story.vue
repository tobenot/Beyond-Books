<template>
  <div class="story-container">
    <h2>{{ section.title }}</h2>
    
    <lazy-image 
      v-if="section.image"
      :src="section.image" 
      :alt="section.title"
    />
    
    <music-player
      v-if="section.musicUrl"
      :music-url="section.musicUrl"
    />
    
    <!-- 其他内容... -->
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import LazyImage from '@/components/LazyImage.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'

export default defineComponent({
  name: 'StoryView',
  components: {
    LazyImage,
    MusicPlayer
  },
  computed: {
    section() {
      return this.$store.state.sections.currentSection
    }
  }
})
</script>

<style scoped>
.story-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.text-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.controls input {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.suggestions-container {
  margin-bottom: 20px;
}

.suggestion {
  padding: 8px;
  margin-bottom: 5px;
  background: #f0f0f0;
  border-radius: 4px;
}

.interaction-stage,
.loading {
  text-align: center;
  padding: 10px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  margin-bottom: 10px;
}
</style>
