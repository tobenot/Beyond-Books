// 重构时需要参考的文件:
// - scripts/interaction/StreamHandler.js

// 流处理器类
export default class StreamHandler {
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
