// scripts/ui.js

function initializeUI() {
    console.log('initializeUI');
    setupInitialView();
}

function setupInitialView() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('storyContainer').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sectionsContainer').style.display = 'flex';
}

function readMore() {
    // 不再在这里切换到桥段选择界面
    // document.getElementById('story').style.display = 'none';
    // document.getElementById('sections').style.display = 'flex';
}

function showSettings() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
}

function hideSettings() {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}