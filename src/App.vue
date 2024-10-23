<template>
  <div id="app">
    <router-view></router-view>
    
    <!-- 全局模态框 -->
    <modal
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
import Modal from '@/components/Modal.vue'
import TermTooltip from '@/components/TermTooltip.vue'
import { loadTermsConfig, loadColorsConfig } from '@/utils/termsHandler'

export default {
  name: 'App',
  components: {
    Modal,
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
@import '@/assets/css/components.css';
</style>
