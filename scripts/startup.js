// pyodideLoader
(async function loadPyodideAndPackages() {
    try {
        window.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
        });
        console.log('Pyodide loaded');
        console.log('Pyodide loaded and packages installed');
    } catch (error) {
        console.error("Failed to load Pyodide:", error);
    }
})();
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
        // 加载 crypto 库
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
        // 加载语言文件
        await loadScript('scripts/loadLanguage.js');

        // 加载其余的脚本
        const scripts = [
            'scripts/sections.js',
            'scripts/saveLoad.js',
            'scripts/interactionHandler.js',
            'scripts/ui.js',
            'scripts/settings.js'
        ];

        for (const script of scripts) {
            await loadScript(script);
        }

        // 初始化UI和游戏设置
        initializeUI();
    } catch (error) {
        console.error("Error loading scripts: ", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(err => {
        console.error("Error initializing app: ", err);
    });

    // 禁止默认的触摸滚动行为
    document.addEventListener('touchmove', function (event) {
        // 获取触发事件的元素
        let targetElement = event.target;

        // 允许所有非body和html的元素滚动
        if (targetElement !== document.body && targetElement !== document.documentElement) {
            return; // 不阻止默认事件
        }

        // 对于其他元素，依然禁止滚动
        event.preventDefault();
    }, { passive: false });
});

eventListeners.js
document.getElementById("submitInputButton").addEventListener("click", submitUserInput);
document.getElementById("settingsButton").innerText = "设置";