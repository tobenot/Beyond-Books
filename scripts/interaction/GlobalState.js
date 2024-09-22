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
const COMPRESSION_THRESHOLD = 2;
const MERGE_THRESHOLD = 5;
const MESSAGES_TO_MERGE = 3;

class AIService {
    static async callLargeLanguageModel(prompt) {
        const requestBody = JSON.stringify({ 
            model: getModel(),
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000
        });

        try {
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

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error(`调用大语言模型时发生错误: ${error.message}`);
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
        }

        if (optimizedConversationHistory.length >= MERGE_THRESHOLD) {
            const toMerge = optimizedConversationHistory.slice(0, MESSAGES_TO_MERGE);
            const merged = await mergeMessages(toMerge);
            optimizedConversationHistory = [
                { role: "system", content: merged },
                ...optimizedConversationHistory.slice(MESSAGES_TO_MERGE)
            ];
            compressedMessageIndices = new Set([0]);
        }
    } catch (error) {
        console.error("压缩历史记录时出错:", error);
    }
}

async function compressMessage(message, index) {
    const prompt = `
请对以下单条消息进行简洁的压缩，保留关键信息：

${message.role}: ${message.content}

请用简洁的语言总结上述消息的要点，保持原有的角色。
`;

    const compressedContent = await AIService.callLargeLanguageModel(prompt);
    return { 
        compressedMessage: { ...message, content: compressedContent },
        index
    };
}

async function mergeMessages(messages) {
    const prompt = `
请对以下多条对话进行整体压缩，生成一个简洁但信息丰富的摘要：

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

请生成一个简洁的摘要，概括上述对话的主要内容和关键点。
`;

    return await AIService.callLargeLanguageModel(prompt);
}

function addToOptimizedConversationHistory(entry) {
    optimizedConversationHistory.push(entry);
    compressionQueue.enqueue(() => compressConversationHistory());
}

function resetCompressionState() {
    compressedMessageIndices.clear();
}

function resetGlobalState() {
    isSubmitting = false;
    isCooldown = false;
    conversationHistory = [];
    optimizedConversationHistory = [];
    currentSection = null;
    currentIsReplay = false;
    resetCompressionState();
}