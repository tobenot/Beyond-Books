import { ref, h, createApp } from 'vue'
import ModalDialog from '@/components/ModalDialog.vue'

export const ModalPlugin = {
  install(app) {
    const modalState = ref({
      show: false,
      title: '',
      content: '',
      closeButtonText: '关闭',
      buttons: [],
      large: false
    })

    const modal = {
      show(name, options = {}) {
        modalState.value = {
          ...modalState.value,
          show: true,
          ...options
        }
      },
      hide() {
        modalState.value.show = false
      }
    }

    app.provide('$modal', modal)
    
    // 创建全局 Modal 组件
    const modalComponent = createApp({
      setup() {
        return () => h(ModalDialog, {
          ...modalState.value,
          'onUpdate:show': (value) => modalState.value.show = value,
          onClose: () => modal.hide()
        })
      }
    })

    // 挂载 Modal 到 body
    const modalContainer = document.createElement('div')
    document.body.appendChild(modalContainer)
    modalComponent.mount(modalContainer)
  }
}

export default ModalPlugin
