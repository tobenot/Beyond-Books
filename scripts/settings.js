const ENCRYPTION_KEY = "YourEncryptionKey";
const PUBLIC_KEY_FLAG = "publicKey"; // 用于标识当前的Key是否为公共Key
const PUBLIC_KEY_STORAGE = "publicKeyStorage"; // 存储公共Key
const FREE_TRIAL_KEY_FLAG = "freeTrialKey"; // 旧的免费试玩Key标志
const FREE_TRIAL_KEY_STORAGE = "freeTrialKeyStorage"; // 旧的免费试玩Key存储

const settingsText = {
    settingsTitle: "设置",
    apiKeyLabel: "API Key",
    apiUrlLabel: "API URL",
    whatIsThisButton: "这是什么？",
    saveButton: "保存设置",
    publicKeyButton: "已获取公共key",
    resetSettingsButton: "恢复默认设置",
    exitButton: "不保存退出",
    helpModalTitle: "帮助信息",
    helpContent: `
        <p>本游戏<strong>基于</strong>可访问<strong>大语言模型</strong>的接口API进行，您可自行寻找相关API服务，默认API地址不构成推荐建议</p>
        <p>第一次打开游戏网页时会自动尝试获取公共key，所以您可能直接开始游戏就可以游玩了。</p>
        <p>公共key是作者买来给大家玩的</p>
        <p>如遇无法输入API KEY，可以刷新网页</p>
    `,
    helpCloseButton: "关闭",
    settingsSavedAlert: "设置已保存",
    settingsResetAlert: "设置已恢复默认",
    publicKeyFetching: "获取中...",
    publicKeyFetched: "公共 Key 已成功获取并保存",
    publicKeyFetchedAlert: "公共 Key 已成功获取并保存\n\n请使用指定API URL：\nhttps://llm.tobenot.top/api/v1/",
    publicKeyFetchFailed: "公共 Key 获取失败，可尝试其他网络环境",
    advancedModelLabel: "进阶模型 (用于桥段总结)",
    basicModelLabel: "基本模型 (用于其他操作)",
};

const DEV_API_URL = 'https://api.deepbricks.ai/v1/';

// 添加模型枚举
const ModelType = {
  ADVANCED: 'advanced',
  BASIC: 'basic'
};

// 添加模型映射
const ModelMapping = {
  [ModelType.ADVANCED]: 'gpt-4o-mini',
  [ModelType.BASIC]: 'gpt-4o-mini'
};

function initSettingsUI() {
    document.getElementById('settingTitle').innerText = settingsText.settingsTitle;
    document.getElementById('settingApiKeyLabel').innerText = settingsText.apiKeyLabel;
    document.getElementById('settingApiUrlLabel').innerText = settingsText.apiUrlLabel;
    document.getElementById('settingWhatIsThisButton').innerText = settingsText.whatIsThisButton;
    document.getElementById('settingSaveButton').innerText = settingsText.saveButton;
    document.getElementById('settingPublicKeyButton').innerText = settingsText.publicKeyButton;
    document.getElementById('settingResetSettingsButton').innerText = settingsText.resetSettingsButton;
    document.getElementById('settingExitButton').innerText = settingsText.exitButton;
}

function saveSettings(isAuto = false) {
    const apiKeyInput = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

    let apiKey = apiKeyInput;
    if (isPublicKey && !apiKeyInput) {
        apiKey = publicKey;
    } else {
        localStorage.setItem(PUBLIC_KEY_FLAG, 'false');
        localStorage.removeItem(PUBLIC_KEY_STORAGE);
    }

    const advancedModel = document.getElementById('advanced-model-select').value || ModelMapping[ModelType.ADVANCED];
    const basicModel = document.getElementById('basic-model-select').value || ModelMapping[ModelType.BASIC];

    const settings = {
        apiKey: apiKey,
        apiUrl: apiUrl,
        [ModelType.ADVANCED]: advancedModel,
        [ModelType.BASIC]: basicModel
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    if(!isAuto){
        alert(settingsText.settingsSavedAlert);
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
        
        // 打印日志
        console.log('已加载设置：', {
            apiKey: isPublicKey ? '使用公共密钥' : '使用私人密钥',
            apiUrl: savedSettings.apiUrl,
            advancedModel: savedSettings[ModelType.ADVANCED],
            basicModel: savedSettings[ModelType.BASIC]
        });

        // 根据是否为本地开发环境选择API URL
        const apiUrl = isLocalDevelopment() ? DEV_API_URL : savedSettings.apiUrl;
        document.getElementById('api-url').value = apiUrl;
        
        // 设置进阶模型和基本模型的选择
        document.getElementById('advanced-model-select').value = savedSettings[ModelType.ADVANCED] || ModelMapping[ModelType.ADVANCED];
        document.getElementById('basic-model-select').value = savedSettings[ModelType.BASIC] || ModelMapping[ModelType.BASIC];
    } else {
        // 默认设置
        const settings = {
            apiKey: '',
            apiUrl: isLocalDevelopment() ? DEV_API_URL : 'https://llm.tobenot.top/api/v1/',
            [ModelType.ADVANCED]: ModelMapping[ModelType.ADVANCED],
            [ModelType.BASIC]: ModelMapping[ModelType.BASIC]
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
        apiUrl: 'https://llm.tobenot.top/api/v1/',
        [ModelType.ADVANCED]: ModelMapping[ModelType.ADVANCED],
        [ModelType.BASIC]: ModelMapping[ModelType.BASIC]
    };
    localStorage.setItem('settings', JSON.stringify(defaultSettings));
    getPublicKey(true);
    loadSettings();
    updateSettingsUI(defaultSettings);
    alert(settingsText.settingsResetAlert);
}

function updateSettingsUI(settings) {
    document.getElementById('api-key').value = settings.apiKey;
    document.getElementById('api-url').value = settings.apiUrl;
    document.getElementById('advanced-model-select').value = settings[ModelType.ADVANCED];
    document.getElementById('basic-model-select').value = settings[ModelType.BASIC];
}

function decrypt(data, key) {
    const bytes = CryptoJS.AES.decrypt(data, key);
    return bytes.toString(CryptoJS.enc.Utf8);
}

function getPublicKey(isAuto = false) {
    const trialStatus = document.getElementById('trialStatus');
    trialStatus.innerText = settingsText.publicKeyFetching;
    fetch('https://tobenot.top/storage/keyb.txt')
        .then(response => response.text())
        .then(encryptedKey => {
            // 解密公共 Key
            const decryptedKey = decrypt(encryptedKey, ENCRYPTION_KEY);

            // 不显示公共 Key，但将其保存到本地存储
            document.getElementById('api-key').value = '';
            document.getElementById('api-key').disabled = true;
            document.getElementById('settingPublicKeyButton').innerText = settingsText.publicKeyFetched;
            if(!isAuto){
                document.getElementById('settingPublicKeyButton').disabled = true;
            }
            trialStatus.innerText = '';

            // 存储公共 Key 并标记
            localStorage.setItem(PUBLIC_KEY_STORAGE, decryptedKey);
            localStorage.setItem(PUBLIC_KEY_FLAG, 'true');

            if(!isAuto){
                alert(settingsText.publicKeyFetchedAlert);
                const url = 'https://llm.tobenot.top/api/v1/';
                navigator.clipboard.writeText(url).then(function() {
                    console.log('复制到剪贴板成功');
                }, function(err) {
                    console.error('复制到剪贴板失败: ', err);
                });
            }
            saveSettings(isAuto)
        })
        .catch(error => {
            trialStatus.innerText = '获取失败';
            console.error('Error getting public key:', error);
            alert(settingsText.publicKeyFetchFailed);
        });
}

function showSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

    if (savedSettings) {
        updateSettingsUI(savedSettings);
        // 如果是公共Key，则不显示在输入框中
        document.getElementById('api-key').value = isPublicKey ? "" : savedSettings.apiKey;
        // 设置API Key输入框类型为密码
        document.getElementById('api-key').type = "password";
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
    const isPublicKey = localStorage.getItem(PUBLIC_KEY_FLAG) === 'true';
    const savedSettings = JSON.parse(localStorage.getItem('settings'));

    if ((isFreeTrialKey || isPublicKey) && savedSettings && savedSettings.apiUrl === 'https://openkey.cloud/v1/') {
        // 7.10更新 迁移 API URL
        savedSettings.apiUrl = 'https://llm.tobenot.top/api/v1/';
        localStorage.setItem('settings', JSON.stringify(savedSettings));

        // 如果是旧的免费试用 Key，则迁移并重新获取公共 Key
        if (isFreeTrialKey && freeTrialKey) {
            localStorage.setItem(PUBLIC_KEY_STORAGE, freeTrialKey);
            localStorage.setItem(PUBLIC_KEY_FLAG, 'true');
            localStorage.removeItem(FREE_TRIAL_KEY_FLAG);
            localStorage.removeItem(FREE_TRIAL_KEY_STORAGE);
        } 
        
        // 重新获取公共 Key
        getPublicKey(true);  
    }
}

function showHelp() {
    document.getElementById('modalTitle').innerText = settingsText.helpModalTitle;
    document.getElementById('modalContent').innerHTML = settingsText.helpContent;
    document.getElementById('modal').style.display = 'flex';
}

function isLocalDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// 新增函数，用于获取当前环境的API URL
function getApiUrl() {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    return isLocalDevelopment() ? DEV_API_URL : (savedSettings ? savedSettings.apiUrl : 'https://llm.tobenot.top/api/v1/');
}

// 新增函数，用于获取当前环境的模型
function getModel(modelType = ModelType.BASIC) {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    return savedSettings ? (savedSettings[modelType] || ModelMapping[modelType]) : ModelMapping[modelType];
}

// 导出需要在其他文件中使用的函数和常量
window.getModel = getModel;
window.ModelType = ModelType;