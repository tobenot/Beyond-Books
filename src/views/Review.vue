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
        <button @click="confirmDeleteReview(record.id)">{{ $t('delete') }}</button>
        <button @click="viewReviewDetail(record)">{{ $t('viewDetails') }}</button>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Review',
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
      this.$modal.show('rename-review', {
        title: this.$t('renameReview'),
        content: `
          <div class="rename-form">
            <input 
              type="text" 
              id="newTitle" 
              value="${record.review_title}"
              class="rename-input"
            >
          </div>
        `,
        closeButtonText: this.$t('cancel'),
        buttons: [
          {
            text: this.$t('confirm'),
            handler: () => {
              const newTitle = document.getElementById('newTitle').value.trim()
              if (newTitle) {
                this.updateReviewRecord({
                  ...record,
                  review_title: newTitle
                })
                this.$modal.hide('rename-review')
              }
            }
          }
        ]
      })
    },
    
    confirmDeleteReview(id) {
      this.$modal.show('confirm-delete', {
        title: this.$t('confirmDelete'),
        content: this.$t('confirmDeleteMessage'),
        closeButtonText: this.$t('cancel'),
        buttons: [
          {
            text: this.$t('confirm'),
            handler: () => {
              this.deleteReviewRecord(id)
              this.$modal.hide('confirm-delete')
            }
          }
        ]
      })
    },
    
    viewReviewDetail(record) {
      this.$modal.show('review-detail', {
        title: record.review_title,
        content: record.content,
        large: true,
        buttons: [
          {
            text: this.$t('exportAsHTML'),
            handler: () => this.exportReviewAsHTML(record)
          },
          {
            text: this.$t('exportAsImage'),
            handler: () => this.exportReviewAsImage(record)
          },
          {
            text: this.$t('exportAsMultipleImages'),
            handler: () => this.exportReviewAsMultipleImages(record)
          }
        ]
      })
    },
    
    // 导出相关方法...
    async exportReviewAsHTML(record) {
      // 实现导出HTML的逻辑
    },
    
    async exportReviewAsImage(record) {
      // 实现导出图片的逻辑  
    },
    
    async exportReviewAsMultipleImages(record) {
      // 实现导出多张图片的逻辑
    }
  },
  created() {
    this.loadReviewRecords()
  }
}
</script>

<style scoped>
.rename-form {
  margin: 20px 0;
}

.rename-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 其他样式... */
</style>
