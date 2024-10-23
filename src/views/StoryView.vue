// 在文件顶部添加
import { defineOptions } from 'vue'
import { highlightSpecialTerms } from '@/utils/termsHandler.js'

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

    <!-- 故事内容容器 -->
    <div class="text-container" ref="storyContentRef">
      <!-- 使用 v-html 渲染初始内容 -->
      <div v-html="storyContent"></div>
      
      <!-- 对话历史 -->
      <div v-for="(message, index) in conversationHistory" 
           :key="index" 
           class="message"
           :class="message.role">
        <div v-html="formatContent(message)"></div>
      </div>
    </div>

    <!-- 建议容器 -->
    <div v-if="suggestions.length" class="suggestions-container">
      <div v-for="(suggestion, index) in suggestions" 
           :key="index" 
           class="suggestion">
        建议：{{ suggestion }}
      </div>
    </div>

    <!-- 输入控件 -->
    <div class="controls">
      <input
        type="text"
        v-model="userInput"
        maxlength="200"
        placeholder="你要怎么做？"
        @keydown.enter="handleUserInput"
        autocomplete="off"
        :disabled="isSubmitting || isCooldown"
      />
      <button 
        class="button"
        @click="handleUserInput"
        :disabled="isSubmitting || isCooldown">
        开始
      </button>
    </div>

    <!-- 交互阶段提示 -->
    <div v-if="interactionStage.visible" class="interaction-stage">
      <p>{{ interactionStage.stage }}: {{ interactionStage.info }}</p>
    </div>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="interaction-stage">
      <p>万物运行...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { defineOptions } from 'vue'
import { highlightSpecialTerms } from '@/utils/termsHandler.js'
import LazyImage from '@/components/LazyImage.vue'
import MusicPlayer from '@/components/MusicPlayer.vue'

// 添加组件名称定义
defineOptions({
  name: 'StoryView'
})

const store = useStore()
const userInput = ref('')
const storyContentRef = ref(null)

// 计算属性
const section = computed(() => store.state.sections.currentSection)
const suggestions = computed(() => store.state.game.suggestions)
const isSubmitting = computed(() => store.state.game.isSubmitting)
const isCooldown = computed(() => store.state.game.isCooldown)
const isLoading = computed(() => store.state.game.isLoading)
const interactionStage = computed(() => ({
  stage: store.state.game.interactionStage?.stage || '',
  info: store.state.game.interactionStage?.info || '',
  visible: store.state.game.interactionStage?.visible || false
}))
const conversationHistory = computed(() => store.state.game.conversationHistory)

// storyContent 计算属性
const storyContent = computed(() => {
  const content = store.state.game.storyContent
  return content ? highlightSpecialTerms(content) : ''
})

// 方法
const handleUserInput = async () => {
  if (isSubmitting.value || isCooldown.value || !userInput.value.trim()) {
    return
  }

  try {
    await store.dispatch('game/handleUserInput', userInput.value)
    userInput.value = ''
    
    // 修改这里
    if (storyContentRef.value) {
      setTimeout(() => {
        storyContentRef.value.scrollTop = storyContentRef.value.scrollHeight
      }, 100)
    }
  } catch (error) {
    console.error('处理用户输入时出错:', error)
  }
}

// 修改 formatContent 方法为统一的格式化处理
const formatContent = (message) => {
  if (!message || !message.content) return ''
  
  let formattedText = message.content
  
  // 处理换行
  formattedText = formattedText.replace(/\n/g, '<br>')
  
  // 根据消息类型添加特殊格式
  if (message.role === 'user') {
    formattedText = `<br><i>${formattedText}</i><br><br>`
  } else if (message.role === 'info') {
    formattedText = `<div class="info-message">${formattedText}</div>`
  }
  
  // 所有内容都经过高亮处理
  return highlightSpecialTerms(formattedText)
}

// 监听对话历史变化，自动滚动到底部
watch(conversationHistory, () => {
  if (storyContentRef.value) {
    setTimeout(() => {
      storyContentRef.value.scrollTop = storyContentRef.value.scrollHeight
    }, 100)
  }
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  if (storyContentRef.value) {
    storyContentRef.value.scrollTop = 0
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

.controls input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.interaction-stage {
  text-align: center;
  padding: 10px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  margin-bottom: 10px;
}

/* 添加消息样式 */
.message {
  margin-bottom: 1em;
}

.message.user {
  color: #666;
  font-style: italic;
}

.message.info {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.message.assistant {
  color: #333;
}
</style>
