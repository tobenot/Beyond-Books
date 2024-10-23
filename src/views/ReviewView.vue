// 在文件顶部添加
import { defineOptions } from 'vue'

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
        <!-- 添加导出按钮 -->
        <div class="export-buttons">
          <button @click="exportAsHTML(record)">{{ $t('exportHTML') }}</button>
          <button @click="exportAsImage(record)">{{ $t('exportImage') }}</button>
          <button @click="exportAsMultipleImages(record)">{{ $t('exportMultipleImages') }}</button>
        </div>
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

// 确认删除回顾记录
const confirmDeleteReview = (id) => {
  if (confirm(this.$t('confirmDeleteMessage'))) {
    store.dispatch('review/deleteReviewRecord', id)
  }
}

// 查看回顾详情
const viewReviewDetail = (record) => {
  store.commit('review/setCurrentReview', record)
  router.push({
    name: 'ReviewDetail',
    params: { id: record.id }
  })
}

// 导出为HTML
const exportAsHTML = (record) => {
  showExportWarning()
  
  const updatedContent = record.content.replace(/<img src="(.+?)"/g, (match, p1) => {
    if (p1.startsWith('http')) {
      return match
    } else {
      const imageUrl = "https://tobenot.github.io/Beyond-Books/" + p1
      return `<img src="${imageUrl}"`
    }
  })

  const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        p { margin: 1em 0; }
        .user { color: blue; }
        .assistant { color: black; }
        .special-term { font-weight: bold; color: red; }
      </style>
    </head>
    <body>
      ${updatedContent}
      <div style="display: none;">
        ${record.full_record.replace(/\n/g, '<br>')}
      </div>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const filename = `${record.review_title.substring(0, 50)}.html`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

// 导出为长图
const exportAsImage = async (record) => {
  showExportWarning()
  
  // 创建一个临时容器来渲染内容
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = record.content
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  document.body.appendChild(tempContainer)

  try {
    const canvas = await html2canvas(tempContainer, {
      windowWidth: tempContainer.scrollWidth,
      windowHeight: tempContainer.scrollHeight
    })

    const url = canvas.toDataURL('image/png')
    const filename = `${record.review_title.substring(0, 50)}.png`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (error) {
    console.error('导出图片失败:', error)
    alert('导出图片失败')
  } finally {
    document.body.removeChild(tempContainer)
  }
}

// 导出为多图
const exportAsMultipleImages = async (record) => {
  showExportWarning()
  
  // 创建临时容器
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = record.content
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  document.body.appendChild(tempContainer)

  try {
    const canvas = await html2canvas(tempContainer)
    const totalHeight = canvas.height
    const pageHeight = 1000 // 每页高度
    const totalPages = Math.ceil(totalHeight / pageHeight)

    for (let i = 0; i < totalPages; i++) {
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = Math.min(pageHeight, totalHeight - i * pageHeight)
      
      const ctx = pageCanvas.getContext('2d')
      ctx.drawImage(
        canvas,
        0, i * pageHeight,
        canvas.width, pageCanvas.height,
        0, 0,
        canvas.width, pageCanvas.height
      )

      const url = pageCanvas.toDataURL('image/png')
      const filename = `${record.review_title.substring(0, 50)}_${i + 1}.png`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  } catch (error) {
    console.error('导出多图失败:', error)
    alert('导出多图失败')
  } finally {
    document.body.removeChild(tempContainer)
  }
}

// 显示导出警告
const showExportWarning = () => {
  const warningMessage = `
    注意：
    桌上剧团（跑团）中，玩家和主持人一样都是创作者。

    您正在导出游戏中的桥段记录。由于游戏中涉及的对话是由玩家输入和大语言模型生成的，开发者无法完全控制或监控所有生成的内容。如果您在正常游戏中发现任何不适当的内容，请随时与我们联系（B站私信或者找QQ群群主）。

    1. 大模型生成的内容不代表开发者的立场。
    2. 请尽量避免在对话中输入不符合设定的内容。
    
    感谢您的理解与合作，祝您游戏愉快！
  `
  alert(warningMessage)
}

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

.review-detail {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.review-content {
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.export-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.export-buttons button {
  padding: 4px 8px;
  font-size: 0.9em;
}
</style>
