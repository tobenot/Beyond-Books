let lastMessageElement = null;
let isStreaming = false;
let fullContent = '';
let typingPromise = Promise.resolve();
let currentTypedLength = 0;

function updateDisplay(role, messageContent, streaming = false) {
    const storyContentDiv = document.getElementById('storyContent');
    
    if (streaming) {
        messageManager.updateMessage(role, messageContent);
    } else {
        if(messageManager.isMessageStreaming(messageContent)){
            return;
        }
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.setAttribute('data-role', role);
        messageElement.innerHTML = formatContent(role, messageContent);
        storyContentDiv.appendChild(messageElement);
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

async function typewriterEffect(element, text, role) {
    let newText = text.slice(currentTypedLength);
    
    for (let i = 0; i < newText.length; i++) {
        await new Promise(resolve => {
            setTimeout(() => {
                currentTypedLength++;
                element.innerHTML = formatContent(role, text.slice(0, currentTypedLength)) + '<br><br>'; // 添加两个空行
                
                // 检查是否接近底部,如果是则滚动
                const storyContentDiv = document.getElementById('storyContent');
                const scrollPosition = storyContentDiv.scrollTop + storyContentDiv.clientHeight;
                const scrollThreshold = storyContentDiv.scrollHeight - 100; // 将阈值调整为距离底部50像素
                
                if (scrollPosition >= scrollThreshold) {
                    storyContentDiv.scrollTop = storyContentDiv.scrollHeight; // 直接滚动到底部
                }
                
                resolve();
            }, 10); // 使用固定的短延迟
        });

        // 在字符输出后检查是否需要额外延迟
        if (i < newText.length - 1) {
            await new Promise(resolve => {
                setTimeout(resolve, getDelay(newText[i]));
            });
        }
    }
}

function getDelay(char) {
    if ('.。!！?？'.includes(char)) {
        return 300; // 主要标点符号后的停顿
    } else if (',，;；'.includes(char)) {
        return 100; // 次要标点符号后的停顿
    } else {
        return Math.random() * 20 + 10; // 普通字符
    }
}

function formatContent(role, content) {
    if (!content) {
        console.error('formatContent 内容为空');
        return '';
    }
    
    if (role === 'user') {
        return `<i>${content}</i>`;
    } else if (role === 'centered') {
        // 对于居中内容，不进行特殊格式化
        return content;
    } else {
        const formattedContent = content.replace(/\n/g, '<br>');
        return highlightSpecialTerms(formattedContent);
    }
}

function toggleSubmittingState(isSubmittingFlag, loadingDiv, userInputField, submitButton) {
    setIsSubmitting(isSubmittingFlag);
    setIsCooldown(true);

    loadingDiv.style.display = isSubmittingFlag ? 'block' : 'none';
    userInputField.style.display = isSubmittingFlag ? 'none' : 'block';
    submitButton.style.display = isSubmittingFlag ? 'none' : 'block';
}

function prepareUI(section) {
    document.getElementById('storyContent').innerHTML = '';
    toggleSectionVisibility();
}

function createStoryContent(section, playerCharacter) {
    return `<h2>${section.title}</h2><div class="image-container"><img src="${section.image}" alt="桥段图片"></div><p><b>目标：${section.objective}</b></p><p>${section.backgroundInfo}</p>`;
}

function displayInitialContent(section) {
    const playerCharacter = section.characters.find(char => char.name === selectedCharacter);
    const storyContentDiv = document.getElementById('storyContent');
    
    // 创建居中的初始内容
    let initialContent = `
        <h2>${section.title}</h2>
        <div class="image-container"><img src="${section.image}" alt="桥段图片"></div>
    `;
    
    // 添加音乐播放器（如果有）
    if (section.musicUrl) {
        initialContent += `<div class="music-player" id="musicPlayer"></div>`;
    }
    
    initialContent += `
        <p><b>目标：${section.objective}</b></p>
        <p>${section.backgroundInfo}</p>
    `;
    
    // 使用新的 centered data-role 显示初始内容
    updateDisplay('centered', initialContent);
    
    // 如果有音乐，在内容添加后再添加音乐播放器
    if (section.musicUrl) {
        const musicPlayerDiv = document.getElementById('musicPlayer');
        addMusicPlayer(section.musicUrl, musicPlayerDiv);
    }
    
    // 添加玩家信息和开始事件
    const playerInfo = createPlayerInfo(playerCharacter);
    updateDisplay('info', playerInfo);
    updateDisplay('assistant', section.startEvent);
    
    document.getElementById('storyContent').scrollTop = 0;
}

function createPlayerInfo(playerCharacter) {
    let info = `<b>你的角色：</b>
    <b>${playerCharacter.name}</b>
    ${playerCharacter.description}`;    
    playerCharacter.characterTags.forEach(tagKey => {
        const tagValue = gameManager.getCharacterTag(tagKey);
        if (tagValue) {
            info += `- ${tagKey}: ${tagValue}<br>`;
        }
    });
    
    return info;
}

function disableInput() {
    const userInputField = document.getElementById('userInput');
    const submitButton = document.getElementById('submitInputButton');
    userInputField.disabled = true;
    submitButton.disabled = true;
}

function enableInput() {
    const userInputField = document.getElementById('userInput');
    const submitButton = document.getElementById('submitInputButton');
    userInputField.disabled = false;
    submitButton.disabled = false;
    userInputField.style.display = "flex";
    submitButton.style.display = "flex";
}

function createCompleteButton() {
    const completeButton = document.createElement('button');
    completeButton.className = 'button';
    completeButton.innerText = '返回桥段选择';
    completeButton.onclick = returnToSectionSelection;

    return completeButton;
}

function getElements() {
    return {
        submitButton: document.getElementById('submitInputButton'),
        userInputField: document.getElementById('userInput'),
        loadingDiv: document.getElementById('loading')
    };
}

function toggleSectionVisibility() {
    document.getElementById('sectionsContainer').style.display = 'none';
    document.getElementById('storyContainer').style.display = 'flex';
}

// 初始化UI处理器
function initializeUIHandler() {
    console.log("UI处理器已初始化");
}

function updateInteractionStage(stage, info) {
    const interactionStageDiv = document.getElementById('interactionStage');
    const stageTextElement = document.getElementById('stageText');
    
    stageTextElement.textContent = `${stage}: ${info}`;
    interactionStageDiv.style.display = 'block';
    
    // 确保新添加的元素可见
    interactionStageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function hideInteractionStage() {
    document.getElementById('interactionStage').style.display = 'none';
}