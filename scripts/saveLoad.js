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
    const data = JSON.stringify(loadSave());
    const encryptedData = CryptoJS.AES.encrypt(data, EXPORT_SECRET_KEY).toString();
    
    const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
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
    reader.onload = function(e) {
        const encryptedData = e.target.result;
        let decryptedData;
        
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, EXPORT_SECRET_KEY);
            decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            console.error('Error decrypting save data:', error);
            alert('导入失败，密钥不匹配或数据损坏');
            return;
        }
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(decryptedData));
        initializeGameState();
        alert('存档已成功导入');
    };
    reader.readAsText(file);
}