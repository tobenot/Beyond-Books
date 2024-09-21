let lastMessageElement = null;
let isStreaming = false;
let fullContent = '';
let typingPromise = Promise.resolve();
let currentTypedLength = 0;

function updateDisplay(role, messageContent, streaming = false) {
    const storyContentDiv = document.getElementById('storyContent');
    
    if (streaming) {
        if (!isStreaming) {
            isStreaming = true;
            currentTypedLength = 0;
            fullContent = '';
            const messageElement = document.createElement('p');
            messageElement.setAttribute('data-role', role);
            storyContentDiv.appendChild(messageElement);
            lastMessageElement = messageElement;
        }
        // 更新 fullContent，但不直接显示
        fullContent = messageContent;
        // 继续使用打字机效果
        typingPromise = typingPromise.then(() => typewriterEffect(lastMessageElement, fullContent, role));
    } else {
        if (isStreaming) {
            // 流式传输结束，但不立即显示全部内容
            isStreaming = false;
            // 确保 typewriterEffect 会显示完整内容
            typingPromise = typingPromise.then(() => typewriterEffect(lastMessageElement, fullContent, role));
        } else {
            // 非流式传输的情况保持不变
            const messageElement = document.createElement('p');
            messageElement.setAttribute('data-role', role);
            messageElement.innerHTML = formatContent(role, messageContent);
            storyContentDiv.appendChild(messageElement);
            lastMessageElement = messageElement;
        }
    }
    
    lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function typewriterEffect(element, text, role) {
    let newText = text.slice(currentTypedLength);
    
    for (let i = 0; i < newText.length; i++) {
        await new Promise(resolve => {
            setTimeout(() => {
                currentTypedLength++;
                element.innerHTML = formatContent(role, text.slice(0, currentTypedLength));
                resolve();
            }, getDelay(newText[i]));
        });
    }
}

function getDelay(char) {
    if ('.。!！?？'.includes(char)) {
        return 200; // 标点符号停顿
    } else if (',，;；'.includes(char)) {
        return 100; // 次要标点停顿
    } else {
        return Math.random() * 10 + 10; // 随机停顿
    }
}

function formatContent(role, content) {
    if (!content) {
        console.error('formatContent 内容为空');
        return '';
    }
    
    if (role === 'user') {
        return `<i>${content}</i>`;
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
    const storyContent = createStoryContent(section, playerCharacter);
    const playerInfo = createPlayerInfo(playerCharacter);
    updateDisplay('info', storyContent);
    updateDisplay('info', playerInfo);
    if (section.musicUrl) {
        addMusicPlayer(section.musicUrl);
    }
    updateDisplay('assistant', section.startEvent);
    
    document.getElementById('storyContent').scrollTop = 0;
}

function createPlayerInfo(playerCharacter) {
    return `<b>你的角色：</b>
    <b>${playerCharacter.name}</b> - ${playerCharacter.role}
    ${playerCharacter.description}`;
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