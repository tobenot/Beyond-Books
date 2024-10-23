export default class TypewriterMessage {
  constructor(role, initialContent, updateCallback) {
    this.role = role
    this.content = initialContent
    this.currentTypedLength = 0
    this.typingPromise = Promise.resolve()
    this.isPageVisible = true
    this.updateCallback = updateCallback
    
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this)
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
  }

  async updateContent(newContent) {
    this.content = newContent
    this.typingPromise = this.typingPromise.then(() => this.typewriterEffect())
  }

  async typewriterEffect() {
    let newText = this.content.slice(this.currentTypedLength)
    
    for (let i = 0; i < newText.length; i++) {
      if (!this.isPageVisible) {
        this.completeImmediately()
        return
      }
      
      await new Promise(resolve => {
        setTimeout(() => {
          this.currentTypedLength++
          this.updateCallback(this.content.slice(0, this.currentTypedLength))
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
    this.currentTypedLength = this.content.length
    this.updateCallback(this.content)
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
    this.isPageVisible = !document.hidden
    if (!this.isPageVisible) {
      this.completeImmediately()
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
  }
}
