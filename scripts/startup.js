// pyodideLoader
/*(async function loadPyodideAndPackages() {
    try {
        window.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
        });
        console.log('Pyodide loaded');
        console.log('Pyodide loaded and packages installed');
    } catch (error) {
        console.error("Failed to load Pyodide:", error);
    }
})();*/

// scriptLoader
async function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${url}?v=${new Date().getTime()}`;
        script.defer = true;
        script.onload = () => resolve(url);
        script.onerror = () => reject(url);
        document.body.appendChild(script);
    });
}

async function initializeApp() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');

        // 加载必要的脚本和资源
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        await loadScript('scripts/loadLanguage.js');

        const scripts = [
            'scripts/sections.js',
            'scripts/saveLoad.js',
            'scripts/interactionHandler.js',
            'scripts/ui.js',
            'scripts/settings.js',
            'scripts/termsHandler.js',
            'scripts/multimediaHandler.js',
            'scripts/reviewHandler.js'
        ];

        for (const script of scripts) {
            await loadScript(script);
        }

        // 隐藏加载指示器并显示主界面
        loadingIndicator.style.display = 'none';
        document.getElementById('menu').style.display = 'flex';

        // 'scripts/ui.js',
        initializeUI();
        // 'scripts/sections.js',
        initializeGameState(loadSave());
        loadSectionsIndex(); // 加载章节索引
        // 'scripts/saveLoad.js',
        checkSaveStatus();
        // 'scripts/interactionHandler.js',     
        // 'scripts/settings.js',
        loadSettings();
        // 'scripts/termsHandler.js'
        loadColorsConfig();
        loadTermsConfig();
        // 'scripts/multimediaHandler.js'
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