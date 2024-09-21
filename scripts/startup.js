const scripts = [
    { url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js', alias: '依赖库(这里卡住就是网炸了，刷新)' },
    { url: 'scripts/loadLanguage.js', alias: '多语言模块' },
    { url: 'scripts/sections.js', alias: '桥段模块' },
    { url: 'scripts/saveLoad.js', alias: '存档模块' },
    { url: 'scripts/interaction/GlobalState.js', alias: '交互：全局状态模块' },
    { url: 'scripts/interaction/Moderator.js', alias: '交互：主持人模块' },
    { url: 'scripts/interaction/AIPlayer.js', alias: '交互：AI玩家模块' },
    { url: 'scripts/interaction/GameManager.js', alias: '交互：游戏管理模块' },
    { url: 'scripts/interaction/UIHandler.js', alias: '交互：游戏UI模块' },
    { url: 'scripts/interaction/InteractionProcess.js', alias: '交互：处理模块' },
    { url: 'scripts/interaction/EndingHandler.js', alias: '交互：结局处理模块' },
    { url: 'scripts/interaction/GameInitializer.js', alias: '交互：游戏初始化模块' },
    { url: 'scripts/interaction/StreamHandler.js', alias: '交互：流式处理模块' }, // 新增
    { url: 'scripts/ui.js', alias: '主UI模块' },
    { url: 'scripts/settings.js', alias: '设置模块' },
    { url: 'scripts/termsHandler.js', alias: '术语模块' },
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

async function loadComponent(name) {
    const response = await fetch(`components/${name}.html?v=${new Date().getTime()}`);
    const html = await response.text();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.getElementById('app').appendChild(tempDiv.firstElementChild);
}

async function initializeApp() {
    try {
        await loadComponent('LoadingIndicator');
        await loadComponent('Menu');
        await loadComponent('SectionsContainer');
        await loadComponent('StoryContainer');
        await loadComponent('Settings');
        await loadComponent('Modal');

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

        // 初始化交互相关模块
        initializeInteractionModules();

    } catch (error) {
        console.error("Error loading scripts or components: ", error);
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
        <p><strong>鸣谢与我交流的玩家们：</strong>小沃里 佚名 裴冬柚 shangui</p>
        <p><strong>致谢朋友们：</strong>TOLINIA Tourswen 镜子 Crystal 琼 玉米</p>
        <p><strong>敬谢大自然：</strong>海南之海 灵界之海</p>
        <p><strong>作者：</strong>苏敬峰/tobenot</p>
    `,
    updateLogTitle: "更新日志",
    updateLogContent: `
        <p>只有比较大的更新在这里展示</p>
        <p><strong>2024年8月22日</strong> 增加了游戏教程，点一下开始游戏就给你弹窗。</p>
        <p><strong>2024年7月23日</strong> 优化了交互环节，应该能感受到大部分桥段更容易结算了。在设置里添加了两个比较小的模型（实测不太行）。做了跳关功能，免得手上没存档要重打。</p>
        <p><strong>2024年7月10日</strong> 原来的公共key额度用完，换了新的一家。理论上旧存档会自动适配到新的公共key，如果还不行就跑去设置里恢复一下默认设置。</p>
        <p><strong>2024年7月02日</strong> 银月篇 罗伯特线 完结！</p>
        <p><strong>2024年6月26日</strong> 桥段回顾存储</p>
        <p><strong>2024年6月24日</strong> 高亮词展示</p>
        <p><strong>2024年6月23日</strong> 银月篇 罗伯特线 第二回</p>
        <p><strong>2024年6月19日</strong> 桥段解锁机制</p>
        <p><strong>2024年6月10日</strong> 银月篇 罗伯特线 开篇</p>
        <p><strong>2024年6月03日</strong> 开坑！</p>
    `,
    gameTutorialTitle: "游戏教程",
    gameTutorialContent: `
        <p>你可以把本游戏理解为<strong>跑团（DND或COC）</strong>、<strong>语C</strong>、<strong>剧本杀</strong>或<strong>过家家</strong>🧑‍🤝‍🧑。本游戏制作时面向的玩家是<strong>喜欢剧情向游戏</strong>，愿意<strong>认真扮演角色</strong>🎭  的语C、跑团玩家👥。</p>
        <ol>
            <li>📝 <strong>目标</strong>：在每一个桥段里，你需要完成<strong>桥段目标</strong>🎯，目标可能是<strong>沟通</strong>💬、<strong>战斗</strong>⚔️、<strong>解密</strong>🧩等。</li>
            <li>🎮 <strong>操作</strong>：根据你的人设和起始事件，在对话框中打字输入以<strong>你的角色的角度</strong>进行的行动、说的话🗣️。比如输入"我挥起武器说，与我何干！"，不需要特别注意格式。</li>
            <li>💡 <strong>技巧</strong>：很多角色有<strong>超能力</strong>🔮，比如银月篇主角罗伯特，可以<strong>减缓时间流速</strong>🕰️，你可以接住敌方扔来的飞刀扔回去🗡️，也能准确地瞄准你要攻击的物件🎯，只要你能想到。</li>
        </ol>

        <ul>
            <li>⚠️ <strong>注意</strong>：如果出现输入之后无回复，可以回<strong>主菜单-设置</strong>⚙️里面点"<strong>恢复默认设置</strong>🔄"。一般是初始化的网络问题🌐。</li>
            <li>🔍 <strong>注意</strong>：高亮有颜色的文字可以点🔗。</li>
            <li>📜 <strong>注意</strong>：在<strong>桥段剧本</strong>之外，主持人给出的信息不完全保真（比如问队友问题，可能会得到不正确的回复🤔），可以完全取信的是非大模型的<strong>桥段剧本</strong>、<strong>初始事件</strong>、<strong>词条解释</strong>。</li>
        </ul>
    `
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

function showGameTutorial() {
    document.getElementById('modalTitle').innerText = textResources.gameTutorialTitle;
    document.getElementById('modalContent').innerHTML = textResources.gameTutorialContent;
    document.getElementById('modal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

function initializeInteractionModules() {
  // 这里调用各个新模块的初始化函数
  initializeGameManager();
  initializeUIHandler();
  initializeInteractionProcess();
  initializeEndingHandler();
  initializeGame();
  initializeStreamHandler(); // 新增
}