import Vue from 'vue'
import Modal from '@/components/Modal.vue'

const ModalPlugin = {
  install(Vue) {
    this.EventBus = new Vue()
    
    Vue.component('Modal', Modal)
    
    Vue.prototype.$modal = {
      show(name, options = {}) {
        const { buttons, ...otherOptions } = options
        
        // 如果提供了自定义按钮,创建按钮插槽
        if (buttons) {
          otherOptions.scopedSlots = {
            buttons: () => buttons.map(button => (
              <button 
                class="button" 
                onClick={button.handler}
              >
                {button.text}
              </button>
            ))
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
