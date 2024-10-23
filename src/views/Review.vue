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
import html2canvas from 'html2canvas'  // 添加这行

export default {
  name: 'ReviewPage',
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
      this.showExportAlert()
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
    },
    
    async exportReviewAsImage(record) {
      this.showExportAlert()
      await this.loadHtml2Canvas()
      
      const content = this.$refs.reviewContent
      const canvas = await html2canvas(content, {
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight
      })

      const url = canvas.toDataURL('image/png')
      const filename = `${record.review_title.substring(0, 50)}.png`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    
    async exportReviewAsMultipleImages(record) {
      this.showExportAlert()
      await this.loadHtml2Canvas()
      
      const content = this.$refs.reviewContent
      const canvas = await html2canvas(content, {
        useCORS: true,
        logging: true
      })

      const totalHeight = canvas.height
      const viewportHeight = window.innerHeight
      const images = []

      for (let currentY = 0; currentY < totalHeight; currentY += viewportHeight) {
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = viewportHeight

        const sliceContext = sliceCanvas.getContext('2d')
        sliceContext.drawImage(
          canvas,
          0, currentY, canvas.width, viewportHeight,
          0, 0, canvas.width, viewportHeight
        )

        images.push(sliceCanvas.toDataURL('image/png'))
      }

      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i])
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        const filename = `${record.review_title.substring(0, 50)}_${i + 1}.png`
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        URL.revokeObjectURL(url)
      }
    },
    
    showExportAlert() {
      const warningMessage = `
      注意：
      桌上剧团（跑团）中，玩家和主持人一样都是创作者。

      您正在导出游戏中的桥段记录。由于游戏中涉及的对话是由玩家输入和大语言模型生成的，开发者无法完全控制或监控所有生成的内容。如果您在正常游戏中发现任何不适当的内容，请随时与我们联系（B站私信或者找QQ群群主）。

      1. 大模型生成的内容不代表开发者的立场。
      2. 请尽量避免在对话中输入不符合设定的内容。
      
      感谢您的理解与合作，祝您游戏愉快！
      `
      this.$alert(warningMessage)
    },
    
    async loadHtml2Canvas() {
      if (typeof html2canvas === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
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
