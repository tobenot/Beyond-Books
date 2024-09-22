// 全局状态
let isSubmitting = false;
let isCooldown = false;
let conversationHistory = [];
let selectedCharacter = '罗伯特';
let currentSection = null;
let currentIsReplay = false;
let optimizedConversationHistory = [];

const COOLDOWN_TIME = 1000; // 冷却时间，单位为毫秒

let API_URL;
let API_KEY;
let MODEL;

// 提供一些修改这些变量的函数
function setIsSubmitting(value) {
    isSubmitting = value;
}

function setIsCooldown(value) {
    isCooldown = value;
}

function setSelectedCharacter(character) {
    selectedCharacter = character;
}

function setCurrentSection(section) {
    currentSection = section;
}

function setCurrentIsReplay(value) {
    currentIsReplay = value;
}

function addToConversationHistory(entry) {
    conversationHistory.push(entry);
}

function addToOptimizedConversationHistory(entry) {
    optimizedConversationHistory.push(entry);
    compressionQueue.enqueue(() => compressConversationHistory());
}

function setApiSettings(url, key, model) {
    API_URL = url;
    API_KEY = key;
    MODEL = model;
    console.log('API设置已更新:', { API_URL, MODEL });
}

let isCompressing = false;
const COMPRESSION_THRESHOLD = 1;
const MERGE_THRESHOLD = 3;
const MESSAGES_TO_MERGE = 2;

class AIService {
    static async callLargeLanguageModel(prompt) {
        console.log(`[DEBUG] 开始调用大语言模型，提示词: ${prompt}`);
        console.log(`[DEBUG] API_URL: ${API_URL}`);
        console.log(`[DEBUG] MODEL: ${MODEL}`);
        
        const requestBody = JSON.stringify({ 
            model: getModel(),
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000
        });
        console.log(`[DEBUG] 请求体: ${requestBody}`);

        try {
            console.log(`[DEBUG] 发送API请求...`);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                },
                body: requestBody,
                credentials: 'include'
            });

            console.log(`[DEBUG] 收到API响应，状态码: ${response.status}`);

            if (!response.ok) {
                console.error(`[ERROR] API请求失败: ${response.status}`);
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[DEBUG] API响应数据: ${JSON.stringify(data)}`);

            const content = data.choices[0].message.content;
            console.log(`[DEBUG] 模型返回内容长度: ${content.length}`);
            return content;
        } catch (error) {
            console.error(`[ERROR] 调用大语言模型时发生错误: ${error.message}`);
            throw error;
        }
    }
}

class CompressionQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    enqueue(task) {
        this.queue.push(task);
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            try {
                await task();
            } catch (error) {
                console.error("压缩任务执行错误:", error);
            }
        }

        this.isProcessing = false;
    }
}

const compressionQueue = new CompressionQueue();

let compressedMessageIndices = new Set();

async function compressConversationHistory() {
    if (optimizedConversationHistory.length < COMPRESSION_THRESHOLD) {
        return;
    }

    try {
        debugLog("开始压缩历史记录", `历史记录长度: ${optimizedConversationHistory.length}`);
        // 对COMPRESSION_THRESHOLD条前的未压缩消息进行单条压缩
        if (optimizedConversationHistory.length >= COMPRESSION_THRESHOLD) {
            const compressPromises = optimizedConversationHistory.slice(0, -COMPRESSION_THRESHOLD)
                .map((message, index) => ({ message, index }))
                .filter(({ index }) => !compressedMessageIndices.has(index))
                .map(({ message, index }) => compressMessage(message, index));
            const compressedResults = await Promise.all(compressPromises);
            
            compressedResults.forEach(({ compressedMessage, index }) => {
                optimizedConversationHistory[index] = compressedMessage;
                compressedMessageIndices.add(index);
            });
            debugLog("单条消息压缩完成", `压缩消息数量: ${compressedResults.length}`);
        }

        // 对总消息达到阈值的情况进行整体压缩
        if (optimizedConversationHistory.length >= MERGE_THRESHOLD) {
            const toMerge = optimizedConversationHistory.slice(0, MESSAGES_TO_MERGE);
            const merged = await mergeMessages(toMerge);
            optimizedConversationHistory = [
                { role: "system", content: merged },
                ...optimizedConversationHistory.slice(MESSAGES_TO_MERGE)
            ];
            compressedMessageIndices = new Set([0]);
            debugLog("整体压缩完成", `新历史记录长度: ${optimizedConversationHistory.length}`);
        }
    } catch (error) {
        console.error("压缩历史记录时出错:", error);
        debugLog("压缩历史记录出错", `错误信息: ${error.message}`);
    }
}

async function compressMessage(message, index) {
    debugLog("开始压缩单条消息", `索引: ${index}, 角色: ${message.role}`);
    const prompt = `
请对以下单条消息进行简洁的压缩，保留关键信息：

${message.role}: ${message.content}

请用简洁的语言总结上述消息的要点，保持原有的角色。
`;

    const compressedContent = await AIService.callLargeLanguageModel(prompt);
    debugLog("单条消息压缩完成", `索引: ${index}, 原长度: ${message.content.length}, 压缩后长度: ${compressedContent.length}, 压缩后消息：${compressedContent}`);
    return { 
        compressedMessage: { ...message, content: compressedContent },

        index
    };
}

async function mergeMessages(messages) {
    debugLog("开始合并消息", `消息数量: ${messages.length}`);
    const prompt = `
请对以下多条对话进行整体压缩，生成一个简洁但信息丰富的摘要：

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

请生成一个简洁的摘要，概括上述对话的主要内容和关键点。
`;

    const result = await AIService.callLargeLanguageModel(prompt);
    debugLog("消息合并完成", `原总长度: ${messages.reduce((sum, m) => sum + m.content.length, 0)}, 合并后长度: ${result.length}  压缩后消息：${result}`);
    return result;
}

function addToOptimizedConversationHistory(entry) {
    optimizedConversationHistory.push(entry);
    compressionQueue.enqueue(() => compressConversationHistory());
}

// 新增函数，用于重置压缩状态（在需要时调用，比如开始新对话时）
function resetCompressionState() {
    compressedMessageIndices.clear();
}

// 新增函数：重置全局状态
function resetGlobalState() {
    isSubmitting = false;
    isCooldown = false;
    conversationHistory = [];
    optimizedConversationHistory = [];
    currentSection = null;
    currentIsReplay = false;
    resetCompressionState();
}

// 添加调试函数
function debugLog(message, data = null) {
    if (isCarrotTest()) {
        console.log(`[DEBUG 压缩] ${message}`, data);
    }
}

function isCarrotTest() {
    return new URLSearchParams(window.location.search).has('carrot');
}