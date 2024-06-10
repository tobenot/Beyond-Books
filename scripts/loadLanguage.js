// scripts/loadLanguage.js

async function loadLanguageFile(lang) {
    try {
        const response = await fetch(`lang/${lang}.json?v=${new Date().getTime()}`);
        const data = await response.json();
        console.log('Loaded language data:', data); // 添加这行日志
        updateUIWithLanguage(data);
    } catch (error) {
        console.error('加载语言文件时出错:', error);
    }
}

function updateUIWithLanguage(data) {
    console.log('Updating UI with language data:', data); // 添加这行日志

    // 设置页面标题
    document.title = data.title;

    // 设置主标题和副标题
    document.getElementById('mainTitle').innerText = data.mainTitle;
    document.getElementById('subTitle').innerText = data.subTitle;

    // 设置按钮文本
    document.getElementById('newGameButton').innerText = data.newGameButton;
    document.getElementById('continueGameButton').innerText = data.continueGameButton;
    document.getElementById('exportSaveButton').innerText = data.exportSaveButton;
    document.getElementById('importSaveButton').innerText = data.importSaveButton;

    // 设置章节选择标题
    document.getElementById('sections').innerHTML = `<h2>${data.chooseSection}</h2>`;

    // 设置阅读完成按钮文本
    const readMoreButton = document.querySelector('button[onclick="readMore()"]');
    if (readMoreButton) {
        readMoreButton.innerText = data.readMore;
    }

    // 设置输入框占位文本
    const freeChoiceInput = document.querySelector('.controls input[type="text"]');
    if (freeChoiceInput) {
        freeChoiceInput.setAttribute('placeholder', data.inputPlaceholder);
    }
}

// 这个不会触发，可能是加载方式不对
document.addEventListener('DOMContentLoaded', () => {
    console.log('loadLanguage.js DOM fully loaded and parsed');
    loadLanguageFile('zh-CN');
});

// onload能触发，不过触发的很晚
window.onload = function() {
    console.log('loadLanguage.js Window loaded');
    loadLanguageFile('zh-CN');
};