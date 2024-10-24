<script setup>
import { computed } from 'vue'
import { defineProps } from 'vue'  // 添加这行
import { highlightSpecialTerms } from '@/utils/termsHandler'

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
  minWidth: '150px',
  zIndex: 1000,
  backgroundColor: '#fff',
  padding: '10px',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
</script>

<template>
  <div 
    id="term-tooltip" 
    v-show="show"
    :style="tooltipStyle"
    @click.stop
  >
    <span v-html="highlightedDescription"></span>
    <img 
      v-if="imageUrl"
      :src="imageUrl" 
      class="term-tooltip-image" 
      alt="术语图片"
      @load="updatePosition"
    >
  </div>
</template>

<style scoped>
.term-tooltip-image {
  max-width: 100%;
  margin-top: 10px;
}
</style>
