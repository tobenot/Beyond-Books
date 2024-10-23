<template>
  <div class="sections-container">
    <h2>{{ $t('chooseSection') }}</h2>
    <div v-for="chapter in chapters" :key="chapter.title" class="chapter">
      <h3>{{ chapter.title }}</h3>
      <div v-for="section in chapter.sections" :key="section.id" class="section">
        <button 
          v-if="isSectionUnlocked(section.id)" 
          @click="chooseSection(section.file)"
          class="button"
        >
          {{ section.title }}
        </button>
        <span v-else class="locked-section">
          {{ section.title }} ({{ $t('locked') }})
        </span>
      </div>
    </div>
    <button class="button" @click="returnToMenu">{{ $t('returnToMenu') }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const chapters = computed(() => store.state.sections.chapters)
const unlockedSections = computed(() => store.state.sections.unlockedSections)

const isSectionUnlocked = (sectionId) => {
  return unlockedSections.value.includes(sectionId)
}

const chooseSection = async (fileName) => {
  await store.dispatch('sections/loadSection', fileName)
  router.push('/story')
}

const returnToMenu = () => {
  router.push('/')
}
</script>
