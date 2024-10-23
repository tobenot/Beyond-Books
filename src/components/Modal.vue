<template>
  <div class="modal" v-if="show">
    <div class="modal-content">
      <h2>{{ title }}</h2>
      <div class="modal-scroll" v-html="content"></div>
      <div class="button-container">
        <button class="button" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
// 重构时需要参考的文件:
// - components/Modal.html
// - scripts/ui.js (用于模态框逻辑)

export default {
  name: 'Modal',
  props: {
    show: Boolean,
    title: String,
    content: String
  },
  methods: {
    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
/* 模态框样式 */
/* 重构时需要参考的文件:
   - css/components.css (用于模态框样式) */
</style>
