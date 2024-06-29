// scriptLoader
const scripts = [
    { url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', alias: '加密模块' },
    { url: 'scripts/loadLanguage.js', alias: '多语言模块' },
    { url: 'scripts/sections.js', alias: '桥段模块' },
    { url: 'scripts/saveLoad.js', alias: '存档模块' },
    { url: 'scripts/interactionHandler.js', alias: '主玩法模块' },
    { url: 'scripts/ui.js', alias: 'UI 模块' },
    { url: 'scripts/settings.js', alias: '设置模块' },
    { url: 'scripts/termsHandler.js', alias: '术语介绍模块' },
    { url: 'scripts/multimediaHandler.js', alias: '多媒体模块' },
    { url: 'scripts/reviewHandler.js', alias: '回顾模块' },
];

async function loadScript(url, alias) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${url}?v=${new Date().getTime()}`;
        script.defer = true;
        script.onload = () => {
            updateProgress(alias, scripts.length);
            resolve(url);
        };
        script.onerror = () => {
            updateProgress(alias, scripts.length);
            reject(url);
        };
        document.body.appendChild(script);
    });
}

function updateProgress(alias, totalScripts) {
    const loadedScripts = scripts.indexOf(alias) + 1; // 已加载脚本的数量
    const progress = (loadedScripts / totalScripts) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
    document.getElementById('progressText').innerText = `正在加载${alias}... (${loadedScripts}/${totalScripts})`;
}

async function initializeApp() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');

        for (const script of scripts) {
            await loadScript(script.url, script.alias);
        }

        loadingIndicator.style.display = 'none';
        document.getElementById('menu').style.display = 'flex';

        // 'scripts/ui.js',
        initializeUI();
        // 'scripts/sections.js',
        initializeGameState(loadSave());
        loadSectionsIndex(); // 加载章节索引
        // 'scripts/saveLoad.js',
        checkSaveStatus();
        // 'scripts/settings.js',
        loadSettings();
        // 'scripts/termsHandler.js'
        loadColorsConfig();
        loadTermsConfig();
        // 'scripts/loadLanguage.js'
        loadLanguageFile('zh-CN');  

    } catch (error) {
        console.error("Error loading scripts: ", error);
    }

    console.log('startup.js initializeApp finished');

    document.addEventListener('touchmove', function (event) {
        let targetElement = event.target;

        if (targetElement !== document.body && targetElement !== document.documentElement) {
            return;
        }

        event.preventDefault();
    }, { passive: false });
}

function isCarrotTest() {
    return new URLSearchParams(window.location.search).has('carrot');
}
