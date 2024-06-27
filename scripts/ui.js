// scripts/ui.js

function initializeUI() {
    console.log('initializeUI');
    setupInitialView();
}

function setupInitialView() {
    // 确保只有主菜单显示
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('sections').style.display = 'none';
    document.getElementById('story').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('sections').style.display = 'flex';
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