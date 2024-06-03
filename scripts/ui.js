document.addEventListener('DOMContentLoaded', () => {
    setupInitialView();
    loadLanguageFile('zh-CN'); // 加载语言文件

    // 初始化游戏状态
    initializeGameState(loadSave()); // 加载存档中的游戏状态
    loadSectionsIndex(); // 加载章节索引
});

function setupInitialView() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
}

// 加载指定语言文件
function loadLanguageFile(lang) {
    fetch(`lang/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            updateUIWithLanguage(data);
        })
        .catch(error => console.error('加载语言文件时出错:', error));
}

// 更新UI文本为语言文件中定义的内容
function updateUIWithLanguage(data) {
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

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}

function readMore() {
    document.getElementById('story').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
}