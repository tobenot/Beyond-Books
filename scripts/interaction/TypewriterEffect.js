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
            // 更新key为更长的消息的key
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
            // 添加长度检查
            if (this.getUnicodeLength(message.content) > CONTENT_LENGTH_THRESHOLD) {
                // 如果消息长度超过阈值，要求完全匹配
                if (key === existingKey) {
                    return message;
                }
            } else {
                // 对于较短的消息，保持原有的部分匹配逻辑
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

    // 新增方法：计算字符串的 Unicode 长度
    getUnicodeLength(str) {
        return [...str].length;
    }

    // 新增方法：按 Unicode 长度截取字符串
    getUnicodeLengthSlice(str, start, end) {
        return [...str].slice(start, end).join('');
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