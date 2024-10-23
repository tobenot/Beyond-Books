<template>
  <div class="music-player" v-if="musicUrl">
    <iframe 
      v-if="isBilibili"
      :src="musicUrl"
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="false"
      style="width:100%; height:100%;"
    ></iframe>
    <iframe 
      v-else-if="isNetease"
      :src="musicUrl"
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="false"
      style="width:330px; height:86px;"
    ></iframe>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { defineProps } from 'vue'  // 添加这行

const props = defineProps({
  musicUrl: {
    type: String,
    required: true
  }
})

const isBilibili = computed(() => props.musicUrl.includes('bilibili.com'))
const isNetease = computed(() => props.musicUrl.includes('music.163.com'))
</script>

<style scoped>
.music-player {
  width: 100%;
  margin: 10px 0;
  display: flex;
  justify-content: center;
}
</style>
