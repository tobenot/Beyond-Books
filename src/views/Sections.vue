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

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  name: 'SectionsView',
  computed: {
    ...mapState('sections', ['chapters', 'unlockedSections', 'completedSections']),
    ...mapGetters('sections', ['isSectionUnlocked', 'isSectionCompleted'])
  },
  methods: {
    ...mapActions('sections', ['loadSection', 'skipSection']),
    ...mapActions('game', ['initializeGame']),
    async chooseSection(fileName) {
      await this.loadSection(fileName)
      const section = this.$store.getters['sections/getCurrentSection']
      await this.initializeGame(section)
      this.$router.push('/story')
    },
    async replaySection(fileName) {
      await this.loadSection(fileName)
      const section = this.$store.getters['sections/getCurrentSection']
      await this.initializeGame(section, true) // 传入 true 表示这是重玩
      this.$router.push('/story')
    },
    async skipSection(fileName) {
      await this.skipSection(fileName)
      // 可能需要更新UI或显示一些消息
      this.$toast.success(this.$t('sectionSkipped'))
    },
    returnToMenu() {
      this.$router.push('/')
    }
  },
  created() {
    // 确保章节数据已加载
    if (this.chapters.length === 0) {
      this.$store.dispatch('sections/loadSectionsIndex')
    }
  }
}
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
