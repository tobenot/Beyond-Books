<template>
  <div class="review-detail">
    <h2>{{ record.review_title }}</h2>
    <div class="button-group">
      <button @click="$emit('close')">{{ $t('return') }}</button>
      <button @click="exportAsHTML">{{ $t('exportAsHTML') }}</button>
      <button @click="exportAsImage">{{ $t('exportAsImage') }}</button>
      <button @click="exportAsMultipleImages">{{ $t('exportAsMultipleImages') }}</button>
    </div>
    <div ref="content" class="content" v-html="record.content"></div>
    <div class="full-record" v-if="showFullRecord">{{ record.full_record }}</div>
  </div>
</template>

<script>
export default {
  name: 'ReviewDetail',
  props: {
    record: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showFullRecord: false
    }
  },
  methods: {
    exportAsHTML() {
      this.$emit('export-html', this.record)
    },
    exportAsImage() {
      this.$emit('export-image', this.record)
    },
    exportAsMultipleImages() {
      this.$emit('export-multiple-images', this.record)
    }
  }
}
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
