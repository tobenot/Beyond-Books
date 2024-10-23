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

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'SectionsContainer',
  computed: {
    ...mapState('sections', ['chapters', 'unlockedSections'])
  },
  methods: {
    ...mapActions('sections', ['loadSection']),
    isSectionUnlocked(sectionId) {
      return this.unlockedSections.includes(sectionId)
    },
    async chooseSection(fileName) {
      await this.loadSection(fileName)
      this.$router.push('/story')
    },
    returnToMenu() {
      this.$router.push('/')
    }
  }
}
</script>
