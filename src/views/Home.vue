<template>
  <div class="container" id="menu">
    <h1>{{ $t('mainTitle') }}</h1>
    <h2>{{ $t('subTitle') }}</h2>
    <p id="gameDescription">{{ $t('gameDescription') }}</p>
    <div class="menu-controls">
      <div class="control-pair" id="footerControl">
        <button class="button" @click="showCreatorsMessage">{{ $t('creatorsMessage') }}</button>
        <button class="button" @click="showUpdateLog">{{ $t('updateLog') }}</button>
      </div>  
      <button class="button" @click="newGame" v-if="!hasSave">{{ $t('newGame') }}</button>
      <div class="control-pair" v-if="hasSave">
        <button class="button" @click="continueGame">{{ $t('continueGame') }}</button>
        <button class="button" @click="showReviewRecords">{{ $t('reviewRecords') }}</button>
      </div>
      <div class="control-pair" id="saveLoadButtons">
        <button class="button" @click="importSave">{{ $t('importSave') }}</button>
        <button class="button" @click="exportSave">{{ $t('exportSave') }}</button>
      </div>
      <div class="control-pair" id="settingsButtons">
        <button class="button" @click="showSettings">
          <img src="@/assets/icon/settings-icon.png" alt="" style="vertical-align: middle; margin-right: 5px;"/>
          {{ $t('settings') }}
        </button>
        <button class="button" @click="deleteSave" v-if="hasSave">{{ $t('deleteSave') }}</button>
      </div>
    </div>
    <input id="fileInput" type="file" style="display: none;" @change="handleFileImport">
    <div class="footer">
      <p>
        <a href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=SQtBxN7VNoPENb1yCzklbdo3GrL0vRq9&authKey=gXOpREY%2BVYh6acsXgpfzZ%2FzZKefgb7OdM92T%2Br46Umr0HNVHi4S1DVxHhyI8Rhm3&noverify=0&group_code=731682071" target="_blank">QQ群：731682071</a>
        &nbsp;
        <a href="https://space.bilibili.com/23122362" target="_blank">B站</a>
      </p>
      <p>{{ $t('welcomeMessage') }}</p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Modal from '@/components/Modal.vue'

export default {
  name: 'Home',
  components: {
    Modal
  },
  computed: {
    ...mapGetters('game', ['hasSave'])
  },
  methods: {
    ...mapActions('game', ['newGame', 'continueGame', 'importSave', 'exportSave', 'deleteSave']),
    showCreatorsMessage() {
      this.$modal.show('creators-message', {
        title: this.$t('creatorsMessageTitle'),
        content: this.$t('creatorsMessageContent')
      })
    },
    showUpdateLog() {
      this.$modal.show('update-log', {
        title: this.$t('updateLogTitle'),
        content: this.$t('updateLogContent')
      })
    },
    showReviewRecords() {
      this.$router.push('/review')
    },
    showSettings() {
      this.$router.push('/settings')
    },
    handleFileImport(event) {
      this.importSave(event.target.files[0])
    }
  }
}
</script>
