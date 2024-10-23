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

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import html2canvas from 'html2canvas'

const store = useStore()
const router = useRouter()

// 添加组件名称定义
defineOptions({
  name: 'ReviewView'
})

// 计算属性
const reviewRecords = computed(() => store.getters['review/getReviewRecords'])

// 方法
const returnToMenu = () => {
  router.push('/')
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const renameReview = (record) => {
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
            store.dispatch('review/updateReviewRecord', {
              ...record,
              review_title: newTitle
            })
            this.$modal.hide('rename-review')
          }
        }
      }
    ]
  })
}

// ... 保持其他方法的逻辑不变，只改变写法 ...

onMounted(() => {
  store.dispatch('review/loadReviewRecords')
})
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
