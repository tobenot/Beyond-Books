// 在文件顶部添加
import { defineOptions } from 'vue'

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
    
    <router-link to="/review" class="menu-item">
      {{ $t('reviewTitle') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { inject } from 'vue'

// 添加组件名称定义
defineOptions({
  name: 'HomeView'
})

const store = useStore()
const router = useRouter()
const fileInput = ref(null)
const $modal = inject('$modal') // 注入 modal 服务

// 计算属性
const hasSave = computed(() => store.getters['save/hasSave'])

// 方法
const startNewGame = () => {
  store.dispatch('save/clearSave')
  router.push('/sections')
}

const continueGame = () => {
  router.push('/sections')
}

const showReviewRecords = () => {
  router.push('/review')
}

const openSettings = () => {
  router.push('/settings')
}

const triggerFileInput = () => {
  if (hasSave.value) {
    if (!confirm(store.$i18n.t('confirmImport'))) {
      return
    }
  }
  fileInput.value.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    await store.dispatch('save/importSave', file)
    $modal.show('success', {
      title: '成功',
      content: '导入存档成功'
    })
    location.reload()
  } catch (error) {
    $modal.show('error', {
      title: '错误',
      content: error.message
    })
  } finally {
    event.target.value = ''
  }
}

const confirmDeleteSave = async () => {
  if (confirm(this.$t('confirmDelete'))) {
    await store.dispatch('save/clearSave')
    location.reload()
  }
}

const showCreatorsMessage = () => {
  $modal.show('creators-message', {
    title: '制作者信息',
    content: '这里是制作者信息内容...',
    closeButtonText: '关闭'
  })
}

const showUpdateLog = () => {
  $modal.show('update-log', {
    title: '更新日志',
    content: '这里是更新日志内容...',
    closeButtonText: '关闭'
  })
}

onMounted(() => {
  console.log('HomeView mounted')
  // 打印组件的数据状态
  console.log('Component data:', {
    // ... 您的组件数据
  })
})
</script>

<style scoped>
/* 保持原有样式 */
</style>
