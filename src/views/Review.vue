<template>
  <div class="review-container">
    <h2>{{ $t('reviewTitle') }}</h2>
    <button class="button" @click="returnToMenu">{{ $t('returnToMenu') }}</button>
    <div v-if="reviewRecords.length === 0">
      <p>{{ $t('noReviewRecords') }}</p>
    </div>
    <ul v-else>
      <li v-for="record in reviewRecords" :key="record.id" class="review-item">
        <span><b>{{ record.review_title }}</b></span>
        <span>({{ formatDate(record.timestamp) }})</span>
        <span>({{ record.size }})</span>
        <button @click="renameReview(record)">{{ $t('rename') }}</button>
        <button @click="deleteReview(record.id)">{{ $t('delete') }}</button>
        <button @click="viewReviewDetail(record)">{{ $t('viewDetails') }}</button>
      </li>
    </ul>
    <review-detail 
      v-if="showReviewDetail" 
      :review="selectedReview" 
      @close="showReviewDetail = false"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReviewDetail from '@/components/ReviewDetail.vue'

export default {
  name: 'Review',
  components: {
    ReviewDetail
  },
  data() {
    return {
      showReviewDetail: false,
      selectedReview: null
    }
  },
  computed: {
    ...mapGetters('review', ['getReviewRecords']),
    reviewRecords() {
      return this.getReviewRecords
    }
  },
  methods: {
    ...mapActions('review', ['loadReviewRecords', 'deleteReviewRecord', 'updateReviewRecord']),
    returnToMenu() {
      this.$router.push('/')
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    renameReview(record) {
      const newTitle = prompt(this.$t('enterNewTitle'), record.review_title)
      if (newTitle && newTitle.trim() !== '') {
        const updatedRecord = { ...record, review_title: newTitle.trim() }
        this.updateReviewRecord(updatedRecord)
      }
    },
    deleteReview(id) {
      if (confirm(this.$t('confirmDelete'))) {
        this.deleteReviewRecord(id)
      }
    },
    viewReviewDetail(record) {
      this.selectedReview = record
      this.showReviewDetail = true
    }
  },
  created() {
    this.loadReviewRecords()
  }
}
</script>

<style scoped>
.review-container {
  padding: 20px;
}

.review-item {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 添加更多样式... */
</style>
