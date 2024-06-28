const ENCRYPTION_KEY = "YourEncryptionKey";
const PUBLIC_KEY_FLAG = "publicKey"; // 用于标识当前的Key是否为公共Key
const PUBLIC_KEY_STORAGE = "publicKeyStorage"; // 存储公共Key
const FREE_TRIAL_KEY_FLAG = "freeTrialKey"; // 旧的免费试玩Key标志
const FREE_TRIAL_KEY_STORAGE = "freeTrialKeyStorage"; // 旧的免费试玩Key存储

function saveSettings(isAuto = false) {
    const apiKeyInput = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    const selectedModel = 'gpt-4o';
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

    let apiKey = apiKeyInput;
    if (isPublicKey && !apiKeyInput) {
        apiKey = publicKey;
    } else {
        localStorage.setItem(PUBLIC_KEY_FLAG, 'false');
        localStorage.removeItem(PUBLIC_KEY_STORAGE);
    }

    const settings = {
        apiKey: apiKey,
        apiUrl: apiUrl,
        model: selectedModel
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    if(!isAuto){
        alert('设置已保存');
        hideSettings()
    }
}

function loadSettings() {
    console.log('loadSettings');
    migrateOldKeys(); // 迁移旧的存档内容
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

    if (savedSettings) {
        // 如果是公共Key，则不显示在输入框中
        document.getElementById('api-key').value = isPublicKey ? "" : savedSettings.apiKey;
        document.getElementById('api-url').value = savedSettings.apiUrl;
        
        // 加载保存的模型选择
        document.getElementById('model-select').value = savedSettings.model || 'gpt-3.5-turbo';
    }else{
        // 默认设置
        const settings = {
            apiKey: '',
            apiUrl: 'https://openkey.cloud/v1/',
            model: 'gpt-4o'
        };
        localStorage.setItem('settings', JSON.stringify(settings));
        getPublicKey(true);
        loadSettings()
    }

    if (isPublicKey && publicKey) {
        document.getElementById('publicKeyButton').innerText = '更新公共key';
    }
}

function resetSettings() {
    const defaultSettings = {
        apiKey: '',
        apiUrl: 'https://openkey.cloud/v1/',
        model: 'gpt-4o'
    };
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
    getPublicKey(true);
    loadSettings();
    alert('设置已恢复默认');
}

function decrypt(data, key) {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function getPublicKey(isAuto = false) {
    const trialStatus = document.getElementById('trialStatus');
    trialStatus.innerText = '获取中...';
    fetch('https://tobenot.top/storage/keyb.txt')
        .then(response => response.text())
        .then(encryptedKey => {
            // 解密公共 Key
            const decryptedKey = decrypt(encryptedKey, ENCRYPTION_KEY);

            // 不显示公共 Key，但将其保存到本地存储
            document.getElementById('api-key').value = '';
            document.getElementById('api-key').disabled = true;
            document.getElementById('publicKeyButton').innerText = '已获取公共key';
            if(!isAuto){
                document.getElementById('publicKeyButton').disabled = true;
            }
            trialStatus.innerText = '';

            // 存储公共 Key 并标记
            localStorage.setItem(PUBLIC_KEY_STORAGE, decryptedKey);
            localStorage.setItem(PUBLIC_KEY_FLAG, 'true');

            if(!isAuto){
                alert('公共 Key 已成功获取并保存\n请使用https://openkey.cloud/v1/作为API URL。');
            }
            saveSettings(isAuto)
        })
        .catch(error => {
            trialStatus.innerText = '获取失败';
            console.error('Error getting public key:', error);
            alert('公共 Key 获取失败，可尝试其他网络环境');
        });
}

function showSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

    if (savedSettings) {
        // 如果是公共Key，则不显示在输入框中
        document.getElementById('api-key').value = isPublicKey ? "" : savedSettings.apiKey;
        // 设置API Key输入框类型为密码
        document.getElementById('api-key').type = "password";

        document.getElementById('api-url').value = savedSettings.apiUrl;
        document.getElementById('model-select').value = savedSettings.model || 'gpt-3.5-turbo';
    }

    if (isPublicKey && publicKey) {
        document.getElementById('publicKeyButton').innerText = '更新公共key';
    }

    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
}

function hideSettings() {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}

function migrateOldKeys() {
    const isFreeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_FLAG) === 'true';
    const freeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_STORAGE);

    if (isFreeTrialKey && freeTrialKey) {
        localStorage.setItem(PUBLIC_KEY_STORAGE, freeTrialKey);
        localStorage.setItem(PUBLIC_KEY_FLAG, 'true');
        localStorage.removeItem(FREE_TRIAL_KEY_FLAG);
        localStorage.removeItem(FREE_TRIAL_KEY_STORAGE);
    }
}