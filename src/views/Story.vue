<template>
  <div class="story-container">
    <h2>{{ storyTitle }}</h2>
    <div class="text-container">
      <div v-html="storyContent"></div>
      <div v-html="streamingContent"></div>
    </div>
    <div class="suggestions-container">
      <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion">
        {{ suggestion }}
      </div>
    </div>
    <div class="controls">
      <input 
        type="text" 
        v-model="userInput" 
        @keydown.enter="handleUserInput"
        :placeholder="$t('inputPlaceholder')"
        maxlength="200"
      />
      <button class="button" @click="handleUserInput" :disabled="isLoading">
        {{ isLoading ? $t('processing') : $t('submit') }}
      </button>
    </div>
    <div v-if="isLoading" class="interaction-stage">
      <p>{{ $t('loading') }}</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Story',
  data() {
    return {
      userInput: '',
    }
  },
  computed: {
    ...mapState('game', ['storyTitle', 'storyContent', 'suggestions', 'isLoading', 'streamingContent'])
  },
  methods: {
    ...mapActions('game', ['processUserInput', 'initializeGame', 'processStreamingResponse']),
    async handleUserInput() {
      if (this.userInput.trim() === '' || this.isLoading) return
      
      try {
        // 开始流式响应
        await this.processStreamingResponse(this.userInput)
        
        // 处理完整响应
        const result = await this.processUserInput(this.userInput)
        this.userInput = ''
        if (result.endSectionFlag) {
          this.$router.push('/sections')
        }
      } catch (error) {
        console.error('Error processing user input:', error)
        this.$toast.error(this.$t('errorProcessingInput'))
      }
    }
  },
  async created() {
    // 确保GameManager已初始化并加载当前章节
    if (!this.$store.state.game.gameManager) {
      await this.$store.dispatch('game/initializeGameManager')
    }
    const currentSection = this.$store.state.sections.currentSection
    if (currentSection) {
      await this.initializeGame(currentSection)
    } else {
      // 如果没有当前章节,可能需要重定向到章节选择页面
      this.$router.push('/sections')
    }
  }
}
</script>
