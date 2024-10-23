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

// 添加组件名称定义
defineOptions({
  name: 'SectionsView'
})

const store = useStore()
const router = useRouter()

// 计算属性
const chapters = computed(() => store.state.sections.chapters)
const unlockedSections = computed(() => store.state.sections.unlockedSections)
const completedSections = computed(() => store.state.sections.completedSections)
const isSectionUnlocked = computed(() => store.getters['sections/isSectionUnlocked'])
const isSectionCompleted = computed(() => store.getters['sections/isSectionCompleted'])

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
  this.$toast.success(this.$t('sectionSkipped'))
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
}

.section-content img {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}

.locked-section {
  color: #888;
}

.button-skip {
  margin-left: 10px;
}
</style>
