/**
 * StreamHandler 类使用手册
 * 
 * 这个类用于处理流式响应，主要用于处理来自大型语言模型的流式输出。
 * 
 * 使用方法：
 * 1. 初始化：
 *    const streamHandler = new StreamHandler();
 * 
 * 2. 处理流式响应：
 *    使用 fetchStream 方法发起请求并处理响应：
 *    
 *    streamHandler.fetchStream(url, options, updateCallback)
 *      .then(result => {
 *        console.log('最终结果:', result);
 *      })
 *      .catch(error => {
 *        console.error('错误:', error);
 *      });
 * 
 * 参数说明：
 * - url: 请求的URL，例如 'https://api.deepbricks.ai/v1/chat/completions'
 * - options: fetch 请求的选项，包括方法、头部和主体
 * - updateCallback: 用于更新部分结果的回调函数
 * 
 * 示例：
 * const url = 'https://api.deepbricks.ai/v1/chat/completions';
 * const options = {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${OPENAI_API_KEY}`
 *   },
 *   body: JSON.stringify({
 *     model: 'gpt-4o-mini',
 *     messages: [{ role: 'user', content: userMessage }],
 *     stream: true
 *   })
 * };
 * 
 * streamHandler.fetchStream(url, options, (partialResponse) => {
 *   updateAssistantMessage(partialResponse);
 * })
 * .then(finalResult => {
 *   console.log('完整的助手回复:', finalResult);
 * })
 * .catch(error => {
 *   console.error('流式请求错误:', error);
 * });
 */
class StreamHandler {
    constructor() {
        this.decoder = new TextDecoder('utf-8');
        this.buffer = '';
    }

    async handleStream(response, updateCallback) {
        const reader = response.body.getReader();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            this.buffer += this.decoder.decode(value, { stream: true });
            const lines = this.buffer.split('\n');

            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i];
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') {
                        break;
                    }
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.choices && data.choices[0].delta.content) {
                            result += data.choices[0].delta.content;
                            updateCallback(result);
                        }
                    } catch (e) {
                        console.error('JSON解析错误:', e);
                    }
                }
            }
            this.buffer = lines[lines.length - 1];
        }

        return result;
    }

    async fetchStream(url, options, updateCallback) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Accept': 'text/event-stream'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await this.handleStream(response, updateCallback);
        } catch (error) {
            console.error('流式请求错误:', error);
            throw error;
        }
    }
}

// 初始化 StreamHandler
function initializeStreamHandler() {
    console.log("流式处理器已初始化");
}