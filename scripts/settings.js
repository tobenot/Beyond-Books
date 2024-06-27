const ENCRYPTION_KEY = "YourEncryptionKey";
const FREE_TRIAL_KEY_FLAG = "freeTrialKey"; // 用于标识当前的Key是否为免费试玩的Key
const FREE_TRIAL_KEY_STORAGE = "freeTrialKeyStorage"; // 存储免费试玩Key

function saveSettings() {
    const apiKeyInput = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    const selectedModel = document.getElementById('model-select').value;
    const isFreeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_FLAG) === 'true';
    const freeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_STORAGE);

    let apiKey = apiKeyInput;
    if (isFreeTrialKey && !apiKeyInput) {
        // 如果是免费试用Key且没有输入新的Key，则继续使用免费试用Key
        apiKey = freeTrialKey;
    } else {
        // 清除免费试玩Key的标识
        localStorage.setItem(FREE_TRIAL_KEY_FLAG, 'false');
        localStorage.removeItem(FREE_TRIAL_KEY_STORAGE);
    }

    const settings = {
        apiKey: apiKey,
        apiUrl: apiUrl,
        model: selectedModel // 保存选定的模型
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    alert('设置已保存');
}

function loadSettings() {
    console.log('loadSettings');
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    const isFreeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_FLAG) === 'true';
    const freeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_STORAGE);

    if (savedSettings) {
        // 如果是免费试玩的Key，则不显示在输入框中
        document.getElementById('api-key').value = isFreeTrialKey ? "" : savedSettings.apiKey;
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
        getFreeTrialKey(true);
        loadSettings()
    }

    if (isFreeTrialKey && freeTrialKey) {
        document.getElementById('freeTrialButton').innerText = '更新免费key';
    }
}

function decrypt(data, key) {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function getFreeTrialKey(isFirst = false) {
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
            if(!isFirst){
                document.getElementById('freeTrialButton').disabled = true;
            }
            trialStatus.innerText = '';

            // 存储免费试用 Key 并标记
            localStorage.setItem(FREE_TRIAL_KEY_STORAGE, decryptedKey);
            localStorage.setItem(FREE_TRIAL_KEY_FLAG, 'true');

            if(!isFirst){
                alert('免费试用 Key 已成功获取并保存\n请使用https://openkey.cloud/v1/作为API URL。');
            }
            saveSettings()
        })
        .catch(error => {
            trialStatus.innerText = '获取失败';
            console.error('Error getting free trial key:', error);
        });
}

function showSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    const isFreeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_FLAG) === 'true';
    const freeTrialKey = localStorage.getItem(FREE_TRIAL_KEY_STORAGE);

    if (savedSettings) {
        // 如果是免费试玩的Key，则不显示在输入框中
        document.getElementById('api-key').value = isFreeTrialKey ? "" : savedSettings.apiKey;
        // 设置API Key输入框类型为密码
        document.getElementById('api-key').type = "password";

        document.getElementById('api-url').value = savedSettings.apiUrl;
        document.getElementById('model-select').value = savedSettings.model || 'gpt-3.5-turbo';
    }

    if (isFreeTrialKey && freeTrialKey) {
        document.getElementById('freeTrialButton').innerText = '更新免费key';
    }

    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
}

function hideSettings() {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
}