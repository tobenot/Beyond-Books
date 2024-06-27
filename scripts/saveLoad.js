const SAVE_KEY = "beyondBooksSaveData";
const EXPORT_SECRET_KEY = "YourExportSecretKey";

// 读取存档
function loadSave() {
    const rawData = localStorage.getItem(SAVE_KEY);
    return rawData ? JSON.parse(rawData) : null;
}

// 保存存档
function saveGame(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// 清空存档
function clearSave() {
    localStorage.removeItem(SAVE_KEY);
}

// 开始新游戏
function newGame() {
    clearSave();
    initializeGameState();
    startGame();
}

function continueGame() {
    const save = loadSave(); // 从本地存储中读取存档数据
    if (save) {
        initializeGameState(save); // 如果有存档数据，则使用该数据初始化游戏状态
    } else {
        alert('没有找到任何存档。请先开始新游戏。');
        return;
    }
    loadSectionsIndex();
    startGame();
}

// 导出存档
function exportSave() {
    const gameData = JSON.stringify(loadSave());
    const reviewData = JSON.stringify(loadReviews());
    const combinedData = JSON.stringify({
        gameData: CryptoJS.AES.encrypt(gameData, EXPORT_SECRET_KEY).toString(),
        reviewData: CryptoJS.AES.encrypt(reviewData, EXPORT_SECRET_KEY).toString()
    });

    const blob = new Blob([combinedData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'saveData.bbs';
    a.click();

    URL.revokeObjectURL(url);
}

// 导入存档
function importSave(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const combinedData = e.target.result;
        let decryptedGameData, decryptedReviewData;
        
        try {
            const data = JSON.parse(combinedData);
            decryptedGameData = JSON.parse(CryptoJS.AES.decrypt(data.gameData, EXPORT_SECRET_KEY).toString(CryptoJS.enc.Utf8));
            decryptedReviewData = JSON.parse(CryptoJS.AES.decrypt(data.reviewData, EXPORT_SECRET_KEY).toString(CryptoJS.enc.Utf8));
        } catch (error) {
            console.error('解密存档数据时出错:', error);
            alert('导入失败，密钥不匹配或数据损坏');
            return;
        }

        localStorage.setItem(SAVE_KEY, JSON.stringify(decryptedGameData));
        localStorage.setItem(REVIEW_KEY, JSON.stringify(decryptedReviewData));

        initializeGameState();
        alert('存档已成功导入');
    };
    reader.readAsText(file);
}

function checkSaveStatus() {
    const hasSave = loadSave() !== null;
    document.getElementById('gameProgressButtons').style.display = hasSave ? 'flex' : 'none';
    document.getElementById('newGameButton').style.display = hasSave ? 'none' : 'block';
    document.getElementById('deleteSaveButton').style.display = hasSave ? 'block' : 'none';
    document.getElementById('exportSaveButton').style.display = hasSave ? 'block' : 'none';
}

function deleteSave() {
    clearSave(); // 移除存档
    location.reload(); // 刷新页面
}