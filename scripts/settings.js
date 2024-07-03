const ENCRYPTION_KEY = "YourEncryptionKey";
const PUBLIC_KEY_FLAG = "publicKey"; // 用于标识当前的Key是否为公共Key
const PUBLIC_KEY_STORAGE = "publicKeyStorage"; // 存储公共Key
const FREE_TRIAL_KEY_FLAG = "freeTrialKey"; // 旧的免费试玩Key标志
const FREE_TRIAL_KEY_STORAGE = "freeTrialKeyStorage"; // 旧的免费试玩Key存储

const settingsText = {
    settingsTitle: "设置",
    apiKeyLabel: "API Key",
    apiUrlLabel: "API URL",
    modelSelectLabel: "模型指定gpt4o",
    whatIsThisButton: "这是什么？",
    saveButton: "保存设置",
    publicKeyButton: "已获取公共key",
    resetSettingsButton: "恢复默认设置",
    exitButton: "不保存退出",
    helpModalTitle: "帮助信息",
    helpContent: `
        <p>本游戏<strong>基于</strong>可访问<strong>gpt-4o</strong>模型的接口API进行，您可自行寻找相关API服务，默认API地址不构成推荐建议</p>
        <p>第一次打开游戏网页时会自动尝试获取公共key，所以您可能直接开始游戏就可以游玩了。</p>
        <p>公共key是作者早先用于开发大模型游戏的，其额度将于<strong>2024年7月12日</strong>过期（或者在此之前用完），届时会再另起公共key，API URL可能会更新</p>
        <p>如遇无法输入API KEY，可以刷新网页</p>
    `,
    helpCloseButton: "关闭",
    settingsSavedAlert: "设置已保存",
    settingsResetAlert: "设置已恢复默认",
    publicKeyFetching: "获取中...",
    publicKeyFetched: "公共 Key 已成功获取并保存\n请使用https://openkey.cloud/v1/作为API URL。",
    publicKeyFetchFailed: "公共 Key 获取失败，可尝试其他网络环境"
};

function initSettingsUI() {
    document.getElementById('settingTitle').innerText = settingsText.settingsTitle;
    document.getElementById('settingApiKeyLabel').innerText = settingsText.apiKeyLabel;
    document.getElementById('settingApiUrlLabel').innerText = settingsText.apiUrlLabel;
    document.getElementById('settingModelSelectLabel').innerText = settingsText.modelSelectLabel;
    document.getElementById('settingWhatIsThisButton').innerText = settingsText.whatIsThisButton;
    document.getElementById('settingSaveButton').innerText = settingsText.saveButton;
    document.getElementById('settingPublicKeyButton').innerText = settingsText.publicKeyButton;
    document.getElementById('settingResetSettingsButton').innerText = settingsText.resetSettingsButton;
    document.getElementById('settingExitButton').innerText = settingsText.exitButton;

    // 帮助信息内容
    document.getElementById('settingHelpModalTitle').innerText = settingsText.helpModalTitle;
    document.getElementById('settingHelpContent').innerHTML = settingsText.helpContent;
    document.getElementById('settingHelpCloseButton').innerText = settingsText.helpCloseButton;
};

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
        document.getElementById('settingPublicKeyButton').innerText = '更新公共key';
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
            document.getElementById('settingPublicKeyButton').innerText = '已获取公共key';
            if(!isAuto){
                document.getElementById('settingPublicKeyButton').disabled = true;
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
    }

    if (isPublicKey && publicKey) {
        document.getElementById('settingPublicKeyButton').innerText = '更新公共key';
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

// 显示帮助信息
function showHelp() {
    document.getElementById('helpModal').style.display = 'flex';
}

// 隐藏帮助信息
function hideHelp() {
    document.getElementById('helpModal').style.display = 'none';
}