// scripts/ui.js

document.addEventListener('DOMContentLoaded', () => {
    // 初始显示设置
    setupInitialView();

    // 加载语言文件
    loadLanguageFile('zh-CN');
    
    // 加载章节索引
    loadSectionsIndex();
});

function setupInitialView() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}

function readMore() {
    document.getElementById('story').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}

function updateUIWithLanguage(data) {
    document.title = data.title;
    document.getElementById('mainTitle').innerText = data.mainTitle;
    document.getElementById('subTitle').innerText = data.subTitle;
    document.querySelector('button[onclick="startGame()"]').innerText = data.startButton;
    document.getElementById('sections').innerHTML = `<h2>${data.chooseSection}</h2>`;
    document.querySelector('button[onclick="readMore()"]').innerText = data.readMore;
    document.getElementById('freeChoice').placeholder = data.inputPlaceholder;
}