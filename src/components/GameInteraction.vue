<template>
  <div class="game-interaction">
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
        v-model="inputValue"
        maxlength="200"
        placeholder="你要怎么做？"
        @keydown.enter="handleSubmit"
        autocomplete="off"
        :disabled="isSubmitting || isCooldown"
      />
      <button 
        class="button"
        @click="handleSubmit"
        :disabled="isSubmitting || isCooldown">
        开始
      </button>
    </div>

    <!-- 交互阶段提示 -->
    <div v-if="interactionStage.visible" class="interaction-stage">
      <p>{{ interactionStage.stage }}: {{ interactionStage.info }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const inputValue = ref('')

// 计算属性
const suggestions = computed(() => store.state.game.suggestions)
const isSubmitting = computed(() => store.state.game.isSubmitting)
const isCooldown = computed(() => store.state.game.isCooldown)
const interactionStage = computed(() => ({
  stage: store.state.game.interactionStage?.stage || '',
  info: store.state.game.interactionStage?.info || '',
  visible: store.state.game.interactionStage?.visible || false
}))

// 方法
const handleSubmit = async () => {
  const input = inputValue.value.trim()
  if (!input || isSubmitting.value || isCooldown.value) {
    return
  }

  try {
    await store.dispatch('interaction/handleUserInput', input)
    inputValue.value = '' // 清空输入框
    
    // 触发滚动事件
    store.dispatch('game/scrollToBottom')
  } catch (error) {
    console.error('处理用户输入时出错:', error)
  }
}
</script>

<style scoped>
.game-interaction {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
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
</style>
