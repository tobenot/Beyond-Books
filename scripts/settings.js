const ENCRYPTION_KEY = "YourEncryptionKey";
const FREE_TRIAL_KEY_FLAG = "freeTrialKey"; // 用于标识当前的Key是否为免费试玩的Key

function saveSettings() {
    const apiKey = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    const selectedModel = document.getElementById('model-select').value;

    // 清除免费试玩Key的标识
    localStorage.setItem(FREE_TRIAL_KEY_FLAG, 'false');

    const settings = {
        apiKey: apiKey,
        apiUrl: apiUrl,
        model: selectedModel, // 保存选定的模型
        isFreeTrialKey: false // 标记已存储的Key为用户输入的Key
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    alert('设置已保存');
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    if (savedSettings) {
        // 如果是免费试玩的Key，则不显示在输入框中
        document.getElementById('api-key').value = savedSettings.isFreeTrialKey ? "" : savedSettings.apiKey;
        document.getElementById('api-url').value = savedSettings.apiUrl;
        
        // 加载保存的模型选择
        document.getElementById('model-select').value = savedSettings.model || 'gpt-3.5-turbo';
    }
}

function decrypt(data, key) {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function getFreeTrialKey() {
    const trialStatus = document.getElementById('trialStatus');
    trialStatus.innerText = '获取中...';
    fetch('https://tobenot.top/storage/keyb.txt')
        .then(response => response.text())
        .then(encryptedKey => {
            // 解密免费试玩 Key
            const decryptedKey = decrypt(encryptedKey, ENCRYPTION_KEY);

            // 不显示免费 Key，但将其保存到本地存储
            document.getElementById('api-key').value = '';
            document.getElementById('api-key').disabled = true;
            document.getElementById('freeTrialButton').innerText = '已获取免费key';
            document.getElementById('freeTrialButton').disabled = true;
            trialStatus.innerText = '';

            // 存储免费试用 Key 并标记
            const settings = {
                apiKey: decryptedKey,
                apiUrl: document.getElementById('api-url').value,
                isFreeTrialKey: true
            };

            localStorage.setItem('settings', JSON.stringify(settings));
            localStorage.setItem(FREE_TRIAL_KEY_FLAG, 'true');

            alert('免费试用 Key 已成功获取并保存');
        })
        .catch(error => {
            trialStatus.innerText = '获取失败';
            console.error('Error getting free trial key:', error);
        });
}

function showSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    if (savedSettings) {
        // 如果是免费试玩的Key，则不显示在输入框中
        document.getElementById('api-key').value = savedSettings.isFreeTrialKey ? "" : savedSettings.apiKey;
        // 设置API Key输入框类型为密码
        document.getElementById('api-key').type = "password";

        document.getElementById('api-url').value = savedSettings.apiUrl;
        document.getElementById('model-select').value = savedSettings.model || 'gpt-3.5-turbo';
    }
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
}

function hideSettings() {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

/* 游戏初始化时加载设置 */
document.addEventListener('DOMContentLoaded', loadSettings);