<template>
  <div class="container" id="menu">
    <h1>{{ $t('mainTitle') }}</h1>
    <h2>{{ $t('subTitle') }}</h2>
    <p id="gameDescription">{{ $t('gameDescription') }}</p>
    
    <div class="menu-controls">
      <!-- 制作者信息和更新日志 -->
      <div class="control-pair" id="footerControl">
        <button class="button" @click="showCreatorsMessage">
          {{ $t('creatorsMessage') }}
        </button>
        <button class="button" @click="showUpdateLog">
          {{ $t('updateLog') }}
        </button>
      </div>
      
      <!-- 新游戏按钮 -->
      <button 
        v-if="!hasSave"
        class="button" 
        @click="startNewGame"
      >
        {{ $t('newGame') }}
      </button>
      
      <!-- 继续游戏和回顾按钮 -->
      <div v-if="hasSave" class="control-pair">
        <button class="button" @click="continueGame">
          {{ $t('continueGame') }}
        </button>
        <button class="button" @click="showReviewRecords">
          {{ $t('reviewRecords') }}
        </button>
      </div>
      
      <!-- 存档导入导出按钮 -->
      <div class="control-pair">
        <button class="button" @click="triggerFileInput">
          {{ $t('importSave') }}
        </button>
        <button 
          v-if="hasSave"
          class="button" 
          @click="exportSave"
        >
          {{ $t('exportSave') }}
        </button>
      </div>
      
      <!-- 设置和删除存档按钮 -->
      <div class="control-pair">
        <button class="button" @click="openSettings">
          <img src="@/assets/icon/settings-icon.png" alt="" />
          {{ $t('settings') }}
        </button>
        <button 
          v-if="hasSave"
          class="button" 
          @click="confirmDeleteSave"
        >
          {{ $t('deleteSave') }}
        </button>
      </div>
    </div>
    
    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      accept=".savegame"
      @change="handleFileSelect"
    >
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Home',
  
  computed: {
    ...mapGetters('save', ['hasSave'])
  },
  
  methods: {
    ...mapActions('save', [
      'clearSave',
      'exportSave',
      'importSave'
    ]),
    
    startNewGame() {
      this.clearSave()
      this.$router.push('/sections')
    },
    
    continueGame() {
      this.$router.push('/sections')
    },
    
    showReviewRecords() {
      this.$router.push('/review')
    },
    
    openSettings() {
      this.$router.push('/settings')
    },
    
    triggerFileInput() {
      if (this.hasSave) {
        if (!confirm(this.$t('confirmImport'))) {
          return
        }
      }
      this.$refs.fileInput.click()
    },
    
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        await this.importSave(file)
        this.$modal.show('success', {
          title: this.$t('success'),
          content: this.$t('importSuccess')
        })
        location.reload()
      } catch (error) {
        this.$modal.show('error', {
          title: this.$t('error'),
          content: error.message
        })
      } finally {
        event.target.value = '' // 清空文件输入
      }
    },
    
    async confirmDeleteSave() {
      if (confirm(this.$t('confirmDelete'))) {
        await this.clearSave()
        location.reload()
      }
    },
    
    showCreatorsMessage() {
      this.$modal.show('creators-message')
    },
    
    showUpdateLog() {
      this.$modal.show('update-log')
    }
  }
}
</script>

<style scoped>
/* 保持原有样式 */
</style>
