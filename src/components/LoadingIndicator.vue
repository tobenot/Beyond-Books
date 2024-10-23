<template>
  <div class="loading-indicator" v-if="show">
    <div class="loader">
      <div class="loaderSpin"></div>
      <div id="progressText">{{ progressText }}</div>
      <div id="loadingBar">
        <div id="progress" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
// 重构时需要参考的文件:
// - components/LoadingIndicator.html
// - scripts/ui.js (用于加载指示器逻辑)

export default {
  name: 'LoadingIndicator',
  props: {
    show: Boolean,
    progressText: String,
    progress: Number
  }
}
</script>

<style scoped>
/* 加载指示器样式 */
/* 重构时需要参考的文件:
   - css/components.css (用于加载指示器样式) */
</style>
