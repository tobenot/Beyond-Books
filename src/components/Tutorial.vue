<template>
  <div class="tutorial">
    <h2>{{ $t('tutorial.title') }}</h2>
    <!-- 使用v-html渲染raw内容 -->
    <div v-html="$t('tutorial.raw.content')" class="tutorial-content"></div>
    <div class="tutorial-buttons">
      <button @click="$emit('close')">{{ $t('tutorial.close') }}</button>
      <button @click="$emit('understand')">{{ $t('tutorial.understand') }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tutorial',
  emits: ['close', 'understand']
}
</script>

<style scoped>
.tutorial {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 注意：对于v-html内容的样式，需要使用:deep() */
:deep(.tutorial-content) {
  strong {
    color: #2196F3;
  }
  
  li {
    margin-bottom: 10px;
    line-height: 1.6;
  }
}

.tutorial-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
</style>
