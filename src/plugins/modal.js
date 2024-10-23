import { createApp, h } from 'vue'
import Modal from '@/components/Modal.vue'

export const ModalPlugin = {
  install(app) {
    // 创建事件总线实例
    const eventBus = createApp({}).mount(document.createElement('div'))
    this.EventBus = eventBus
    
    // 注册 Modal 组件
    app.component('base-modal', Modal)
    
    // 定义全局 $modal 属性
    app.config.globalProperties.$modal = {
      show(name, options = {}) {
        const { buttons, ...otherOptions } = options
        
        // 如果提供了自定义按钮,创建按钮插槽
        if (buttons) {
          otherOptions.scopedSlots = {
            buttons: () => {
              return buttons.map(button => {
                return {
                  render() {
                    return h('button', {
                      class: 'button',
                      onClick: button.handler
                    }, button.text)
                  }
                }
              })
            }
          }
        }
        
        ModalPlugin.EventBus.$emit('show', { name, ...otherOptions })
      },
      hide(name) {
        ModalPlugin.EventBus.$emit('hide', name)
      },
      EventBus: ModalPlugin.EventBus
    }
  }
}

export default ModalPlugin
