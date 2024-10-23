// 在文件顶部添加
import { defineOptions } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

<template>
  <div class="sections-container">
    <h2>{{ $t('chooseSection') }}</h2>
    <div v-for="chapter in chapters" :key="chapter.title" class="chapter">
      <h3>{{ chapter.title }}</h3>
      <div v-for="section in chapter.sections" :key="section.id" class="section">
        <template v-if="isSectionCompleted(section.id)">
          <button 
            class="button completed" 
            @click="replaySection(section.file)"
          >
            {{ section.title }} ({{ $t('completed') }}) - {{ $t('replay') }}
          </button>
        </template>
        <template v-else-if="isSectionUnlocked(section.id)">
          <div class="section-content">
            <img :src="section.image" :alt="`${section.title} thumbnail`">
            <button 
              class="button" 
              @click="chooseSection(section.file)"
            >
              {{ section.title }}
            </button>
            <button 
              class="button button-skip" 
              @click="skipSection(section.file)"
            >
              {{ $t('skip') }} {{ section.title }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="locked-section">
            {{ section.title }} ({{ $t('locked') }})
          </div>
        </template>
      </div>
    </div>
    <button class="button" @click="returnToMenu">{{ $t('returnToMenu') }}</button>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

// 添加组件名称定义
defineOptions({
  name: 'SectionsView'
})

const store = useStore()
const router = useRouter()

// 添加 i18n 实例
const { t } = useI18n()

// 计算属性
const chapters = computed(() => store.state.sections.chapters)

// 修复 getter 的使用方式
const isSectionUnlocked = (sectionId) => {
  return store.getters['sections/isSectionUnlocked'](sectionId)
}

const isSectionCompleted = (sectionId) => {
  return store.getters['sections/isSectionCompleted'](sectionId)
}

// 方法
const chooseSection = async (fileName) => {
  await store.dispatch('sections/loadSection', fileName)
  const section = store.getters['sections/getCurrentSection']
  await store.dispatch('game/initializeGame', section)
  router.push('/story')
}

const replaySection = async (fileName) => {
  await store.dispatch('sections/loadSection', fileName)
  const section = store.getters['sections/getCurrentSection']
  await store.dispatch('game/initializeGame', { section, isReplay: true })
  router.push('/story')
}

const skipSection = async (fileName) => {
  await store.dispatch('sections/skipSection', fileName)
  // 使用 t 函数替代 $t
  useToast().success(t('sectionSkipped'))
}

const returnToMenu = () => {
  router.push('/')
}

onMounted(() => {
  if (chapters.value.length === 0) {
    store.dispatch('sections/loadSectionsIndex')
  }
})
</script>

<style scoped>
/* 可以添加一些基本样式 */
.sections-container {
  padding: 20px;
}

.chapter {
  margin-bottom: 20px;
}

.section {
  margin-bottom: 10px;
}

.section-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
}

.section-content img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.locked-section {
  color: #888;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #4CAF50;
  color: white;
  transition: background 0.3s;
}

.button:hover {
  background: #45a049;
}

.button.completed {
  background: #2196F3;
}

.button-skip {
  background: #ff9800;
}

.button-skip:hover {
  background: #f57c00;
}
</style>
