<template>
  <div id="app">
    <!-- 添加一个测试文本，看看是否显示 -->
    <h1>测试文本 - 如果你看到这个，说明基本渲染正常</h1>
    
    <router-view></router-view>
    
    <!-- 全局模态框 -->
    <base-modal
      v-for="(modal, name) in modals"
      :key="name"
      v-bind="modal"
      @close="hideModal(name)"
    />

    <!-- 术语提示框 -->
    <term-tooltip
      :show="tooltipShow"
      :description="tooltipDescription"
      :imageUrl="tooltipImageUrl" 
      :term="tooltipTerm"
      :event="tooltipEvent"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BaseModal from '@/components/ModalDialog.vue'
import TermTooltip from '@/components/TermTooltip.vue'
import { loadTermsConfig, loadColorsConfig, termsConfig } from '@/utils/termsHandler'
import { defineOptions, defineExpose } from 'vue'

defineOptions({
  name: 'AppRoot'
})

// 响应式状态
const tooltipShow = ref(false)
const tooltipDescription = ref('')
const tooltipImageUrl = ref('')
const tooltipTerm = ref('')
const tooltipEvent = ref(null)
const modals = ref({})

// 将这些变量和函数导出，这样它们就可以在其他组件中使用
defineExpose({
  showModal,
  hideModal
})

// 初始化加载配置
onMounted(() => {
  loadTermsConfig()
  loadColorsConfig()
})

// 处理点击事件
const handleClick = (event) => {
  if (event.target.classList.contains('special-term')) {
    const term = event.target.getAttribute('data-term')
    const termConfig = termsConfig.value.terms[term]
    
    tooltipDescription.value = termConfig.description
    tooltipImageUrl.value = termConfig.imageUrl
    tooltipTerm.value = term
    tooltipEvent.value = event
    tooltipShow.value = true
  } else if (!event.target.closest('#term-tooltip')) {
    tooltipShow.value = false
  }
}

// 模态框方法
const showModal = (name, props = {}) => {
  modals.value[name] = {
    ...props,
    show: true
  }
}

const hideModal = (name) => {
  if (modals.value[name]) {
    modals.value[name].show = false
    delete modals.value[name]
  }
}

// 添加和移除全局点击事件监听
onMounted(() => {
  document.addEventListener('click', handleClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClick)
})
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: "Microsoft YaHei", Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 通用按钮样式 */
.button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #3498db;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #2980b9;
}

.button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* 通用输入框样式 */
input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #3498db;
}

/* 通用容器样式 */
.container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
