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

function exportSave() {
    const gameData = JSON.stringify(loadSave());
    const reviewData = JSON.stringify(loadReviews());
    const combinedData = JSON.stringify({
        gameData: CryptoJS.AES.encrypt(gameData, EXPORT_SECRET_KEY).toString(),
        reviewData: CryptoJS.AES.encrypt(reviewData, EXPORT_SECRET_KEY).toString()
    });
    const blob = new Blob([combinedData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}${month}${day}_${hour}${minute}`;

    // 默认文件名带上时间戳
    let filename = prompt("请输入存档文件名：", `BeyondBooks存档_${timestamp}.savegame`);
    if (filename === null || filename.trim() === "") { 
        filename = `BeyondBooks存档_${timestamp}.savegame`; 
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename; 
    a.click();

    URL.revokeObjectURL(url);
}

function importSave(event) {
    if (!confirm('您确定要导入并覆盖存档吗？此操作无法撤销。您可以先导出自己的存档进行备份。')) {
        return;
    }
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        alert("请注意：在手机浏览器上，导入存档会触发浏览器文件上传功能，如果浏览器没有权限，它可能会向您申请。");
    }
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

        initializeGameState(decryptedGameData);
        alert('存档已成功导入，即将刷新');
        location.reload();
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
    if (confirm('您确定要删除存档吗？此操作无法撤销。')) {
        clearSave(); // 移除存档
        location.reload(); // 刷新页面
    }
}