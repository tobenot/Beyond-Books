const scripts = [
    { url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', alias: '依赖库(这里卡住就是网炸了，刷新)' },
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

let loadedScriptsCount = 0;

async function loadScript(url, alias) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${url}?v=${new Date().getTime()}`;
        script.defer = true;
        script.onload = () => {
            loadedScriptsCount++;
            updateProgress(alias, scripts.length);
            resolve(url);
        };
        script.onerror = () => {
            loadedScriptsCount++;
            updateProgress(alias, scripts.length);
            reject(url);
        };
        document.body.appendChild(script);
    });
}

function updateProgress(alias, totalScripts) {
    const progress = (loadedScriptsCount / totalScripts) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
    document.getElementById('progressText').innerText = `正在加载${alias}... (${loadedScriptsCount}/${totalScripts})`;
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
        initSettingsUI();
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

const textResources = {
    creatorMessageTitle: "制作人的话",
    creatorMessageContent: `
        <p>《不止于纸上的故事》曾经是我在2015年主导创作的纸上游戏、桌上剧团<b>“BB”</b>，到了大学我翻遍字典，找到了 <b>Beyond Books</b> 这两个词。我很荣幸能将其搬到电子游戏中，终于能与大家分享我的故事。</p>
        <p>现代的大型语言模型可以帮我把大纲和细节演出的生动而充满意外，我不胜感激这个新时代。一个人做测试难免不周到，出bug还请多多海涵。</p>
        <p>目前的故事进行到了<strong>银月篇罗伯特线的完结部分</strong>，接下来打算更新其他人在银月篇的线！罗伯特线里面实际上有大量未解答的东西，到其他人的视角中也许就真相大白了~ 我追求其他人的线不与旧线重复，重复部分略过。</p>
        <p><strong>鸣谢与我交流的玩家们：</strong>佚名 裴冬柚 小沃里 shangui</p>
        <p><strong>致谢朋友们：</strong>TOLINIA Tourswen 镜子 Crystal 琼 玉米</p>
        <p><strong>敬谢大自然：</strong>海南之海 灵界之海</p>
        <p><strong>作者：</strong>苏敬峰/tobenot</p>
    `,
    updateLogTitle: "更新日志",
    updateLogContent: `
        <p>只有比较大的更新在这里展示</p>
        <p><strong>2024年7月10日</strong> 原来的公共key额度用完，换了新的一家。理论上旧存档会自动适配到新的公共key，如果还不行就跑去设置里恢复一下默认设置。</p>
        <p><strong>2024年7月02日</strong> 银月篇 罗伯特线 完结！</p>
        <p><strong>2024年6月26日</strong> 桥段回顾存储</p>
        <p><strong>2024年6月24日</strong> 高亮词展示</p>
        <p><strong>2024年6月23日</strong> 银月篇 罗伯特线 第二回</p>
        <p><strong>2024年6月19日</strong> 桥段解锁机制</p>
        <p><strong>2024年6月10日</strong> 银月篇 罗伯特线 开篇</p>
        <p><strong>2024年6月03日</strong> 开坑！</p>
    `,
}

function showCreatorsMessage() {
    document.getElementById('modalTitle').innerText = textResources.creatorMessageTitle;
    document.getElementById('modalContent').innerHTML = textResources.creatorMessageContent;
    document.getElementById('modal').style.display = 'flex';
}

function showUpdateLog() {
    document.getElementById('modalTitle').innerText = textResources.updateLogTitle;
    document.getElementById('modalContent').innerHTML = textResources.updateLogContent;
    document.getElementById('modal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}