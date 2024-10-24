<script setup>
import { computed } from 'vue'
import { defineProps } from 'vue'  // 添加这行
import { highlightSpecialTerms } from '@/utils/termsHandler'
import { getBasePath } from '@/utils/pathManager'

// 定义 props
const props = defineProps({
  show: Boolean,
  description: String,
  imageUrl: String,
  term: String,
  event: Object
})

const tooltipStyle = computed(() => ({
  position: 'fixed',
  display: props.show ? 'block' : 'none',
  width: '260px',
  zIndex: 1000,
  backgroundColor: '#fff',
  padding: '8px', // 减小内边距
  borderRadius: '4px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)', // 减淡阴影
  ...calculatePosition()
}))

function calculatePosition() {
  if (!props.event || !props.show) return {}
  
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight
  const tooltipElement = document.getElementById('term-tooltip')
  if (!tooltipElement) return

  const tooltipWidth = tooltipElement.offsetWidth
  const tooltipHeight = tooltipElement.offsetHeight
  
  let top = props.event.clientY + 10
  let left = props.event.clientX + 10

  const thirdWidth = viewportWidth / 3
  const cursorX = props.event.clientX

  if (cursorX <= thirdWidth) {
    left = props.event.clientX + 10
  } else if (cursorX >= 2 * thirdWidth) {
    left = props.event.clientX - tooltipWidth - 10
  } else {
    left = Math.max(10, (props.event.clientX - tooltipWidth / 2))
  }

  if (top + tooltipHeight > viewportHeight) {
    top = viewportHeight - tooltipHeight - 10
  }

  if (left < 0) {
    left = 10
  } else if (left + tooltipWidth > viewportWidth) {
    left = viewportWidth - tooltipWidth - 10
  }

  return {
    top: `${top}px`,
    left: `${left}px`
  }
}

const highlightedDescription = computed(() => {
  return highlightSpecialTerms(props.description, props.term)
})

const computedImageUrl = computed(() => {
  if (!props.imageUrl) return ''
  // 如果已经是完整的 URL（以 http 开头），则直接返回
  if (props.imageUrl.startsWith('http')) {
    return props.imageUrl
  }
  // 否则添加 basePath
  return `${getBasePath()}${props.imageUrl}`
})
</script>

<template>
  <div 
    id="term-tooltip" 
    v-show="show"
    :style="tooltipStyle"
    @click.stop
    class="term-tooltip"
  >
    <div class="term-tooltip-content">
      <span v-html="highlightedDescription"></span>
      <img 
        v-if="imageUrl"
        :src="computedImageUrl" 
        class="term-tooltip-image" 
        alt="术语图片"
        @load="updatePosition"
      >
    </div>
  </div>
</template>

<style scoped>
.term-tooltip {
  max-height: 600px;
  overflow-y: auto;
}

.term-tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 减小间距 */
}

.term-tooltip-image {
  width: 256px;
  height: 384px;
  object-fit: cover;
  display: block;
  margin: 2px auto; /* 减小图片上下边距 */
}
</style>
