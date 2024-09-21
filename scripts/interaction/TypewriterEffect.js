class TypewriterMessage {
    constructor(role, initialContent) {
        this.role = role;
        this.content = initialContent;
        this.element = this.createMessageElement();
        this.currentTypedLength = 0;
        this.typingPromise = Promise.resolve();
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
}

class MessageManager {
    constructor() {
        this.messages = [];
    }

    updateMessage(role, content) {
        const key = content.slice(0, 10);
        let existingMessage = this.findMatchingMessage(key);
        if (existingMessage) {
            existingMessage.updateContent(content);
        } else {
            const newMessage = new TypewriterMessage(role, content);
            this.messages.push({ key, message: newMessage });
        }
    }

    findMatchingMessage(key) {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const { key: existingKey, message } = this.messages[i];
            if (key.startsWith(existingKey) || existingKey.startsWith(key)) {
                return message;
            }
        }
        return null;
    }

    isMessageStreaming(content) {
        const key = content.slice(0, 10);
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const { message } = this.messages[i];
            if (key.startsWith(message.content.slice(0, 10)) || 
                message.content.slice(0, 10).startsWith(key)) {
                return message.currentTypedLength < message.content.length;
            }
        }
        return false;
    }
}

function getDelay(char) {
    if ('.。!！?？'.includes(char)) {
        return 300;
    } else if (',，;；'.includes(char)) {
        return 100;
    } else {
        return Math.random() * 20 + 10;
    }
}

const messageManager = new MessageManager();