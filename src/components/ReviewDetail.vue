<template>
  <div class="review-detail">
    <h3>{{ review.review_title }}</h3>
    <div class="review-content" ref="reviewContent" v-html="review.content"></div>
    <div class="review-actions">
      <button @click="exportReviewAsHTML">{{ $t('exportAsHTML') }}</button>
      <button @click="exportReviewAsImage">{{ $t('exportAsImage') }}</button>
      <button @click="exportReviewAsMultipleImages">{{ $t('exportAsMultipleImages') }}</button>
      <button @click="$emit('close')">{{ $t('close') }}</button>
    </div>
  </div>
</template>

<script>
import { exportAsHTML, exportAsImage, exportAsMultipleImages } from '@/utils/exportHelpers'

export default {
  name: 'ReviewDetail',
  props: {
    review: {
      type: Object,
      required: true
    }
  },
  methods: {
    exportReviewAsHTML() {
      exportAsHTML(this.review.content, `${this.review.review_title}.html`)
    },
    async exportReviewAsImage() {
      const element = this.$refs.reviewContent
      await exportAsImage(element, `${this.review.review_title}.png`)
    },
    async exportReviewAsMultipleImages() {
      const element = this.$refs.reviewContent
      await exportAsMultipleImages(element, this.review.review_title)
    }
  }
}
</script>

<style scoped>
.review-detail {
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.review-content {
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.review-actions {
  display: flex;
  justify-content: space-between;
}

.review-actions button {
  margin-right: 10px;
}
</style>
