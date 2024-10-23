<template>
  <div class="review-detail">
    <h2>{{ record.review_title }}</h2>
    <div class="button-group">
      <button @click="$emit('close')">{{ $t('return') }}</button>
      <button @click="$emit('export-html', record)">{{ $t('exportAsHTML') }}</button>
      <button @click="$emit('export-image', record)">{{ $t('exportAsImage') }}</button>
      <button @click="$emit('export-multiple-images', record)">{{ $t('exportAsMultipleImages') }}</button>
    </div>
    <div ref="content" id="reviewContent" class="content" v-html="record.content"></div>
    <div class="full-record" v-if="showFullRecord">{{ record.full_record }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { defineProps, defineEmits } from 'vue'

defineProps({
  record: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'export-html', 'export-image', 'export-multiple-images'])

const showFullRecord = ref(false)
</script>

<style scoped>
.review-detail {
  padding: 20px;
}

.button-group {
  margin: 20px 0;
}

.content {
  max-width: 800px;
  margin: 0 auto;
}

.full-record {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  white-space: pre-wrap;
}
</style>
