// scripts/ui.js

function initializeUI() {
    document.getElementById('settingsButton').innerText = "设置";
    
    document.addEventListener('DOMContentLoaded', () => {
        setupInitialView();

        // 初始化游戏状态
        initializeGameState(loadSave()); // 加载存档中的游戏状态
        loadSectionsIndex(); // 加载章节索引
    });
}

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

function showSettings() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
}

function hideSettings() {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

document.getElementById("settingsButton").innerText = "设置";