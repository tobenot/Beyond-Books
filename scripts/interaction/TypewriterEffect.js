class TypewriterMessage {
    constructor(role, initialContent) {
        this.role = role;
        this.content = initialContent;
        this.element = this.createMessageElement();
        this.currentTypedLength = 0;
        this.typingPromise = Promise.resolve();
        this.isPageVisible = true;
        this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    createMessageElement() {
        const element = document.createElement('div');
        element.className = 'message';
        element.setAttribute('data-role', this.role);
        document.getElementById('storyContent').appendChild(element);
        return element;
    }

    async updateContent(newContent) {
        this.content = newContent;
        this.typingPromise = this.typingPromise.then(() => this.typewriterEffect());
    }

    async typewriterEffect() {
        let newText = this.content.slice(this.currentTypedLength);
        
        for (let i = 0; i < newText.length; i++) {
            if (!this.isPageVisible) {
                this.completeImmediately();
                return;
            }
            
            await new Promise(resolve => {
                setTimeout(() => {
                    this.currentTypedLength++;
                    this.element.innerHTML = formatContent(this.role, this.content.slice(0, this.currentTypedLength)) + '<br><br>';
                    this.scrollIfNeeded();
                    resolve();
                }, 10);
            });

            if (i < newText.length - 1) {
                await new Promise(resolve => {
                    setTimeout(resolve, getDelay(newText[i]));
                });
            }
        }
    }

    async completeImmediately() {
        this.currentTypedLength = this.content.length;
        this.element.innerHTML = formatContent(this.role, this.content) + '<br><br>';
        this.scrollIfNeeded();
    }

    scrollIfNeeded() {
        const storyContentDiv = document.getElementById('storyContent');
        const scrollPosition = storyContentDiv.scrollTop + storyContentDiv.clientHeight;
        const scrollThreshold = storyContentDiv.scrollHeight - 100;
        
        if (scrollPosition >= scrollThreshold && this.isLastMessage()) {
            storyContentDiv.scrollTop = storyContentDiv.scrollHeight;
        }
    }

    isLastMessage() {
        const messages = document.querySelectorAll('#storyContent .message');
        return messages[messages.length - 1] === this.element;
    }

    handleVisibilityChange() {
        this.isPageVisible = !document.hidden;
        if (!this.isPageVisible) {
            this.completeImmediately();
        }
    }

    destroy() {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
}

const KEY_LENGTH = 10;
const CONTENT_LENGTH_THRESHOLD = KEY_LENGTH + 2;

class MessageManager {
    constructor() {
        this.messages = [];
    }

    updateMessage(role, content) {
        const key = this.getUnicodeLengthSlice(content, 0, KEY_LENGTH);
        let existingMessage = this.findMatchingMessage(key);
        if (existingMessage) {
            existingMessage.updateContent(content);
            const existingIndex = this.messages.findIndex(item => item.message === existingMessage);
            if (existingIndex !== -1) {
                this.messages[existingIndex].key = key;
            }
        } else {
            const newMessage = new TypewriterMessage(role, content);
            this.messages.push({ key, message: newMessage });
        }
    }

    findMatchingMessage(key) {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const { key: existingKey, message } = this.messages[i];
            if (this.getUnicodeLength(message.content) > CONTENT_LENGTH_THRESHOLD) {
                if (key === existingKey) {
                    return message;
                }
            } else {
                if (key.startsWith(existingKey) || existingKey.startsWith(key)) {
                    return message;
                }
            }
        }
        return null;
    }

    isMessageStreaming(content) {
        const key = this.getUnicodeLengthSlice(content, 0, 10);
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const { message } = this.messages[i];
            const messageKey = this.getUnicodeLengthSlice(message.content, 0, 10);
            if (key.startsWith(messageKey) || messageKey.startsWith(key)) {
                return message.currentTypedLength < this.getUnicodeLength(message.content);
            }
        }
        return false;
    }

    completeAllMessages() {
        this.messages.forEach(({ message }) => {
            message.completeImmediately();
        });
    }

    getUnicodeLength(str) {
        return [...str].length;
    }

    getUnicodeLengthSlice(str, start, end) {
        return [...str].slice(start, end).join('');
    }

    destroy() {
        this.messages.forEach(({ message }) => message.destroy());
        this.messages = [];
    }
}

function getDelay(char) {
    if ('.。!！?？'.includes(char)) {
        return 250;
    } else if (',，;；'.includes(char)) {
        return 80;
    } else {
        return Math.random() * 20 + 1;
    }
}

const messageManager = new MessageManager();