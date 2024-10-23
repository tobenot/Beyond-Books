import { ref } from 'vue'

export default class TypewriterMessage {
  constructor(role, initialContent, updateCallback) {
    this.role = role
    this.content = ref(initialContent)
    this.currentTypedLength = ref(0)
    this.typingPromise = Promise.resolve()
    this.isPageVisible = ref(true)
    this.updateCallback = updateCallback
    
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this)
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  async updateContent(newContent) {
    this.content.value = newContent
    this.typingPromise = this.typingPromise.then(() => this.typewriterEffect())
  }

  async typewriterEffect() {
    let newText = this.content.value.slice(this.currentTypedLength.value)
    
    for (let i = 0; i < newText.length; i++) {
      if (!this.isPageVisible.value) {
        this.completeImmediately()
        return
      }
      
      await new Promise(resolve => {
        setTimeout(() => {
          this.currentTypedLength.value++
          this.updateCallback(this.content.value.slice(0, this.currentTypedLength.value))
          resolve()
        }, 10)
      })

      if (i < newText.length - 1) {
        await new Promise(resolve => {
          setTimeout(resolve, this.getDelay(newText[i]))
        })
      }
    }
  }

  async completeImmediately() {
    this.currentTypedLength.value = this.content.value.length
    this.updateCallback(this.content.value)
  }

  getDelay(char) {
    if ('.。!！?？'.includes(char)) {
      return 250
    } else if (',，;；'.includes(char)) {
      return 80
    } else {
      return Math.random() * 20 + 1
    }
  }

  handleVisibilityChange() {
    this.isPageVisible.value = !document.hidden
    if (!this.isPageVisible.value) {
      this.completeImmediately()
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
  }
}
