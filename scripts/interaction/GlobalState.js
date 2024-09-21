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
}

function setApiSettings(url, key, model) {
    API_URL = url;
    API_KEY = key;
    MODEL = model;
}