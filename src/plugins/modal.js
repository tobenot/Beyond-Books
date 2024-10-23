import { h } from 'vue'
import ModalDialog from '@/components/ModalDialog.vue'

export const ModalPlugin = {
  install(app) {
    const eventBus = new Map()
    
    app.config.globalProperties.$modal = {
      show(name, options = {}) {
        const { buttons, ...otherOptions } = options
        
        if (buttons) {
          otherOptions.slots = {
            buttons: () => buttons.map(button => {
              return h('button', {
                class: 'button',
                onClick: button.handler
              }, button.text)
            })
          }
        }
        
        eventBus.set('show', { name, ...otherOptions })
      },
      hide(name) {
        eventBus.set('hide', name)
      },
      EventBus: eventBus
    }
    
    app.component('base-modal', ModalDialog)
  }
}

export default ModalPlugin
