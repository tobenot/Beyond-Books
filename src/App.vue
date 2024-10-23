<template>
  <div id="app">
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

<script>
import { ref } from 'vue'
import BaseModal from '@/components/Modal.vue'
import TermTooltip from '@/components/TermTooltip.vue'
// 修改这一行，添加 termsConfig 的导入
import { loadTermsConfig, loadColorsConfig, termsConfig } from '@/utils/termsHandler'

export default {
  name: 'App',
  components: {
    BaseModal,
    TermTooltip
  },
  setup() {
    const tooltipShow = ref(false)
    const tooltipDescription = ref('')
    const tooltipImageUrl = ref('')
    const tooltipTerm = ref('')
    const tooltipEvent = ref(null)

    // 初始化加载配置
    loadTermsConfig()
    loadColorsConfig()

    // 处理点击事件
    function handleClick(event) {
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

    // 添加全局点击事件监听
    document.addEventListener('click', handleClick)

    return {
      tooltipShow,
      tooltipDescription,
      tooltipImageUrl,
      tooltipTerm,
      tooltipEvent
    }
  }
}
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
